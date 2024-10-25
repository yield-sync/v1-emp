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
	uint8 public decimals;


	constructor (uint8 _decimals)
	{
		decimals = _decimals;
	}


	/// @inheritdoc IV1EMPETHValueFeed
	function utilizedERC20ETHValue()
		public
		view
		override
		returns (uint256 utilizedERC20ETHValue_)
	{
		return eTHValue;
	}

	/// @inheritdoc IV1EMPETHValueFeed
	/**
	* @dev This function should return the decimals place for the given erc20. If the ERC20 does not have such a function
	* then create a relevant decimals function here.
	*/
	function eRC20Decimals()
		public
		view
		override
		returns (uint8)
	{
		return decimals;
	}


	function updateETHValue(uint256 _eTHValue)
		public
	{
		eTHValue = _eTHValue;
	}
}
