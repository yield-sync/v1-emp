// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { IYieldSyncV1EMPETHValueFeed } from "./IYieldSyncV1EMPETHValueFeed.sol";
import { IYieldSyncV1EMPRegistry } from "./IYieldSyncV1EMPRegistry.sol";
import { IYieldSyncV1EMPStrategyInteractor } from "./IYieldSyncV1EMPStrategyInteractor.sol";


using SafeERC20 for IERC20;


struct Purpose
{
	bool deposit;
	bool withdraw;
	uint256 allocation;
}


interface IYieldSyncV1EMPStrategy is
	IERC20
{
	/**
	* @dev [view-address]
	* @notice manager
	* @return {address}
	*/
	function manager()
		external
		view
		returns (address)
	;

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
	* @notice Utilized ERC20 Deposit Open
	*/
	function utilizedERC20DepositOpen()
		external
		view
		returns (bool)
	;

	/**
	* @notice Utilized ERC20 Withdraw Open
	*/
	function utilizedERC20WithdrawOpen()
		external
		view
		returns (bool)
	;

	/**
	* @dev [view-uint256]
	* @notice One Hundred Percent
	* @return {uint256}
	*/
	function ONE_HUNDRED_PERCENT()
		external
		view
		returns (uint256)
	;

	/**
	* @dev [view-IYieldSyncV1EMPETHValueFeed]
	* @notice Implemented IYieldSyncV1EMPETHValueFeed
	* @return {IYieldSyncV1EMPETHValueFeed}
	*/
	function iYieldSyncV1EMPETHValueFeed()
		external
		view
		returns (IYieldSyncV1EMPETHValueFeed)
	;

	/**
	* @dev [view-IYieldSyncV1EMPRegistry]
	* @notice Implemented IYieldSyncV1EMPRegistry
	* @return {IYieldSyncV1EMPRegistry}
	*/
	function iYieldSyncV1EMPRegistry()
		external
		view
		returns (IYieldSyncV1EMPRegistry)
	;

	/**
	* @dev [view-IYieldSyncV1EMPStrategyInteractor]
	* @notice Implemented IYieldSyncV1EMPStrategyInteractor
	* @return {IYieldSyncV1EMPStrategyInteractor}
	*/
	function iYieldSyncV1EMPStrategyInteractor()
		external
		view
		returns (IYieldSyncV1EMPStrategyInteractor)
	;

	/**
	* @dev [view-mapping]
	* @notice Utilized ERC20 Allocation
	* @param __utilizedERC20 {address}
	* @return purpopse_ {Purpose}
	*/
	function utilizedERC20_purpose(address __utilizedERC20)
		external
		view
		returns (Purpose memory purpopse_)
	;


	/**
	* @notice Update yieldSyncV1EMPETHValueFeed
	* @param _yieldSyncV1EMPETHValueFeed {address}
	*/
	function iYieldSyncV1EMPETHValueFeedUpdate(address _yieldSyncV1EMPETHValueFeed)
		external
	;

	/**
	* @notice Update iYieldSyncV1EMPStrategyInteractor
	* @param _iYieldSyncStrategyInteractor {address}
	*/
	function iYieldSyncV1EMPStrategyInteractorUpdate(address _iYieldSyncStrategyInteractor)
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
	* @param __utilizedERC20 {address[]}
	* @param _purpose {Purpose[]}
	*/
	function utilizedERC20AndPurposeUpdate(address[] memory __utilizedERC20, Purpose[] memory _purpose)
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
	* @notice Utilized ERC20 Deposit Open Toggle
	*/
	function utilizedERC20DepositOpenToggle()
		external
	;

	/**
	* @notice Withdraw utilized ERC20s
	* @param _ERC20Amount {uint256}
	*/
	function utilizedERC20Withdraw(uint256 _ERC20Amount)
		external
	;

	/**
	* @notice Utilized ERC20 Deposit Open Toggle
	*/
	function utilizedERC20WithdrawOpenToggle()
		external
	;
}
