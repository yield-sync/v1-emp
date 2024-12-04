// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { UtilizationERC20 } from "../struct/UtilizationERC20.sol";


interface IV1EMPStrategyUtility
{
	/// @notice view


	/**
	* @notice Deposit Amounts Valid
	* @param _v1EMPStrategy {address}
	* @param _utilizedERC20Amount {address[]}
	* @return valid_ {bool}
	* @return message_ {string}
	* @return utilizedERC20AmountETHValueTotal_ {uint256}
	*/
	function depositAmountsValid(address _v1EMPStrategy, uint256[] memory _utilizedERC20Amount)
		external
		view
		returns (bool valid_, string memory message_, uint256 utilizedERC20AmountETHValueTotal_)
	;

	/**
	* @notice Utilized ERC20 Amount ETH Value
	* @param _v1EMPStrategy {address}
	* @param _utilizedERC20Amount {uint256[]}
	* @return utilizedERC20AmountETHValueTotal_ {uint256}
	* @return utilizedERC20AmountETHValue_ {uint256[]}
	*/
	function utilizedERC20AmountETHValue(address _v1EMPStrategy, uint256[] memory _utilizedERC20Amount)
		external
		view
		returns (uint256 utilizedERC20AmountETHValueTotal_, uint256[] memory utilizedERC20AmountETHValue_)
	;


	/// @notice mutative


	/**
	* @notice Utilized ERC20 Sort
	* @param _utilizedERC20 {addrss[]}
	* @return {address[]}
	*/
	function utilizedERC20Sort(address[] memory _utilizedERC20)
		external
		returns (address[] memory)
	;

	/**
	* @notice Utilized ERC20 Update Valid
	* @param _v1EMPStrategy {address}
	* @param _utilizedERC20 {address[]}
	* @param _utilizationERC20 {UtilizationERC20[]}
	*/
	function utilizedERC20UpdateValid(
		address _v1EMPStrategy,
		address[] memory _utilizedERC20,
		UtilizationERC20[] memory _utilizationERC20
	)
		external
		returns (bool valid_, string memory message_)
	;
}
