// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";


using SafeERC20 for IERC20;


struct UtilizedStrategy
{
	address yieldSyncV1EMPStrategy;
	uint8 denominator;
	uint8 numerator;
}


interface IYieldSyncV1EMP is
	IERC20
{
	/**
	* @notice
	* @return {address}
	*/
	function manager()
		external
		view
		returns (address)
	;

	/**
	* @notice
	* @return {address[]}
	*/
	function utilizedStrategy()
		external
		view
		returns (UtilizedStrategy[] memory utilizedStrategy_)
	;

	/**
	* @notice
	* @dev [view-uint256]
	* @return {uint256}
	*/
	function INITIAL_MINT_RATE()
		external
		view
		returns (uint256)
	;


	/**
	* @notice
	*/
	function depositTokens()
		external
	;

	/**
	* @notice Update a strategy allocation
	*/
	function strategyAllocationUpdate()
		external
	;
}
