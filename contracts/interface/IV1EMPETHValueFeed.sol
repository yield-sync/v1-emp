// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


interface IV1EMPETHValueFeed
{
	/**
	* @notice Return the value of the ERC20 denominated in ETH
	* @return utilizedERC20ETHValue_ {uint256}
	*/
	function utilizedERC20ETHValue()
		external
		view
		returns (uint256 utilizedERC20ETHValue_)
	;

	/**
	*  @notice ERC20 Decimals
	*/
	function eRC20Decimals()
		external
		view
		returns (uint8)
	;

}
