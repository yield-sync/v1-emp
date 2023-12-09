// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { IYieldSyncV1Strategy } from "./IYieldSyncV1Strategy.sol";


using SafeERC20 for IERC20;


interface IYieldSyncV1StrategyController is
	IERC20
{
	/**
	* @dev [view-address]
	* @notice Deployer
	* @return {address}
	*/
	function deployer()
		external
		view
		returns (address)
	;

	/**
	* @dev [view-address[]]
	* @notice Utilized Token
	* @return {address}
	*/
	function utilizedToken(uint256)
		external
		view
		returns (address)
	;

	/**
	* @dev [view-IYieldSyncV1Strategy]
	* @return {address}
	*/
	function yieldSyncV1Strategy()
		external
		view
		returns (IYieldSyncV1Strategy)
	;


	/**
	* @notice Position Value Denominated in ETH
	* @param target {address}
	* @return eTHValuePosition_ {uint256}
	*/
	function eTHValuePosition(address target)
		external
		view
		returns (uint256 eTHValuePosition_)
	;

	/**
	* ETH value of Utilized Token Amount
	* @param _utilizedTokenAmount {uint256[]}
	* @return eTHValueUtilizedTokenAmount_ {uint256[]}
	*/
	function eTHValueUtilizedTokenAmount(uint256[] memory _utilizedTokenAmount)
		external
		view
		returns (uint256 eTHValueUtilizedTokenAmount_)
	;

	/**
	* @notice Utilized Token Amount Per Token
	*/
	function utilizedTokenAmountPerToken()
		external
		view
		returns (uint256[] memory utilizedTokenAmount_)
	;

	/**
	* @notice Withdraw Utilized Tokens
	* @param _utilizedTokenAmount {uint256}
	* @return utilizedTokenAmountValid_ {bool}
	*/
	function utilizedTokenAmountValid(uint256[] memory _utilizedTokenAmount)
		external
		returns (bool utilizedTokenAmountValid_)
	;

	/**
	* @notice Initialize Strategy
	* @dev This can only set the strategy once
	* @param _strategy {address} Strategy
	*/
	function initializeStrategy(address _strategy, address[] memory _utilizedToken, uint256[] memory _utilizedTokenAllocation)
		external
	;

	/**
	* @notice Deposit Utilized Tokens
	* @param _utilizedTokenAmount {uint256[]} Amount to be deposited
	*/
	function utilizedTokenDeposit(uint256[] memory _utilizedTokenAmount)
		external
	;

	/**
	* @notice Withdraw Utilized Tokens
	* @param _tokenAmount {uint256}
	*/
	function utilizedTokenWithdraw(uint256 _tokenAmount)
		external
	;
}
