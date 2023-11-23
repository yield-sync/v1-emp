// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IERC20, ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { Allocation, IYieldSyncV1Strategy } from "../interface/IYieldSyncV1Strategy.sol";


using SafeERC20 for IERC20;


interface IUniswapV2Factory
{
	function getPair(address tokenA, address tokenB)
		external
		view
		returns (address pair)
	;
}


interface IUniswapV2Pair
{
    function getReserves()
		external
		view
		returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)
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
	IYieldSyncV1Strategy,
	ERC20
{
	address public immutable UNISWAP_V2_FACTORY;
    address public immutable WETH;

	address public manager;
	uint256 public slippageTolerance;

	address[] internal _utilizedToken;


	mapping (address token => bool utilized) internal _token_utilized;

	mapping (address token => Allocation allocation) internal _token_allocation;


	IUniswapV2Factory public immutable uniswapV2Factory;
	IUniswapV2Router public immutable uniswapV2Router;


	constructor (
		address _UNISWAP_V2_FACTORY,
		address _WETH,
		address _tokenA,
		address _tokenB,
		address _uniswapV2Factory,
		address _uniswapV2Router,
		string memory name,
		string memory symbol
	)
		ERC20(name, symbol)
	{
		manager = msg.sender;

		UNISWAP_V2_FACTORY = _UNISWAP_V2_FACTORY;
		WETH = _WETH;

		_utilizedToken.push(_tokenA);
		_utilizedToken.push(_tokenB);

		uniswapV2Factory = IUniswapV2Factory(_uniswapV2Factory);
		uniswapV2Router = IUniswapV2Router(_uniswapV2Router);
	}


	/// @inheritdoc IYieldSyncV1Strategy
	function token_allocation(address token)
		external
		view
		override
		returns (Allocation memory)
	{
		return _token_allocation[token];
	}

	/// @inheritdoc IYieldSyncV1Strategy
	function token_utilized(address _token)
		public
		view
		override
		returns (bool utilized_)
	{
		return _token_utilized[_token];
	}


	/// @inheritdoc IYieldSyncV1Strategy
	function positionValueInWETH(address _target)
		public
		view
		override
		returns (uint256 positionValueInEth_)
	{
		IERC20 lpToken = IERC20(uniswapV2Factory.getPair(_utilizedToken[0], _utilizedToken[1]));

		// This is a placeholder until i have a proper way to calculate the position value
		return lpToken.balanceOf(_target);
	}

	/// @inheritdoc IYieldSyncV1Strategy
	function utilizedToken()
		public
		view
		override
		returns (address[] memory)
	{
		return _utilizedToken;
	}

	/// @inheritdoc IYieldSyncV1Strategy
	function utilizedTokenValueInWETH(address _token)
		public
		view
		override
		returns (uint256 tokenValueInEth_)
	{
		// TODO: Check that the token is utilized

		address pair = IUniswapV2Factory(UNISWAP_V2_FACTORY).getPair(_token, WETH);

		// Pair does NOT exist
		if (pair == address(0))
		{
			return 0;
		}

		(uint112 reserve0, uint112 reserve1, ) = IUniswapV2Pair(pair).getReserves();

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

	/// @inheritdoc IYieldSyncV1Strategy
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

	/// @inheritdoc IYieldSyncV1Strategy
	function utilizedTokensWithdraw(uint256[] memory _amount)
		public
		override
	{
		IERC20 lpToken = IERC20(uniswapV2Factory.getPair(_utilizedToken[0], _utilizedToken[1]));

		lpToken.safeApprove(address(uniswapV2Router), _amount[0]);

		// Retrieve the current reserves to estimate the withdrawn amounts
		(uint256 reserveA, uint256 reserveB, ) = IUniswapV2Pair(address(lpToken)).getReserves();

		// Calculate amount of tokens to be withdrawn given liquidity amount
		uint256 amountA = _amount[0] * reserveA / lpToken.totalSupply();
		uint256 amountB = _amount[0] * reserveB / lpToken.totalSupply();

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

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Strategy Specific
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	function slippageToleranceUpdate(uint256 _slippageTolerance)
		public
	{
		require(msg.sender == manager, "!manager");

		// Add access control if necessary
		slippageTolerance = _slippageTolerance;
	}
}
