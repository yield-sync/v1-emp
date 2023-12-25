// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";


interface IYieldSyncV1EMPPriceFeed
{
	/**
	* Return the value of the ERC 20 in ETH
	* @param _utilizedERC20 {address}
	* @return utilizedERC20ETHValue_ {uint256}
	*/
	function utilizedERC20ETHValue(address _utilizedERC20)
		external
		view
		returns (uint256 utilizedERC20ETHValue_)
	;
}
