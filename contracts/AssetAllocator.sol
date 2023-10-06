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
	address internal _manager;

	address[] internal _strategy;

	mapping (address strategy => Allocation allocation) internal _strategy_allocation;


	constructor (address __manager)
	{
		_manager = __manager;
	}


	modifier accessManager()
	{
		require(true, "!manager");

		_;
	}


	function strategy()
		public
		view
		override
		returns (address[] memory)
	{
		return _strategy;
	}


	function allocate()
		public
		override
	{
		// Move funds from this smart contract into
			// Calculate how much needs to be transferred


	}

	function strategyAllocationUpdate(address __strategy, uint8 denominator, uint8 numerator)
		public
		override
	{
		_strategy_allocation[__strategy] = Allocation({
			denominator: denominator,
			numerator: numerator
		});
	}

	function strategyAdd(address __strategy, uint8 denominator, uint8 numerator)
		public
		override
	{
		_strategy.push(__strategy);

		_strategy_allocation[__strategy] = Allocation({
			denominator: denominator,
			numerator: numerator
		});
	}

	function strategySubtract(address __strategy)
		public
		override
	{
		// [update] _strategy
		for (uint256 i = 0; i < _strategy.length; i++)
		{
			if (_strategy[i] == __strategy)
			{
				_strategy[i] = _strategy[_strategy.length - 1];

				_strategy.pop();

				break;
			}
		}

		// [update] _strategy_allocation
		_strategy_allocation[__strategy] = Allocation({
			denominator: _strategy_allocation[__strategy].denominator,
			numerator: 0
		});
	}

	function withdrawalRequestCreate()
		public
		override
	{}
}
