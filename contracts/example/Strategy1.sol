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
contract Strategy is
	IYieldSyncV1Strategy,
	ERC20
{
	address[] internal _utilizedToken;


	mapping (address token => bool utilized) internal _token_utilized;

	mapping (address token => Allocation allocation) internal _token_allocation;


	constructor (string memory name, string memory symbol)
		ERC20(name, symbol)
	{}


	/**
	* @return allocation_ {Allocation}
	*/
	function token_allocation(address _token)
		external
		view
		returns (Allocation memory allocation_)
	{
		return _token_allocation[_token];
	}

	/// @inheritdoc IYieldSyncV1Strategy
	function positionValueInEth()
		public
		view
		override
		returns (uint256 positionValueInEth_)
	{
		return balanceOf(msg.sender);
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


	function allocate()
		public
	{}

	function deallocate()
		public
	{}
}
