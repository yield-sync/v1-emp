// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";


using SafeERC20 for IERC20;


struct Allocation
{
	uint8 denominator;
	uint8 numerator;
}


interface IYieldSyncV1AssetAllocator is
	IERC20
{
	/**
	* @notice
	* @dev [view-uint256]
	* @return {uint256}
	*/
	function INITIAL_MINT_RATE()
		external
		view
		returns (uint256)
	;


	/**
	* @notice
	* @return {address[]}
	*/
	function activeStrategy()
		external
		view
		returns (address[] memory activeStrategy_)
	;

	/**
	* @notice
	* @return {address}
	*/
	function manager()
		external
		view
		returns (address manager_)
	;

	/**
	* @notice
	* @return onlyPrioritizedStrategy_ {bool}
	*/
	function onlyPrioritizedStrategy()
		external
		view
		returns (bool onlyPrioritizedStrategy_)
	;

	/**
	* @notice
	* @return strategy_ {address}
	*/
	function prioritizedStrategy()
		external
		view
		returns (address strategy_)
	;

	/**
	* @notice
	* @param _strategy {address}
	* @param _utilizedToken {address[]}
	* @param _amounts {uint256[]}
	*/
	function depositTokens(address strategy, address[] memory _utilizedToken,  uint256[] memory _amounts)
		external
	;

	/**
	* @notice strategy to allocation
	* @dev [view-mapping]
	* @param strategy {address}
	* @return {Allocation}
	*/
	function strategy_allocation(address strategy)
		external
		view
		returns (Allocation memory)
	;

	/**
	* @notice Update a strategy allocation
	* @param _strategy {address}
	* @param _numerator {uint8}
	* @param _denominator {uint8}
	*/
	function strategyAllocationUpdate(address _strategy, uint8 _denominator, uint8 _numerator)
		external
	;

	/**
	* @notice Add a strategy
	* @param _strategy {address}
	* @param _numerator {uint8}
	* @param _denominator {uint8}
	*/
	function strategyAdd(address _strategy, uint8 _denominator, uint8 _numerator)
		external
	;

	/**
	* @notice Subtract a strategy
	* @param _strategy {address}
	*/
	function strategySubtract(address _strategy)
		external
	;

	/**
	* @notice Return the Total Value of Assets in WETH
	* @return {uint256}
	*/
	function totalValueOfAssetsInWETH()
		external
		view
		returns (uint256)
	;
}
