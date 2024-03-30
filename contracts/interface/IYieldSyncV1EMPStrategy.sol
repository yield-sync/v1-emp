// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { IYieldSyncV1EMPETHValueFeed } from "./IYieldSyncV1EMPETHValueFeed.sol";
import { IYieldSyncV1EMPRegistry } from "./IYieldSyncV1EMPRegistry.sol";
import { IYieldSyncV1EMPStrategyInteractor } from "./IYieldSyncV1EMPStrategyInteractor.sol";


using SafeERC20 for IERC20;


struct UtilizedERC20
{
	address eRC20;
	bool deposit;
	bool withdraw;
	uint256 allocation;
}


interface IYieldSyncV1EMPStrategy is
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
	function I_YIELD_SYNC_V1_EMP_REGISTRY()
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


	/// @notice view


	/**
	* @dev [view-address[]]
	* @notice Utilized ERC20s
	* @return utilizedERC20_ {UtilizedERC20[]}
	*/
	function utilizedERC20()
		external
		view
		returns (UtilizedERC20[] memory utilizedERC20_)
	;

	/**
	* @notice Utilized ERC20 Amount Total ETH Value
	* @param _utilizedERC20Amount {uint256[]}
	*/
	function utilizedERC20AmountETHValue(uint256[] memory _utilizedERC20Amount)
		external
		view
		returns (uint256 utilizedERC20AmountTotalETHValue_)
	;


	/// @notice mutative


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
	* @param _utilizedERC20 {Utilization[]}
	*/
	function utilizedERC20Update(UtilizedERC20[] memory _utilizedERC20)
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
