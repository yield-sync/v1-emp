// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IYieldSyncV1AMPStrategy } from "../interface/IYieldSyncV1AMPStrategy.sol";
import { IERC20, SafeERC20 } from "../interface/IYieldSyncV1AMPStrategyController.sol";


using SafeERC20 for IERC20;


interface IUniswapV2Pair
{
    function getReserves()
		external
		view
		returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)
	;

	function totalSupply()
		external
		view
		returns (uint256)
	;
}


interface IUniswapV2Router
{
	function addLiquidity(
		address tokenA,
		address tokenB,
		uint256 amountADesired,
		uint256 amountBDesired,
		uint256 amountAMin,
		uint256 amountBMin,
		address to,
		uint256 deadline
	)
		external
		returns (uint256 amountA, uint256 amountB, uint256 liquidity)
	;

	function removeLiquidity(
		address tokenA,
		address tokenB,
		uint256 liquidity,
		uint256 amountAMin,
		uint256 amountBMin,
		address to,
		uint256 deadline
	)
		external
		returns (uint256 amountA, uint256 amountB)
	;
}


/**
* @notice This strategy adds liquidity to a uniswap pool
*/
contract StrategyUniswapV2LiquidityPool is
	IYieldSyncV1AMPStrategy
{
	address public immutable liquidityPool;
    address public immutable weth;
	address public manager;
	address public strategyController;

	uint256 public slippageTolerance;

	IUniswapV2Pair public immutable uniswapV2Pair;
	IUniswapV2Router public immutable uniswapV2Router;

	constructor (
		address _liquidityPool,
		uint256 _slippageTolerance,
		address _strategyController,
		address _uniswapV2Pair,
		address _uniswapV2Router,
		address _weth
	)
	{
		liquidityPool = _liquidityPool;
		manager = msg.sender;
		slippageTolerance = _slippageTolerance;
		strategyController = _strategyController;
		weth = _weth;

		uniswapV2Pair = IUniswapV2Pair(_uniswapV2Pair);
		uniswapV2Router = IUniswapV2Router(_uniswapV2Router);
	}


	modifier onlyStrategyController()
	{
		require(msg.sender == strategyController, "msg.sender != strategyController");

		_;
	}


	/// @inheritdoc IYieldSyncV1AMPStrategy
	function utilizedTokenETHValue(address _token)
		public
		view
		override
		returns (uint256 tokenETHValue_)
	{
		(uint112 reserve0, uint112 reserve1, ) = uniswapV2Pair.getReserves();

		// If there is no liquidity then automatically the value will be 0
		if (uniswapV2Pair.totalSupply() == 0)
		{
			return 0;
		}

		// Return token price in terms of weth
		if (_token < weth)
		{
			return uint256(reserve1) * 1e18 / reserve0;
		}
		else
		{
			return uint256(reserve0) * 1e18 / reserve1;
		}
	}

	/// @inheritdoc IYieldSyncV1AMPStrategy
	function utilizedTokenTotalAmount(address[] memory _utilizedToken)
		public
		view
		override
		returns (uint256[] memory utilizedTokenAmount_)
	{
		uint256[] memory returnAmounts = new uint256[](_utilizedToken.length);

		uint256 liquidityPoolBalance = IERC20(address(uniswapV2Pair)).balanceOf(address(this));

		if (liquidityPoolBalance > 0)
		{
			(uint112 reserve0, uint112 reserve1, ) = uniswapV2Pair.getReserves();

			uint256 totalSupply = uniswapV2Pair.totalSupply();

			// Calculate each token's share based on LP token balance
			uint256 token0Amount = (uint256(reserve0) * liquidityPoolBalance) / totalSupply;
			uint256 token1Amount = (uint256(reserve1) * liquidityPoolBalance) / totalSupply;

			returnAmounts[0] = token0Amount;
			returnAmounts[1] = token1Amount;
		}
		else
		{
			returnAmounts[0] = 0;
			returnAmounts[1] = 0;
		}

		for (uint256 i = 0; i < _utilizedToken.length; i++)
		{
			returnAmounts[i] += IERC20(_utilizedToken[i]).balanceOf(address(this));
		}

		return returnAmounts;
	}


	/// @inheritdoc IYieldSyncV1AMPStrategy
	function utilizedTokenDeposit(address[] memory _utilizedToken, uint256[] memory _utilizedTokenAmount)
		public
		override
		onlyStrategyController()
	{
		IERC20(_utilizedToken[0]).safeTransferFrom(msg.sender, address(this), _utilizedTokenAmount[0]);
		IERC20(_utilizedToken[1]).safeTransferFrom(msg.sender, address(this), _utilizedTokenAmount[1]);

		IERC20(_utilizedToken[0]).safeApprove(address(uniswapV2Router), _utilizedTokenAmount[0]);
		IERC20(_utilizedToken[1]).safeApprove(address(uniswapV2Router), _utilizedTokenAmount[1]);

		uniswapV2Router.addLiquidity(
			_utilizedToken[0],
			_utilizedToken[1],
			_utilizedTokenAmount[0],
			_utilizedTokenAmount[1],
			_utilizedTokenAmount[0] * (10000 - slippageTolerance) / 10000,
			_utilizedTokenAmount[1] * (10000 - slippageTolerance) / 10000,
			address(this),
			block.timestamp
		);
	}

	/// @inheritdoc IYieldSyncV1AMPStrategy
	function utilizedTokenWithdraw(address _to, address[] memory _utilizedToken, uint256[] memory _utilizedTokenAmount)
		public
		override
		onlyStrategyController()
	{
		// Retrieve the current reserves to estimate the withdrawn amounts
		(uint256 reserveA, uint256 reserveB, ) = uniswapV2Pair.getReserves();

		// [calculate] Amount of tokens to be withdrawn given liquidity amount
		uint256 amountA = _utilizedTokenAmount[0] * reserveA / IERC20(liquidityPool).totalSupply();
		uint256 amountB = _utilizedTokenAmount[0] * reserveB / IERC20(liquidityPool).totalSupply();

		// Remove liquidity
		(uint256 amountRemovedA, uint256 amountRemovedB) = uniswapV2Router.removeLiquidity(
			_utilizedToken[0],
			_utilizedToken[1],
			_utilizedTokenAmount[0],
			amountA * (10000 - slippageTolerance) / 10000,
			amountB * (10000 - slippageTolerance) / 10000,
			address(this),
			block.timestamp
		);

		// Transfer the withdrawn tokens to the recipient
		IERC20(_utilizedToken[0]).safeTransfer(_to, amountRemovedA);
		IERC20(_utilizedToken[1]).safeTransfer(_to, amountRemovedB);
	}


	function slippageToleranceUpdate(uint256 _slippageTolerance)
		public
	{
		require(msg.sender == manager, "!manager");

		// Add access control if necessary
		slippageTolerance = _slippageTolerance;
	}
}
