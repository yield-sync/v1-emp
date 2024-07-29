// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { IYieldSyncV1EMPRegistry } from "./IYieldSyncV1EMPRegistry.sol";
import { IYieldSyncV1EMPStrategyInteractor } from "./IYieldSyncV1EMPStrategyInteractor.sol";
import { IYieldSyncV1EMPStrategyUtility } from "./IYieldSyncV1EMPStrategyUtility.sol";
import { UtilizationERC20 } from "../struct/UtilizationERC20.sol";


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
	* @dev [view-erc256]
	* @notice Utilized ERC20 Update Tracker
	* @return {uint256}
	*/
	function utilizedERC20UpdateTracker()
		external
		view
		returns (uint256)
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
	* @dev [view-IYieldSyncV1EMPStrategyUtility]
	* @notice Implemented IYieldSyncV1EMPStrategyUtility
	* @return {IYieldSyncV1EMPStrategyUtility}
	*/
	function I_YIELD_SYNC_V1_EMP_STRATEGY_UTILITY()
		external
		view
		returns (IYieldSyncV1EMPStrategyUtility)
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
	 */
	function utilizedERC20_utilizationERC20(address __utilizedERC20)
		external
		view
		returns (UtilizationERC20 memory)
	;

	/**
	* @notice Utilized ERC20 Amount Total ETH Value
	* @param _utilizedERC20Amount {uint256[]}
	*/
	function utilizedERC20AmountETHValue(uint256[] memory _utilizedERC20Amount)
		external
		view
		returns (uint256 utilizedERC20AmountETHValueTotal_, uint256[] memory utilizedERC20AmountETHValue_)
	;


	/// @notice mutative


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
	* @param _utilizationERC20 {UtilizationERC20[]}
	*/
	function utilizedERC20Update(address[] memory __utilizedERC20, UtilizationERC20[] memory _utilizationERC20)
		external
	;

	/**
	* @notice Deposit utilized ERC20s
	* @param _from {address}
	* @param _utilizedERC20Amount {uint256[]}
	*/
	function utilizedERC20Deposit(address _from, uint256[] memory _utilizedERC20Amount)
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
	* @param _eRC20Amount {uint256}
	*/
	function utilizedERC20Withdraw(uint256 _eRC20Amount)
		external
	;

	/**
	* @notice Utilized ERC20 Deposit Open Toggle
	*/
	function utilizedERC20WithdrawOpenToggle()
		external
	;
}
