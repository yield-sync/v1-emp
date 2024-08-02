// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { IV1EMPAmountsValidator } from "./IV1EMPAmountsValidator.sol";
import { IV1EMPArrayUtility } from "./IV1EMPArrayUtility.sol";
import { IV1EMPRegistry } from "./IV1EMPRegistry.sol";
import { UtilizationERC20 } from "../struct/UtilizationERC20.sol";


interface IV1EMP is
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
	* @notice Utilized ERC20 Deposit Open
	* @return {bool}
	*/
	function utilizedERC20DepositOpen()
		external
		view
		returns (bool)
	;

	/**
	* @dev [view-boolean]
	* @notice Utilized ERC20 Withdraw Full
	* @return {bool}
	*/
	function utilizedERC20WithdrawFull()
		external
		view
		returns (bool)
	;

	/**
	* @dev [view-boolean]
	* @notice Utilized ERC20 Withdraw Open
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
	* @dev [view-IV1EMPAmountsValidator]
	* @notice Implemented IV1EMPAmountsValidator
	* @return {IV1EMPAmountsValidator}
	*/
	function I_V1_EMP_AMOUNTS_VALIDATOR()
		external
		view
		returns (IV1EMPAmountsValidator)
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
	* @notice Fee Rate for Governance
	* @dev [view-uint256]
	* @return {uint256}
	*/
	function feeRateGovernance()
		external
		view
		returns (uint256)
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
	* @dev [view-mapping]
	* @notice UtilizedV1EMPStrategy -> Allocation
	* @param _utilizedV1EMPStrategy {address}
	* @return {uin256}
	*/
	function utilizedV1EMPStrategy_allocation(address _utilizedV1EMPStrategy)
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
	* @notice Utilized V1 EMP Strategy
	* @return {address[]}
	*/
	function utilizedV1EMPStrategy()
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
	* @notice Udpate Fee Rate for Governance
	* @param _feeRateGovernance {uint256}
	*/
	function feeRateGovernanceUpdate(uint256 _feeRateGovernance)
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
	* @notice Utilized ERC20 Deposit Open Toggle
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
	* @notice Utilized ERC20 Withdraw Full Toggle
	*/
	function utilizedERC20WithdrawFullToggle()
		external
	;

	/**
	* @notice Utilized ERC20 Withdraw Open Toggle
	*/
	function utilizedERC20WithdrawOpenToggle()
		external
	;

	/**
	* @notice Deposit utilized ERC20s into strategy
	* @param _v1EMPStrategyUtilizedERC20Amount {uint256[][]}
	*/
	function utilizedV1EMPStrategyDeposit(uint256[][] memory _v1EMPStrategyUtilizedERC20Amount)
		external
	;

	/**
	* @notice
	*/
	function utilizedV1EMPStrategyUpdate(address[] memory _v1EMPStrategy, uint256[] memory _allocation)
		external
	;

	/**
	* @notice Withdraw utilized ERC20s from strategy
	* @param _v1EMPStrategyERC20Amount {uint256[]}
	*/
	function utilizedV1EMPStrategyWithdraw(uint256[] memory _v1EMPStrategyERC20Amount)
		external
	;
}
