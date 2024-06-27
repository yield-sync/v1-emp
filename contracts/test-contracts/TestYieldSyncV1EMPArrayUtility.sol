// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { YieldSyncV1EMPArrayUtility } from "../YieldSyncV1EMPArrayUtility.sol";


/**
 * @notice This is a wrapper contract made only for testing. Do not set this is the Array Utility.
 */
contract TestYieldSyncV1EMPArrayUtility is
	YieldSyncV1EMPArrayUtility
{
	function uniqueAddresses()
		public
		view
		returns (address[] memory)
	{
		return _uniqueAddresses;
	}
}
