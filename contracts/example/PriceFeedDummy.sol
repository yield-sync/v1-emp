// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IYieldSyncV1EMPPriceFeed } from "../interface/IYieldSyncV1EMPPriceFeed.sol";


contract PriceFeedDummy is
	IYieldSyncV1EMPPriceFeed
{
	/// @inheritdoc IYieldSyncV1EMPPriceFeed
	function utilizedERC20ETHValue(address _utilizedERC20)
		public
		view
		override
		returns (uint256 utilizedERC20ETHValue_)
	{
		return 1e18;
	}
}
