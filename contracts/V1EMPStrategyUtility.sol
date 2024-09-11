
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


// Move Array Utility here
import { IV1EMPStrategyUtility, UtilizationERC20 } from "./interface/IV1EMPStrategyUtility.sol";
// Move ETH Value feed interface here


contract V1EMPStrategyUtility is
	IV1EMPStrategyUtility
{
	function depositAmountsValidator(uint256[] memory _utilizedERC20Amount)
		public
	{
		// Check that length is correct

		// verify allocations is correct

		// Return valid status with message
	}

	function sort()
		public
	{
		// Pass through for array utility
	}

	function utilizedERC20AmountETHValue()
		public
	{
		// calculate and return ETH value feed
	}

	function utilizedERC20Generator(address[] memory _utilizedERC20, UtilizationERC20[] memory _utilizationERC20)
		public
	{
		// Check that the length of both parameters match

		// Use array utilities to verify that there are no duplicates

		// Loop through each element
			// Verify that ETH Value Feed exists
			// Sum up allocation

		// Check that allocations add up to 100%

		// Return both values
	}
}
