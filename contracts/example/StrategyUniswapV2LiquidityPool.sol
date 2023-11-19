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


interface IUniswapV2Router
{
	function addLiquidity(
		address tokenA,
		address tokenB,
		uint amountADesired,
		uint amountBDesired,
		uint amountAMin,
		uint amountBMin,
		address to,
		uint deadline
	)
		external
		returns (uint amountA, uint amountB, uint liquidity)
	;

	function removeLiquidity(
		address tokenA,
		address tokenB,
		uint liquidity,
		uint amountAMin,
		uint amountBMin,
		address to,
		uint deadline
	)
		external
		returns (uint amountA, uint amountB)
	;
}


/**
* @notice This strategy adds liquidity to a uniswap pool
*/
contract StrategyUniswapV2LiquidityPool is
	IYieldSyncV1Strategy,
	ERC20
{
	address public manager;
	uint256 public slippageTolerance;

	address[] internal _utilizedToken;


	mapping (address token => bool utilized) internal _token_utilized;

	mapping (address token => Allocation allocation) internal _token_allocation;


	IUniswapV2Factory public immutable uniswapV2Factory;
	IUniswapV2Router public immutable uniswapV2Router;


	constructor (
		string memory name,
		string memory symbol,
		address _tokenA,
		address _tokenB,
		address _uniswapV2Factory,
		address _uniswapV2Router
	)
		ERC20(name, symbol)
	{
		manager = msg.sender;

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
	function positionValueInWETH(address target)
		public
		view
		override
		returns (uint256 positionValueInEth_)
	{
		// This is a placeholder until i have a proper way to calculate the position value
		return balanceOf(target);
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
		// This is a placeholder until i have a proper way to calculate the position value
		return 1;
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
		IERC20(uniswapV2Factory.getPair(_utilizedToken[0], _utilizedToken[1])).safeApprove(
			address(uniswapV2Router),
			_amount[0]
		);

		(uint amountA, uint amountB) = uniswapV2Router.removeLiquidity(
			_utilizedToken[0],
			_utilizedToken[1],
			_amount[0],
			0, // amountAMin (set to 0 for simplicity)
			0, // amountBMin (set to 0 for simplicity)
			address(this),
			block.timestamp
		);

		// Transfer the withdrawn tokens to the recipient
		IERC20(_utilizedToken[0]).safeTransfer(msg.sender, amountA);
		IERC20(_utilizedToken[1]).safeTransfer(msg.sender, amountB);
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
