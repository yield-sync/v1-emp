// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IERC20Handler } from "@yield-sync/erc20-handler/contracts/interface/IERC20Handler.sol";

import { UtilizationERC20 } from "../struct/UtilizationERC20.sol";


interface IV1EMPStrategy
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
	* @dev [view-bool]
	* @notice Utilized ERC20 Deposit Open
	* @return {bool}
	*/
	function utilizedERC20DepositOpen()
		external
		view
		returns (bool)
	;

	/**
	* @dev [view-bool]
	* @notice Utilized ERC20 Withdraw Open
	* @return {bool}
	*/
	function utilizedERC20WithdrawOpen()
		external
		view
		returns (bool)
	;

	/**
	* @dev [view-uint256]
	* @notice Equity Total
	* @return {uint256}
	*/
	function sharesTotal()
		external
		view
		returns (uint256)
	;

	/**
	* @dev [view-uint256]
	* @notice Utilized ERC20 Update Tracker
	* @return {uint256}
	*/
	function utilizedERC20UpdateTracker()
		external
		view
		returns (uint256)
	;

	/**
	* @dev [view-IERC20Handler]
	* @notice Implemented IERC20Handler
	* @return {IERC20Handler}
	*/
	function iERC20Handler()
		external
		view
		returns (IERC20Handler)
	;


	/// @notice view


	/**
	* @dev [view-address[]]
	* @notice Utilized ERC20s
	* @return {address[]}
	*/
	function utilizedERC20()
		external
		view
		returns (address[] memory)
	;

	/**
	* @notice
	* @param _utilizedERC20 {address}
	* @return {UtilizationERC20[]}
	*/
	function utilizedERC20_utilizationERC20(address _utilizedERC20)
		external
		view
		returns (UtilizationERC20 memory)
	;

	/**
	* @notice
	* @param _eMP {address}
	* @return {uint256}
	*/
	function eMP_shares(address _eMP)
		external
		view
		returns (uint256)
	;

	/**
	* @notice Utilized ERC20 Amount Total ETH Value
	* @param _utilizedERC20Amount {uint256[]}
	* @return utilizedERC20AmountETHValueTotal_ {uint256}
	* @return utilizedERC20AmountETHValue_ {uint256[]}
	*/
	function utilizedERC20AmountETHValue(uint256[] memory _utilizedERC20Amount)
		external
		view
		returns (uint256 utilizedERC20AmountETHValueTotal_, uint256[] memory utilizedERC20AmountETHValue_)
	;

	/**
	* @notice Utilized ERC20 Total Balance
	* @param __utilizedERC20 {address}
	* @return utilizedERC20TotalAmount_ {uint256}
	*/
	function utilizedERC20TotalBalance(address __utilizedERC20)
		external
		view
		returns (uint256 utilizedERC20TotalAmount_)
	;


	/// @notice mutative


	/**
	* @notice Update iERC20Handler
	* @param _iERC20Handler {address}
	*/
	function iV1EMPERC20HandlerUpdate(address _iERC20Handler)
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
	* @notice Set utilized ERC20s and purpose
	* @param _utilizedERC20 {address[]}
	* @param _utilizationERC20 {UtilizationERC20[]}
	*/
	function utilizedERC20Update(address[] memory _utilizedERC20, UtilizationERC20[] memory _utilizationERC20)
		external
	;

	/**
	* @notice Deposit utilized ERC20s
	* @param _utilizedERC20Amount {uint256[]}
	*/
	function utilizedERC20Deposit(uint256[] memory _utilizedERC20Amount)
		external
	;

	/**
	* @notice Utilized ERC20 Deposit Open Update
	* @param _utilizedERC20DepositOpen {bool}
	*/
	function utilizedERC20DepositOpenUpdate(bool _utilizedERC20DepositOpen)
		external
	;

	/**
	* @notice Withdraw utilized ERC20s
	* @param _shares {uint256}
	*/
	function utilizedERC20Withdraw(uint256 _shares)
		external
	;

	/**
	* @notice Utilized ERC20 Deposit Open Update
	* @param _utilizedERC20WithdrawOpe {bool}
	*/
	function utilizedERC20WithdrawOpenUpdate(bool _utilizedERC20WithdrawOpe)
		external
	;
}
