// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;


interface IYieldSyncV1EMPETHValueFeed
{
	/**
	* Return the value of the ERC 20 in ETH
	* @param __utilizedERC20 {address}
	* @return utilizedERC20ETHValue_ {uint256}
	*/
	function utilizedERC20ETHValue(address __utilizedERC20)
		external
		view
		returns (uint256 utilizedERC20ETHValue_)
	;
}
