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
	function v1EMP_utilizedERC20(address _v1EMP)
		external
		view
		returns (address[] memory)
	;

	/**
	* @dev [view-mapping]
	* @notice v1EMP -> utilizedERC20 -> utilizationERC20
	* @param _v1EMP {address}
	* @param _utilizedERC20 {address}
	* @return {UtilizationERC20}
	*/
	function v1EMP_utilizedERC20_utilizationERC20(address _v1EMP, address _utilizedERC20)
		external
		view
		returns (UtilizationERC20 memory)
	;

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


	/// @notice view


	/**
	* @notice
	* @param _v1EMP {address}
	* @return utilizedERC20TotalAmount_ {uint256[]}
	*/
	function utilizedERC20TotalBalance(address _v1EMP)
		external
		view
		returns (uint256[] memory utilizedERC20TotalAmount_)
	;

	/**
	* @notice Utilized ERC20 Amount Valid
	* @param _v1EMP {address}
	* @param _utilizedERC20Amount {uint256}
	* @return valid_ {bool}
	* @return utilizedERC20AmountTotalETHValue_ {uint256}
	*/
	function utilizedERC20AmountValid(address _v1EMP, uint256[] memory _utilizedERC20Amount)
		external
		view
		returns (bool valid_, uint256 utilizedERC20AmountTotalETHValue_)
	;


	/// @notice mutative


	/**
	* @notice Utilized ERC20 Update
	*/
	function utilizedERC20Update()
		external
	;

	/**
	* @notice V1 EMP Strategy Utilized ERC20 Amount Valid
	* @param _v1EMP {address}
	* @param _v1EMPStrategyUtilizedERC20Amount {uint256[][]}
	* @return valid_ {bool}
	*/
	function v1EMPStrategyUtilizedERC20AmountValid(address _v1EMP, uint256[][] memory _v1EMPStrategyUtilizedERC20Amount)
		external
		returns (bool valid_)
	;
}
