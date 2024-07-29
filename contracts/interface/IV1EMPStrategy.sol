// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { IV1EMPArrayUtility } from "./IV1EMPArrayUtility.sol";
import { IV1EMPRegistry } from "./IV1EMPRegistry.sol";
import { IV1EMPStrategyInteractor } from "./IV1EMPStrategyInteractor.sol";
import { UtilizationERC20 } from "../struct/UtilizationERC20.sol";


interface IV1EMPStrategy is
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
	* @dev [view-IV1EMPStrategyInteractor]
	* @notice Implemented IV1EMPStrategyInteractor
	* @return {IV1EMPStrategyInteractor}
	*/
	function iV1EMPStrategyInteractor()
		external
		view
		returns (IV1EMPStrategyInteractor)
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
	* @notice Update iV1EMPStrategyInteractor
	* @param _iStrategyInteractor {address}
	*/
	function iV1EMPStrategyInteractorUpdate(address _iStrategyInteractor)
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
