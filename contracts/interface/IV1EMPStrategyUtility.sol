// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IV1EMPArrayUtility } from "./IV1EMPArrayUtility.sol";
import { IV1EMPRegistry } from "./IV1EMPRegistry.sol";
import { UtilizationERC20 } from "../struct/UtilizationERC20.sol";


interface IV1EMPStrategyUtility
{
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
