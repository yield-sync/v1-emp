// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IAssetAllocator } from "./interface/IAssetAllocator.sol";


struct Allocation
{
	uint8 denominator;
	uint8 numerator;
}


contract AssetAllocator is
	IAssetAllocator
{
	address[] public strategy;

	mapping (address strategy => Allocation allocation) internal _strategy_allocation;


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

	function strategyAllocationSet(address _strategy, uint256 numerator, uint256 denominator)
		public
		override
	{}

	function strategyAdd(address _strategy, uint8 denominator, uint8 numerator)
		public
		override
	{
		_strategy_allocation[_strategy] = Allocation({
			denominator: denominator,
			numerator: numerator
		});

		strategy.push(_strategy);
	}

	function strategySubtract(address _strategy)
		public
		override
	{}

	function withdrawalRequestCreate()
		public
		override
	{}
}
