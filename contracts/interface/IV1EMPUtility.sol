// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IV1EMPArrayUtility } from "./IV1EMPArrayUtility.sol";
import { IV1EMPRegistry } from "./IV1EMPRegistry.sol";
import { UtilizationERC20 } from "../struct/UtilizationERC20.sol";


interface IV1EMPUtility
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
	* @notice Utilized ERC20 Amount Valid
	* @param _utilizedERC20Amount {uint256}
	* @return valid_ {bool}
	* @return utilizedERC20AmountTotalETHValue_ {uint256}
	*/
	function utilizedERC20AmountValid(uint256[] memory _utilizedERC20Amount)
		external
		view
		returns (bool valid_, uint256 utilizedERC20AmountTotalETHValue_)
	;

	/**
	* @notice Utilized ERC20 Generator
	* @return updatedRequired_ {bool}
	* @return utilizedERC20_ {address[]}
	* @return utilizationERC20_ {UtilizationERC20[]}
	*/
	function utilizedERC20Generator()
		external
		returns (bool updatedRequired_, address[] memory utilizedERC20_, UtilizationERC20[] memory utilizationERC20_)
	;

	/**
	* @notice V1 EMP Strategy Utilized ERC20 Amount Valid
	* @param _v1EMPStrategyUtilizedERC20Amount {uint256[][]}
	* @return valid_ {bool}
	*/
	function v1EMPStrategyUtilizedERC20AmountValid(uint256[][] memory _v1EMPStrategyUtilizedERC20Amount)
		external
		returns (bool valid_)
	;
}
