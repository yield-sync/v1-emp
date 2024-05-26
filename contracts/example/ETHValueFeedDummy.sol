// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IYieldSyncV1EMPETHValueFeed } from "../interface/IYieldSyncV1EMPETHValueFeed.sol";


contract ETHValueFeedDummy is
	IYieldSyncV1EMPETHValueFeed
{
	uint256 public eTHValue = 1e18;


	/// @inheritdoc IYieldSyncV1EMPETHValueFeed
<<<<<<< HEAD
	function utilizedERC20ETHValue(address __utilizedERC20)
=======
	function utilizedERC20ETHValue(address _utilizedERC20)
>>>>>>> master
		public
		view
		override
		returns (uint256 utilizedERC20ETHValue_)
	{
		return eTHValue;
	}


	function updateETHValue(uint256 _eTHValue)
		public
	{
		eTHValue = _eTHValue;
	}
}
