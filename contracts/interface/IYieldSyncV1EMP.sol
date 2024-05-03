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
	* @return {bool}
	*/
	function utilizedYieldSyncV1EMPStrategyDepositOpen()
		external
		view
		returns (bool)
	;

	/**
	* @notice
	* @return {bool}
	*/
	function utilizedYieldSyncV1EMPStrategyWithdrawOpen()
		external
		view
		returns (bool)
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

	/**
	* @notice Update manager
	* @param _manager {address}
	*/
	function managerUpdate(address _manager)
		external
	;

	/**
	* @notice Deposit utilized ERC20s
	* @param _utilizedERC20Amount {uint256[][]}
	*/
	function utilizedYieldSyncV1EMPStrategyDeposit(uint256[][] memory _utilizedERC20Amount)
		external
	;

	/**
	* @dev [view-bool]
	* @notice Utilized Yield Sync V1 EMP Strategy Deposit Open
	*/
	function utilizedYieldSyncV1EMPStrategyDepositOpenToggle()
		external
	;

	/**
	*/
	function utilizedYieldSyncV1EMPStrategyUpdate(UtilizedYieldSyncV1EMPStrategy[] memory __utilizedYieldSyncV1EMPStrategy)
		external
	;

	/**
	* @dev [view-bool]
	* @notice Utilized Yield Sync V1 EMP Strategy Withdraw Open
	*/
	function utilizedYieldSyncV1EMPStrategyWithdrawOpenToggle()
		external
	;
}
