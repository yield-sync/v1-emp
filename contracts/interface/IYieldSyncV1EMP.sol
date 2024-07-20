// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { IYieldSyncV1EMPRegistry } from "./IYieldSyncV1EMPRegistry.sol";
import { UtilizationERC20 } from "../struct/UtilizationERC20.sol";


interface IYieldSyncV1EMP is
	IERC20
{
	/**
	* @dev [view-address]
	* @notice Manager
	* @return {address}
	*/
	function manager()
		external
		view
		returns (address)
	;

	/**
	* @dev [view-boolean]
	* @notice Utilized Yield Sync V1 EMP Strategy Deposit Open
	* @return {bool}
	*/
	function utilizedERC20DepositOpen()
		external
		view
		returns (bool)
	;

	/**
	* @dev [view-boolean]
	* @notice Utilized Yield Sync V1 EMP Strategy Withdraw Open
	* @return {bool}
	*/
	function utilizedERC20WithdrawOpen()
		external
		view
		returns (bool)
	;

	/**
	* @notice Initial Mint Rate
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
	* @notice Fee Rate for Manager
	* @dev [view-uint256]
	* @return {uint256}
	*/
	function feeRateManager()
		external
		view
		returns (uint256)
	;

	/**
	* @notice Fee Rate for Yield Sync Governance
	* @dev [view-uint256]
	* @return {uint256}
	*/
	function feeRateYieldSyncGovernance()
		external
		view
		returns (uint256)
	;

	/**
	* @dev [view-IYieldSyncV1EMPRegistry]
	* @notice Implemented IYieldSyncV1EMPRegistry
	* @return {IYieldSyncV1EMPRegistry}
	*/
	function I_YIELD_SYNC_V1_EMP_REGISTRY()
		external
		view
		returns (IYieldSyncV1EMPRegistry)
	;

	/**
	* @dev [view-mapping]
	* @notice UtilizedYieldSyncV1EMPStrategy -> Allocation
	* @param _utilizedYieldSyncV1EMPStrategy {address}
	* @return {uin256}
	*/
	function utilizedYieldSyncV1EMPStrategy_allocation(address _utilizedYieldSyncV1EMPStrategy)
		external
		returns (uint256)
	;

	/**
	* @dev [view-mapping]
	* @notice utilizedERC20 -> utilizationERC20
	* @param __utilizedERC20 {address}
	* @return {UtilizationERC20}
	*/
	function utilizedERC20_utilizationERC20(address __utilizedERC20)
		external
		view
		returns (UtilizationERC20 memory)
	;


	/// @notice view


	/**
	* @dev [view-address[]]
	* @notice Utilized ERC20
	* @return {address[]}
	*/
	function utilizedERC20()
		external
		view
		returns (address[] memory)
	;

	/**
	* @dev [view-address[]]
	* @notice Utilized Yield Sync V1 EMP Strategy
	* @return {address[]}
	*/
	function utilizedYieldSyncV1EMPStrategy()
		external
		view
		returns (address[] memory)
	;


	/// @notice mutative


	/**
	* @notice Udpate Fee Rate for Manager
	* @param _feeRateManager {uint256}
	*/
	function feeRateManagerUpdate(uint256 _feeRateManager)
		external
	;

	/**
	* @notice Udpate Fee Rate for Yield Sync Governance
	* @param _feeRateYieldSyncGovernance {uint256}
	*/
	function feeRateYieldSyncGovernanceUpdate(uint256 _feeRateYieldSyncGovernance)
		external
	;

	/**
	* @notice Update manager
	* @param _manager {address}
	*/
	function managerUpdate(address _manager)
		external
	;


	/**
	* @notice Utilized ERC20 Deposit
	* @param _utilizedERC20Amount {uint256[]}
	*/
	function utilizedERC20Deposit(uint256[] memory _utilizedERC20Amount)
		external
	;

	/**
	* @notice Utilized Yield Sync V1 EMP Strategy Deposit Open Toggle
	*/
	function utilizedERC20DepositOpenToggle()
		external
	;

	/**
	* @notice Utilized ERC20 Total Amount
	* @return utilizedERC20TotalAmount_ {uint256[]}
	*/
	function utilizedERC20TotalAmount()
		external
		view
		returns (uint256[] memory utilizedERC20TotalAmount_)
	;

	/**
	* @notice Utilzied ERC20 Update
	*/
	function utilizedERC20Update()
		external
	;

	/**
	* @notice
	*/
	function utilizedERC20Withdraw(uint256 _eRC20Amount)
		external
	;

	/**
	* @notice Utilized Yield Sync V1 EMP Strategy Withdraw Open Toggle
	*/
	function utilizedERC20WithdrawOpenToggle()
		external
	;

	/**
	* @notice Deposit utilized ERC20s into strategy
	* @param _yieldSyncV1EMPStrategyUtilizedERC20Amount {uint256[][]}
	*/
	function utilizedYieldSyncV1EMPStrategyDeposit(uint256[][] memory _yieldSyncV1EMPStrategyUtilizedERC20Amount)
		external
	;

	/**
	* @notice
	*/
	function utilizedYieldSyncV1EMPStrategyUpdate(address[] memory _yieldSyncV1EMPStrategy, uint256[] memory _allocation)
		external
	;

	/**
	* @notice Withdraw utilized ERC20s from strategy
	* @param _yieldSyncV1EMPStrategyERC20Amount {uint256[]}
	*/
	function utilizedYieldSyncV1EMPStrategyWithdraw(uint256[] memory _yieldSyncV1EMPStrategyERC20Amount)
		external
	;
}
