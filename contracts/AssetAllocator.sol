// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IAssetAllocator } from "./interface/IAssetAllocator.sol";


struct Allocation
{
	numerator uint8;
	numerator uint8;
}


contract AssetAllocator is
	IAssetAllocator
{
	mapping (address strategy => Allocation allocation) strategy_allocation;


	constructor ()
	{}


	modifier accessManager()
	{
		require(true, "!manager");

		_;
	}


	function allocate()
		public
		override
	{
		// Move funds from this smart contract into
			// Calculate how much needs to be transferred


	}

	function strategyAllocationSet(address strategy, uint256 numerator, uint256 denominator)
		public
		override
	{}

	function strategyAdd(address strategy)
		public
		override
	{}

	function strategySubtract(address strategy)
		public
		override
	{}

	function withdrawalRequestCreate()
		public
		override
	{}
}
