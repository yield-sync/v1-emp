// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


interface IYieldSyncV1EMPStrategyUtility
{
	/**
	* @notice Sort
	* @param _array {address[]}
	*/
	function sort(address[] memory _array)
		external
		view
		returns (address[] memory)
	;

	/**
	* @notice Contains Duplicate
	* @param _array {address[]}
	*/
	function containsDuplicates(address[] memory _array)
		external
		returns (bool)
	;
}
