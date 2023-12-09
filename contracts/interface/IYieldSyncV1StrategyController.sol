// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { IYieldSyncV1Strategy } from "./IYieldSyncV1Strategy.sol";


using SafeERC20 for IERC20;


struct Allocation
{
	uint256 denominator;
	uint256 numerator;
}


interface IYieldSyncV1StrategyController is
	IERC20
{
	/**
	* @dev [view-mapping]
	* @param _token {address}
	* @return {Allocation}
	*/
	function token_allocation(address _token)
		external
		view
		returns (Allocation memory)
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
	* @notice Utilized Tokens
	* @return utilizedToken_ {address[]}
	*/
	function utilizedToken()
		external
		view
		returns (address[] memory utilizedToken_)
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
	* @notice Sets Strategy
	* @dev This can only set the strategy once
	* @param _strategy {address} Strategy
	*/
	function setStrategy(address _strategy)
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
