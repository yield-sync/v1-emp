// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import {
	IERC20ETHValueProvider
} from "@yield-sync/erc20-eth-value-provider/contracts/interface/IERC20ETHValueProvider.sol";


/**
 * @notice WARNING: This contract is ONLY for TESTING.
 */
contract ERC20ETHValueProviderDummy is
	IERC20ETHValueProvider
{
	uint256 public eTHValue = 1e18;
	uint8 public decimals;


	constructor (uint8 _decimals)
	{
		decimals = _decimals;
	}


	/// @inheritdoc IERC20ETHValueProvider
	function utilizedERC20ETHValue()
		public
		view
		override
		returns (uint256 utilizedERC20ETHValue_)
	{
		return eTHValue;
	}

	/// @inheritdoc IERC20ETHValueProvider
	function eRC20Decimals()
		public
		view
		override
		returns (uint8)
	{
		/**
		* @dev This function should return the decimals place for the given erc20. If the ERC20 does not have such a
		* function then create a relevant decimals function here.
		*/
		return decimals;
	}


	function updateETHValue(uint256 _eTHValue)
		public
	{
		eTHValue = _eTHValue;
	}
}
