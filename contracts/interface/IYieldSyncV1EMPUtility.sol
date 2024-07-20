// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { UtilizationERC20 } from "../struct/UtilizationERC20.sol";


interface IYieldSyncV1EMPUtility
{
	/**
	* @notice Utilized ERC20 Generator
	* @return updatedNeeded_
	* @return utilizedERC20_
	* @return utilizationERC20_
	*/
	function utilizedERC20Generator()
		external
		returns (bool updatedNeeded_, address[] memory utilizedERC20_, UtilizationERC20[] memory utilizationERC20_)
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
	* @notice Yield Sync V1 EMP Strategy Utilized ERC20 Amount Valid
	* @param _yieldSyncV1EMPStrategyUtilizedERC20Amount {uint256[][]}
	* @return valid_ {bool}
	*/
	function yieldSyncV1EMPStrategyUtilizedERC20AmountValid(uint256[][] memory _yieldSyncV1EMPStrategyUtilizedERC20Amount)
		external
		returns (bool valid_)
	;
}
