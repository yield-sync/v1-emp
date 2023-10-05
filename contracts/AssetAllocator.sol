// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IAssetAllocator } from "./interface/IAssetAllocator.sol";


contract AssetAllocator is
	IAssetAllocator
{
	constructor ()
	{}


	modifier accessManager()
	{
		_;
	}


	function allocate()
		public
		override
	{}

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
