// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IV1EMPArrayUtility } from "./IV1EMPArrayUtility.sol";
import { IV1EMPRegistry } from "./IV1EMPRegistry.sol";
import { UtilizationERC20 } from "../struct/UtilizationERC20.sol";


interface IV1EMPStrategyUtility
{
	/**
	* @dev [view-IV1EMPArrayUtility]
	* @notice Implemented IV1EMPArrayUtility
	* @return {IV1EMPArrayUtility}
	*/
	function I_V1_EMP_ARRAY_UTILITY()
		external
		view
		returns (IV1EMPArrayUtility)
	;

	/**
	* @dev [view-IV1EMPRegistry]
	* @notice Implemented IV1EMPRegistry
	* @return {IV1EMPRegistry}
	*/
	function I_V1_EMP_REGISTRY()
		external
		view
		returns (IV1EMPRegistry)
	;


	/**
	* @notice Deposit Amounts Validate
	* @param _utilizedERC20Amount {address[]}
	*/
	function depositAmountsValidate(uint256[] memory _utilizedERC20Amount)
		external
		view
		returns (uint256 utilizedERC20AmountETHValueTotal_)
	;

	/**
	* @notice Utilized ERC20 Sort
	* @param _utilizedERC20 {addrss[]}
	*/
	function utilizedERC20Sort(address[] memory _utilizedERC20)
		external
		view
		returns (address[] memory)
	;

	/**
	* @notice Utilized ERC20 Contains Duplicates
	* @param _utilizedERC20 {address[]}
	*/
	function utilizedERC20ContainsDuplicates(address[] memory _utilizedERC20)
		external
		returns (bool)
	;

	/**
	* @notice Utilized ERC20 Update Validate
	* @param _utilizedERC20 {address[]}
	* @param _utilizationERC20 {UtilizationERC20[]}
	*/
	function utilizedERC20UpdateValidate(address[] memory _utilizedERC20, UtilizationERC20[] memory _utilizationERC20)
		external
	;
}
