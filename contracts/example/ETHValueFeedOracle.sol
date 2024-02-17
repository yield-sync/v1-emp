// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;


import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

import { IYieldSyncV1EMPETHValueFeed } from "../interface/IYieldSyncV1EMPETHValueFeed.sol";


contract ETHValueFeedOracle is
	IYieldSyncV1EMPETHValueFeed
{
	address public manager;

	mapping (address eRC20 => AggregatorV3Interface aggregatorV3Interface) public eRC20_aggregatorV3Interface;


	constructor ()
	{
		manager = msg.sender;
	}


	modifier authManager()
	{
		require(manager == msg.sender, "manager != msg.sender");

		_;
	}


	/// @inheritdoc IYieldSyncV1EMPETHValueFeed
	function utilizedERC20ETHValue(address _utilizedERC20)
		public
		view
		override
		returns (uint256 utilizedERC20ETHValue_)
	{
		(, int256 price, , , ) = eRC20_aggregatorV3Interface[_utilizedERC20].latestRoundData();

		return uint256(price);
	}


	function addAggregatorV3Interface(address _eRC20, address _aggregatorV3Interface)
		public
		authManager()
	{
		require(address(eRC20_aggregatorV3Interface[_eRC20]) == address(0), "Already set");

		eRC20_aggregatorV3Interface[_eRC20] = AggregatorV3Interface(_aggregatorV3Interface);
	}
}
