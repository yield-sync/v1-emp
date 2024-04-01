// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { IYieldSyncV1EMPStrategy, UtilizedERC20 } from "./IYieldSyncV1EMPStrategy.sol";


using SafeERC20 for IERC20;


struct UtilizedYieldSyncV1EMPStrategy
{
	address yieldSyncV1EMPStrategy;
	uint256 allocation;
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
	function utilizedYieldSyncV1EMPStrategy()
		external
		view
		returns (UtilizedYieldSyncV1EMPStrategy[] memory)
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
	* @dev [view-uint256]
	* @return {uint256}
	*/
	function ONE_HUNDRED_PERCENT()
		external
		view
		returns (uint256)
	;
}
