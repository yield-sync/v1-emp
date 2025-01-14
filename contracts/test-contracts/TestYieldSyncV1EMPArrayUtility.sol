// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { V1EMPArrayUtility } from "../V1EMPArrayUtility.sol";


/**
* @notice WARNING: This contract is ONLY for TESTING.
* @notice This is a wrapper contract made only for testing. Do not set this is the Array Utility.
*/
contract TestV1EMPArrayUtility is
	V1EMPArrayUtility
{
	function uniqueAddresses()
		public
		view
		returns (address[] memory)
	{
		return _uniqueAddresses;
	}
}
