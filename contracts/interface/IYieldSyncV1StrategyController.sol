// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { IYieldSyncV1Strategy } from "./IYieldSyncV1Strategy.sol";


using SafeERC20 for IERC20;


struct Allocation
{
	uint8 denominator;
	uint8 numerator;
}


interface IYieldSyncV1StrategyController is
	IERC20
{
	/**
	* @notice
	* @dev [view-address]
	* @return {address}
	*/
	function strategy()
		external
		view
		returns (address)
	;

	/**
	* @notice token to allocation
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
	* @notice token to utilized
	* @dev [view-mapping]
	* @param _token {address}
	* @return utilized_ {bool}
	*/
	function token_utilized(address _token)
		external
		view
		returns (bool utilized_)
	;


	/**
	* @notice Value of position denominated in WETH
	* @param target {address}
	* @return positionETHValue_ {uint256}
	*/
	function positionETHValue(address target)
		external
		view
		returns (uint256 positionETHValue_)
	;

	/**
	* @notice Array of utilized tokens
	* @return utilizedToken_ {address[]}
	*/
	function utilizedToken()
		external
		view
		returns (address[] memory utilizedToken_)
	;

	/**
	* @notice Utilized tokens received per token
	*/
	function utilizedTokenAmountPerToken()
		external
		view
		returns (uint256[] memory utilizedTokenAmount_)
	;


	/**
	* @notice Sets the strategy
	* @dev This can only set the strategy once
	* @param _strategy {address} Strategy
	*/
	function setStrategy(address _strategy)
		external
	;

	/**
	* @notice Deposit into strategy
	* @param _utilizedTokenAmount {uint256[]} Amount to be deposited
	*/
	function utilizedTokenDeposit(uint256[] memory _utilizedTokenAmount)
		external
	;

	/**
	* @notice Withdraw from strategy
	* @param _tokenAmount {uint256}
	*/
	function utilizedTokenWithdraw(uint256 _tokenAmount)
		external
	;
}
