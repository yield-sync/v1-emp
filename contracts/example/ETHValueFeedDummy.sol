// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IYieldSyncV1EMPETHValueFeed } from "../interface/IYieldSyncV1EMPETHValueFeed.sol";


contract ETHValueFeedDummy is
	IYieldSyncV1EMPETHValueFeed
{
	uint256 public eTHValue = .5e18;

	/// @inheritdoc IYieldSyncV1EMPETHValueFeed
	function utilizedERC20ETHValue(address _utilizedERC20)
		public
		view
		override
		returns (uint256 utilizedERC20ETHValue_)
	{
		return eTHValue;
	}
}
