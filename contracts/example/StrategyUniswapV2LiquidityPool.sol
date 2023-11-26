// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IERC20, ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { Allocation, IYieldSyncV1StrategyHandler } from "../interface/IYieldSyncV1StrategyHandler.sol";


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
	IYieldSyncV1StrategyHandler,
	ERC20
{
	address public immutable LIQUIDITY_POOL;
    address public immutable WETH;
	address public manager;

	uint256 public slippageTolerance;

	address[] internal _utilizedToken;


	mapping (address token => bool utilized) internal _token_utilized;

	mapping (address token => Allocation allocation) internal _token_allocation;


	IUniswapV2Pair public immutable uniswapV2Pair;
	IUniswapV2Router public immutable uniswapV2Router;


	constructor (
		address _LIQUIDITY_POOL,
		address _WETH,
		address _tokenA,
		address _tokenB,
		address _uniswapV2Pair,
		address _uniswapV2Router,
		string memory name,
		string memory symbol
	)
		ERC20(name, symbol)
	{
		manager = msg.sender;

		LIQUIDITY_POOL = _LIQUIDITY_POOL;
		WETH = _WETH;

		_utilizedToken.push(_tokenA);
		_utilizedToken.push(_tokenB);

		_token_utilized[_tokenA] = true;
		_token_utilized[_tokenB] = true;

		uniswapV2Pair = IUniswapV2Pair(_uniswapV2Pair);
		uniswapV2Router = IUniswapV2Router(_uniswapV2Router);
	}


	/// @inheritdoc IYieldSyncV1StrategyHandler
	function token_allocation(address token)
		external
		view
		override
		returns (Allocation memory)
	{
		return _token_allocation[token];
	}

	/// @inheritdoc IYieldSyncV1StrategyHandler
	function token_utilized(address _token)
		public
		view
		override
		returns (bool utilized_)
	{
		return _token_utilized[_token];
	}


	/// @inheritdoc IYieldSyncV1StrategyHandler
	function positionValueInWETH(address _target)
		public
		view
		override
		returns (uint256 positionValueInEth_)
	{
		uint256 balance = IERC20(LIQUIDITY_POOL).balanceOf(_target);

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

		// Return total value of both output tokens denomintaed in WETH
		return balance * amount0PerLPToken * utilizedTokenValueInWETH(
			_utilizedToken[0]
		) + balance * amount1PerLPToken * utilizedTokenValueInWETH(
			_utilizedToken[1]
		);
	}

	/// @inheritdoc IYieldSyncV1StrategyHandler
	function utilizedToken()
		public
		view
		override
		returns (address[] memory)
	{
		return _utilizedToken;
	}

	/// @inheritdoc IYieldSyncV1StrategyHandler
	function utilizedTokenValueInWETH(address _token)
		public
		view
		override
		returns (uint256 tokenValueInEth_)
	{
		require(_token_utilized[_token] == true, "!_token_utilized[_token]");

		(uint112 reserve0, uint112 reserve1, ) = uniswapV2Pair.getReserves();

		// If there is no liquidity then automatically the value will be 0
		if (uniswapV2Pair.totalSupply() == 0)
		{
			return 0;
		}

		// Return token price in terms of WETH
		if (_token < WETH)
		{
			return uint256(reserve1) * 1e18 / reserve0;
		}
		else
		{
			return uint256(reserve0) * 1e18 / reserve1;
		}
	}

	/// @inheritdoc IYieldSyncV1StrategyHandler
	function utilizedTokensDeposit(uint256[] memory _amount)
		public
		override
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

		// Handle the minting of strategy-specific tokens or other logic...
	}

	/// @inheritdoc IYieldSyncV1StrategyHandler
	function utilizedTokensWithdraw(uint256[] memory _amount)
		public
		override
	{
		// Retrieve the current reserves to estimate the withdrawn amounts
		(uint256 reserveA, uint256 reserveB, ) = uniswapV2Pair.getReserves();

		// [calculate] Amount of tokens to be withdrawn given liquidity amount
		uint256 amountA = _amount[0] * reserveA / IERC20(LIQUIDITY_POOL).totalSupply();
		uint256 amountB = _amount[0] * reserveB / IERC20(LIQUIDITY_POOL).totalSupply();

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
}
