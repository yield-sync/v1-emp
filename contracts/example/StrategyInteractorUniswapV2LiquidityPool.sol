// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IYieldSyncV1EMPStrategyInteractor } from "../interface/IYieldSyncV1EMPStrategyInteractor.sol";
import { IERC20, SafeERC20 } from "../interface/IYieldSyncV1EMPStrategy.sol";


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
contract StrategyInteractorUniswapV2LiquidityPool is
	IYieldSyncV1EMPStrategyInteractor
{
	address public immutable liquidityPool;
    address public immutable weth;
	address public manager;
	address public strategyController;

	bool internal _utilizedERC20DepositsOpen = true;
	bool internal _utilizedERC20WithdrawalsOpen = true;

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


	modifier onlyYieldSyncV1EMPStrategy()
	{
		require(msg.sender == strategyController, "msg.sender != strategyController");

		_;
	}

	modifier onlyYieldSyncV1EMPStrategyManager()
	{
		require(true, "");

		_;
	}


	/// @inheritdoc IYieldSyncV1EMPStrategyInteractor
	function utilizedERC20ETHValue(address _utilizedERC20)
		public
		view
		override
		returns (uint256 utilizedERC20ETHValue_)
	{
		(uint112 reserve0, uint112 reserve1, ) = uniswapV2Pair.getReserves();

		// If there is no liquidity then automatically the value will be 0
		if (uniswapV2Pair.totalSupply() == 0)
		{
			return 0;
		}

		// Return utilizedERC20 price in terms of weth
		if (_utilizedERC20 < weth)
		{
			return uint256(reserve1) * 1e18 / reserve0;
		}
		else
		{
			return uint256(reserve0) * 1e18 / reserve1;
		}
	}

	/// @inheritdoc IYieldSyncV1EMPStrategyInteractor
	function utilizedERC20TotalAmount(address[] memory _utilizedERC20)
		public
		view
		override
		returns (uint256[] memory utilizedERC20TotalAmount_)
	{
		uint256[] memory returnAmounts = new uint256[](_utilizedERC20.length);

		uint256 liquidityPoolBalance = IERC20(address(uniswapV2Pair)).balanceOf(address(this));

		if (liquidityPoolBalance > 0)
		{
			(uint112 reserve0, uint112 reserve1, ) = uniswapV2Pair.getReserves();

			uint256 totalSupply = uniswapV2Pair.totalSupply();

			// Calculate each utilizedERC20's share based on LP utilizedERC20 balance
			uint256 utilizedERC20AAmount = (uint256(reserve0) * liquidityPoolBalance) / totalSupply;
			uint256 utilizedERC20BAmount = (uint256(reserve1) * liquidityPoolBalance) / totalSupply;

			returnAmounts[0] = utilizedERC20AAmount;
			returnAmounts[1] = utilizedERC20BAmount;
		}
		else
		{
			returnAmounts[0] = 0;
			returnAmounts[1] = 0;
		}

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			returnAmounts[i] += IERC20(_utilizedERC20[i]).balanceOf(address(this));
		}

		return returnAmounts;
	}


	/// @inheritdoc IYieldSyncV1EMPStrategyInteractor
	function utilizedERC20Deposit(address _from, address[] memory _utilizedERC20, uint256[] memory _utilizedERC20Amount)
		public
		override
		onlyYieldSyncV1EMPStrategy()
	{
		IERC20(_utilizedERC20[0]).safeTransferFrom(_from, address(this), _utilizedERC20Amount[0]);
		IERC20(_utilizedERC20[1]).safeTransferFrom(_from, address(this), _utilizedERC20Amount[1]);

		IERC20(_utilizedERC20[0]).safeApprove(address(uniswapV2Router), _utilizedERC20Amount[0]);
		IERC20(_utilizedERC20[1]).safeApprove(address(uniswapV2Router), _utilizedERC20Amount[1]);
	}

	/// @inheritdoc IYieldSyncV1EMPStrategyInteractor
	function utilizedERC20Withdraw(address _to, address[] memory _utilizedERC20, uint256[] memory _utilizedERC20Amount)
		public
		override
		onlyYieldSyncV1EMPStrategy()
	{
		// Transfer the withdrawn utilizedERC20s to the recipient
		IERC20(_utilizedERC20[0]).safeTransfer(_to, _utilizedERC20Amount[0]);
		IERC20(_utilizedERC20[1]).safeTransfer(_to, _utilizedERC20Amount[1]);
	}


	/////////////////////////////////////////////
	/// NON-YIELD-SYNC-V1-EMP IMPLEMENTATIONS ///
	/////////////////////////////////////////////


	function slippageToleranceUpdate(uint256 _slippageTolerance)
		public
	{
		require(msg.sender == manager, "!manager");

		// Add access control if necessary
		slippageTolerance = _slippageTolerance;
	}

	function addLiquidity(address[] memory _utilizedERC20, uint256[] memory _utilizedERC20Amount)
		public
		onlyYieldSyncV1EMPStrategyManager()
	{
		uniswapV2Router.addLiquidity(
			_utilizedERC20[0],
			_utilizedERC20[1],
			_utilizedERC20Amount[0],
			_utilizedERC20Amount[1],
			_utilizedERC20Amount[0] * (10000 - slippageTolerance) / 10000,
			_utilizedERC20Amount[1] * (10000 - slippageTolerance) / 10000,
			address(this),
			block.timestamp
		);
	}

	function removeLiquidity(address[] memory _utilizedERC20, uint256[] memory _utilizedERC20Amount)
		public
		onlyYieldSyncV1EMPStrategyManager()
	{
		// Retrieve the current reserves to estimate the withdrawn amounts
		(uint256 reserveA, uint256 reserveB, ) = uniswapV2Pair.getReserves();

		// [calculate] Amount of utilizedERC20s to be withdrawn given liquidity amount
		uint256 amountA = _utilizedERC20Amount[0] * reserveA / IERC20(liquidityPool).totalSupply();
		uint256 amountB = _utilizedERC20Amount[0] * reserveB / IERC20(liquidityPool).totalSupply();

		// Remove liquidity
		uniswapV2Router.removeLiquidity(
			_utilizedERC20[0],
			_utilizedERC20[1],
			_utilizedERC20Amount[0],
			amountA * (10000 - slippageTolerance) / 10000,
			amountB * (10000 - slippageTolerance) / 10000,
			address(this),
			block.timestamp
		);
	}
}
