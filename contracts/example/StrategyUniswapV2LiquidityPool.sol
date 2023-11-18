// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { Allocation, IYieldSyncV1Strategy } from "../interface/IYieldSyncV1Strategy.sol";


interface IUniswapV2Router {
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);
}

/**
* @notice This strategy adds liquidity to a uniswap pool
*/
contract StrategyUniswapV2LiquidityPool is
	IYieldSyncV1Strategy,
	ERC20
{
	address[] internal _utilizedToken;


	mapping (address token => bool utilized) internal _token_utilized;

	mapping (address token => Allocation allocation) internal _token_allocation;


	constructor (string memory name, string memory symbol)
		ERC20(name, symbol)
	{}


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
	function withdraw(uint256 amount, address recipient)
		public
		override
	{}
}
