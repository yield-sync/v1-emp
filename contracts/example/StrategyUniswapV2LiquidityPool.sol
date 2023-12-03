// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


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
contract StrategyHandlerUniswapV2LiquidityPool
{
	address public immutable liquidityPool;
    address public immutable weth;
	address public manager;

	uint256 public slippageTolerance;

	IUniswapV2Pair public immutable uniswapV2Pair;
	IUniswapV2Router public immutable uniswapV2Router;

	constructor (
		address _liquidityPool,
		address _weth,
		address _uniswapV2Pair,
		address _uniswapV2Router,
		uint256 _slippageTolerance
	)
	{
		manager = msg.sender;

		liquidityPool = _liquidityPool;
		weth = _weth;

		slippageTolerance = _slippageTolerance;

		uniswapV2Pair = IUniswapV2Pair(_uniswapV2Pair);
		uniswapV2Router = IUniswapV2Router(_uniswapV2Router);
	}

	function positionETHValue(address[] memory _utilizedToken, address _target)
		public
		view
		returns (uint256 positionETHValue_)
	{
		uint256 balance = IERC20(liquidityPool).balanceOf(_target);

		// No balance -> automatically worth 0
		if (balance <= 0)
		{
			return 0;
		}

		(uint112 reserve0, uint112 reserve1, ) = uniswapV2Pair.getReserves();

		uint256 totalSupply = uniswapV2Pair.totalSupply();

		// If there is no liquidity then automatically the LP token value will be 0
		if (totalSupply == 0)
		{
			return 0;
		}

		uint256 amount0PerLPToken = uint256(reserve0) / totalSupply;
		uint256 amount1PerLPToken = uint256(reserve1) / totalSupply;

		// Return total value of both output tokens denomintaed in weth
		return balance * amount0PerLPToken * utilizedTokenETHValue(
			_utilizedToken[0]
		) + balance * amount1PerLPToken * utilizedTokenETHValue(
			_utilizedToken[1]
		);
	}
	function utilizedTokenETHValue(address _token)
		public
		view
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

	function utilizedTokenDeposit(address[] memory _utilizedToken, uint256[] memory _amount)
		public
	{
		IERC20(_utilizedToken[0]).safeTransferFrom(msg.sender, address(this), _amount[0]);
		IERC20(_utilizedToken[1]).safeTransferFrom(msg.sender, address(this), _amount[1]);

		IERC20(_utilizedToken[0]).safeApprove(address(uniswapV2Router), _amount[0]);
		IERC20(_utilizedToken[1]).safeApprove(address(uniswapV2Router), _amount[1]);

		uniswapV2Router.addLiquidity(
			_utilizedToken[0],
			_utilizedToken[1],
			_amount[0],
			_amount[1],
			_amount[0] * (10000 - slippageTolerance) / 10000,
			_amount[1] * (10000 - slippageTolerance) / 10000,
			address(this),
			block.timestamp
		);
	}

	function utilizedTokenWithdraw(address[] memory _utilizedToken, uint256[] memory _amount)
		public
	{
		// Retrieve the current reserves to estimate the withdrawn amounts
		(uint256 reserveA, uint256 reserveB, ) = uniswapV2Pair.getReserves();

		// [calculate] Amount of tokens to be withdrawn given liquidity amount
		uint256 amountA = _amount[0] * reserveA / IERC20(liquidityPool).totalSupply();
		uint256 amountB = _amount[0] * reserveB / IERC20(liquidityPool).totalSupply();

		// Remove liquidity
		(uint256 amountRemovedA, uint256 amountRemovedB) = uniswapV2Router.removeLiquidity(
			_utilizedToken[0],
			_utilizedToken[1],
			_amount[0],
			amountA * (10000 - slippageTolerance) / 10000,
			amountB * (10000 - slippageTolerance) / 10000,
			address(this),
			block.timestamp
		);

		// Transfer the withdrawn tokens to the recipient
		IERC20(_utilizedToken[0]).safeTransfer(msg.sender, amountRemovedA);
		IERC20(_utilizedToken[1]).safeTransfer(msg.sender, amountRemovedB);
	}

	function slippageToleranceUpdate(uint256 _slippageTolerance)
		public
	{
		require(msg.sender == manager, "!manager");

		// Add access control if necessary
		slippageTolerance = _slippageTolerance;
	}

	function utilizedTokenAmount()
		public
		returns (uint256[] memory utilizedTokenAmount_)
	{
		uint256[] memory returnAmounts;

		return returnAmounts;
	}
}
