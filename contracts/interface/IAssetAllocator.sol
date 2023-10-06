// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


interface IAssetAllocator
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
	* @notice Add a strategy
	*/
	function strategyAllocationSet(address _strategy, uint256 numerator, uint256 denominator)
		external
	;

	/**
	* @notice Add a strategy
	*/
	function strategyAdd(address _strategy, uint8 denominator, uint8 numerator)
		external
	;

	/**
	* @notice Subtract a strategy
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
