// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IV1EMPETHValueFeed } from "../interface/IV1EMPETHValueFeed.sol";


/**
 * @notice WARNING: This contract is ONLY for TESTING. Do not use as actual ETH feed
 */
contract ETHValueFeedDummy is
	IV1EMPETHValueFeed
{
	uint256 public eTHValue = 1e18;


	/// @inheritdoc IV1EMPETHValueFeed
	function utilizedERC20ETHValue()
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
