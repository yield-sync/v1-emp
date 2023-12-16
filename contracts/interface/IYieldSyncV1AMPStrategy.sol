// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { IYieldSyncV1AMPStrategyInteractor } from "./IYieldSyncV1AMPStrategyInteractor.sol";


using SafeERC20 for IERC20;


interface IYieldSyncV1AMPStrategy is
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
	* @dev [view-uint256[]]
	* @notice Utilized ERC20 Allocations
	* @return {uint256[]}
	*/
	function utilizedERC20Allocation()
		external
		view
		returns (uint256[] memory)
	;

	/**
	* @dev [view-IYieldSyncV1AMPStrategyInteractor]
	* @notice Implemented IYieldSyncV1AMPStrategyInteractor
	* @return {IYieldSyncV1AMPStrategyInteractor}
	*/
	function yieldSyncV1AMPStrategyInteractor()
		external
		view
		returns (IYieldSyncV1AMPStrategyInteractor)
	;

	/**
	* @notice Eth value of position
	* @param target {address}
	* @return balanceOfETHValue_ {uint256}
	*/
	function balanceOfETHValue(address target)
		external
		view
		returns (uint256 balanceOfETHValue_)
	;

	/**
	* @notice Valid utilized ERC20 amounts
	* @param _utilizedERC20Amount {uint256}
	* @return utilizedERC20AmountValid_ {bool}
	*/
	function utilizedERC20AmountValid(uint256[] memory _utilizedERC20Amount)
		external
		returns (bool utilizedERC20AmountValid_)
	;

	/**
	* @notice Utilized ERC20 amounts returned per ERC20
	* @return utilizedERC20Amount_ {uint256[]}
	*/
	function utilizedERC20AmountPerBurn()
		external
		view
		returns (uint256[] memory utilizedERC20Amount_)
	;


	/**
	* @dev [called-once]
	* @notice Initialize strategy
	* @param _strategy {address} Strategy
	*/
	function initializeStrategy(address _strategy, address[] memory _utilizedERC20)
		external
	;

	/**
	* @notice Set allocation for utilized ERC20s
	* @param _utilizedERC20Allocation {uint256[]}
	*/
	function utilizedERC20AllocationSet(uint256[] memory _utilizedERC20Allocation)
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
	* @notice Withdraw utilized ERC20s
	* @param _ERC20Amount {uint256}
	*/
	function utilizedERC20Withdraw(uint256 _ERC20Amount)
		external
	;
}
