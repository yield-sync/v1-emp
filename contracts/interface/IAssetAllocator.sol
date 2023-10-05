// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


interface IAssetAllocator
{
	/**
	* @notice Allocate funds to strategies
	*/
	function allocate()
		external
	;

	/**
	* @notice Add a strategy
	*/
	function strategyAllocationSet(address strategy, uint256 numerator, uint256 denominator)
		external
	;

	/**
	* @notice Add a strategy
	*/
	function strategyAdd(address strategy)
		external
	;

	/**
	* @notice Subtract a strategy
	*/
	function strategySubtract(address strategy)
		external
	;

	/**
	* @notice Make withdrawal request
	*/
	function withdrawalRequestCreate()
		external
	;
}
