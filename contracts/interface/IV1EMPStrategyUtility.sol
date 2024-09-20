// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IV1EMPArrayUtility } from "./IV1EMPArrayUtility.sol";
import { IV1EMPRegistry } from "./IV1EMPRegistry.sol";
import { UtilizationERC20 } from "../struct/UtilizationERC20.sol";


interface IV1EMPStrategyUtility
{
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
}
