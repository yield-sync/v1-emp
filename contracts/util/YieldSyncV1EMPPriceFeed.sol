// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";


contract YieldSyncV1EMPPriceFeed
{
	mapping (address => AggregatorV3Interface) public eRC20_aggregatorV3Interface;


	constructor ()
	{}


	function addAggregatorV3Interface()
		public
	{

	}
}
