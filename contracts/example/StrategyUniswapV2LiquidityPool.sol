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
	function eRC20ETHValue(address _eRC20)
		public
		view
		override
		returns (uint256 eRC20ETHValue_)
	{
		(uint112 reserve0, uint112 reserve1, ) = uniswapV2Pair.getReserves();

		// If there is no liquidity then automatically the value will be 0
		if (uniswapV2Pair.totalSupply() == 0)
		{
			return 0;
		}

		// Return eRC20 price in terms of weth
		if (_eRC20 < weth)
		{
			return uint256(reserve1) * 1e18 / reserve0;
		}
		else
		{
			return uint256(reserve0) * 1e18 / reserve1;
		}
	}

	/// @inheritdoc IYieldSyncV1AMPStrategy
	function eRC20TotalAmount(address[] memory _eRC20)
		public
		view
		override
		returns (uint256[] memory eRC20okenAmount_)
	{
		uint256[] memory returnAmounts = new uint256[](_eRC20.length);

		uint256 liquidityPoolBalance = IERC20(address(uniswapV2Pair)).balanceOf(address(this));

		if (liquidityPoolBalance > 0)
		{
			(uint112 reserve0, uint112 reserve1, ) = uniswapV2Pair.getReserves();

			uint256 totalSupply = uniswapV2Pair.totalSupply();

			// Calculate each eRC20's share based on LP eRC20 balance
			uint256 eRC20AAmount = (uint256(reserve0) * liquidityPoolBalance) / totalSupply;
			uint256 eRC20BAmount = (uint256(reserve1) * liquidityPoolBalance) / totalSupply;

			returnAmounts[0] = eRC20AAmount;
			returnAmounts[1] = eRC20BAmount;
		}
		else
		{
			returnAmounts[0] = 0;
			returnAmounts[1] = 0;
		}

		for (uint256 i = 0; i < _eRC20.length; i++)
		{
			returnAmounts[i] += IERC20(_eRC20[i]).balanceOf(address(this));
		}

		return returnAmounts;
	}


	/// @inheritdoc IYieldSyncV1AMPStrategy
	function eRC20Deposit(address[] memory _eRC20, uint256[] memory _eRC20Amount)
		public
		override
		onlyStrategyController()
	{
		IERC20(_eRC20[0]).safeTransferFrom(msg.sender, address(this), _eRC20Amount[0]);
		IERC20(_eRC20[1]).safeTransferFrom(msg.sender, address(this), _eRC20Amount[1]);

		IERC20(_eRC20[0]).safeApprove(address(uniswapV2Router), _eRC20Amount[0]);
		IERC20(_eRC20[1]).safeApprove(address(uniswapV2Router), _eRC20Amount[1]);

		uniswapV2Router.addLiquidity(
			_eRC20[0],
			_eRC20[1],
			_eRC20Amount[0],
			_eRC20Amount[1],
			_eRC20Amount[0] * (10000 - slippageTolerance) / 10000,
			_eRC20Amount[1] * (10000 - slippageTolerance) / 10000,
			address(this),
			block.timestamp
		);
	}

	/// @inheritdoc IYieldSyncV1AMPStrategy
	function eRC20Withdraw(address _to, address[] memory _eRC20, uint256[] memory _eRC20Amount)
		public
		override
		onlyStrategyController()
	{
		// Retrieve the current reserves to estimate the withdrawn amounts
		(uint256 reserveA, uint256 reserveB, ) = uniswapV2Pair.getReserves();

		// [calculate] Amount of eRC20s to be withdrawn given liquidity amount
		uint256 amountA = _eRC20Amount[0] * reserveA / IERC20(liquidityPool).totalSupply();
		uint256 amountB = _eRC20Amount[0] * reserveB / IERC20(liquidityPool).totalSupply();

		// Remove liquidity
		(uint256 amountRemovedA, uint256 amountRemovedB) = uniswapV2Router.removeLiquidity(
			_eRC20[0],
			_eRC20[1],
			_eRC20Amount[0],
			amountA * (10000 - slippageTolerance) / 10000,
			amountB * (10000 - slippageTolerance) / 10000,
			address(this),
			block.timestamp
		);

		// Transfer the withdrawn eRC20s to the recipient
		IERC20(_eRC20[0]).safeTransfer(_to, amountRemovedA);
		IERC20(_eRC20[1]).safeTransfer(_to, amountRemovedB);
	}


	function slippageToleranceUpdate(uint256 _slippageTolerance)
		public
	{
		require(msg.sender == manager, "!manager");

		// Add access control if necessary
		slippageTolerance = _slippageTolerance;
	}
}
