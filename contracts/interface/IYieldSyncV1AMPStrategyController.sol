// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IERC20 } from "@openzeppelin/contracts/ERC20/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/ERC20/ERC20/utils/SafeERC20.sol";

import { IYieldSyncV1AMPStrategy } from "./IYieldSyncV1AMPStrategy.sol";


using SafeERC20 for IERC20;


interface IYieldSyncV1AMPStrategyController is
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
	* @return {address}
	*/
	function utilizedERC20(uint256)
		external
		view
		returns (address)
	;

	/**
	* @dev [view-IYieldSyncV1AMPStrategy]
	* @notice Implemented IYieldSyncV1AMPStrategy
	* @return {IYieldSyncV1AMPStrategy}
	*/
	function yieldSyncV1AMPStrategy()
		external
		view
		returns (IYieldSyncV1AMPStrategy)
	;


	/**
	* @notice Eth value of position
	* @param target {address}
	* @return eTHValuePosition_ {uint256}
	*/
	function eTHValuePosition(address target)
		external
		view
		returns (uint256 eTHValuePosition_)
	;

	/**
	* @notice ETH value of Utilized ERC20 amount
	* @param _utilizedERC20Amount {uint256[]}
	* @return eTHValueUtilizedERC20Amount_ {uint256[]}
	*/
	function eTHValueUtilizedERC20Amount(uint256[] memory _utilizedERC20Amount)
		external
		view
		returns (uint256 eTHValueUtilizedERC20Amount_)
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
	* @notice Set allocation for utilized ERC20s
	* @param _utilizedERC20Allocation {uint256[]}
	*/
	function utilizedERC20AllocationSet(uint256[] memory _utilizedERC20Allocation)
		external
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
	* @dev [called-once]
	* @notice Initialize strategy
	* @param _strategy {address} Strategy
	*/
	function initializeStrategy(address _strategy, address[] memory _utilizedERC20)
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
