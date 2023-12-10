// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

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
	* @notice Utilized tokens
	* @return {address}
	*/
	function utilizedToken(uint256)
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
	* @notice ETH value of Utilized token amount
	* @param _utilizedTokenAmount {uint256[]}
	* @return eTHValueUtilizedTokenAmount_ {uint256[]}
	*/
	function eTHValueUtilizedTokenAmount(uint256[] memory _utilizedTokenAmount)
		external
		view
		returns (uint256 eTHValueUtilizedTokenAmount_)
	;

	/**
	* @notice Utilized token amounts returned per token
	* @return utilizedTokenAmount_ {uint256[]}
	*/
	function utilizedTokenAmountPerToken()
		external
		view
		returns (uint256[] memory utilizedTokenAmount_)
	;

	/**
	* @notice Set allocation for utilized tokens
	* @param _utilizedTokenAllocation {uint256[]}
	*/
	function utilizedTokenAllocationSet(uint256[] memory _utilizedTokenAllocation)
		external
	;

	/**
	* @notice Valid utilized token amounts
	* @param _utilizedTokenAmount {uint256}
	* @return utilizedTokenAmountValid_ {bool}
	*/
	function utilizedTokenAmountValid(uint256[] memory _utilizedTokenAmount)
		external
		returns (bool utilizedTokenAmountValid_)
	;

	/**
	* @dev [called-once]
	* @notice Initialize strategy
	* @param _strategy {address} Strategy
	*/
	function initializeStrategy(address _strategy, address[] memory _utilizedToken)
		external
	;

	/**
	* @notice Deposit utilized tokens
	* @param _utilizedTokenAmount {uint256[]}
	*/
	function utilizedTokenDeposit(uint256[] memory _utilizedTokenAmount)
		external
	;

	/**
	* @notice Withdraw utilized tokens
	* @param _tokenAmount {uint256}
	*/
	function utilizedTokenWithdraw(uint256 _tokenAmount)
		external
	;
}
