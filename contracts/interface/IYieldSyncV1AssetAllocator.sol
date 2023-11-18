// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";


using SafeERC20 for IERC20;


interface IYieldSyncV1AssetAllocator is
	IERC20
{
	/**
	* @notice Allocate funds to strategies
	*/
	function strategy()
		external
		view
		returns (address[] memory)
	;


	/**
	* @notice Allocate funds to strategies
	*/
	function allocate()
		external
	;

	/**
	* @notice Update a strategy allocation
	* @param _strategy {address}
	* @param _numerator {uint8}
	* @param _denominator {uint8}
	*/
	function strategyAllocationUpdate(address _strategy, uint8 _denominator, uint8 _numerator)
		external
	;

	/**
	* @notice Add a strategy
	* @param _strategy {address}
	* @param _numerator {uint8}
	* @param _denominator {uint8}
	*/
	function strategyAdd(address _strategy, uint8 _denominator, uint8 _numerator)
		external
	;

	/**
	* @notice Subtract a strategy
	* @param _strategy {address}
	*/
	function strategySubtract(address _strategy)
		external
	;

	/**
	* @notice Make withdrawal request
	*/
	function withdrawalRequestCreate()
		external
	;
}
