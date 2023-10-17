// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { IERC20, IYieldSyncV1AssetAllocator } from "./interface/IYieldSyncV1AssetAllocator.sol";


struct Allocation
{
	uint8 denominator;
	uint8 numerator;
}


contract YieldSyncV1AssetAllocator is
	ERC20
{
	address internal _manager;

	address[] internal _activeStrategy;

	mapping (address strategy => Allocation allocation) internal _strategy_allocation;


	constructor (address __manager, string memory name, string memory symbol)
		ERC20(name, symbol)
	{
		_manager = __manager;
	}


	modifier accessManager()
	{
		require(msg.sender == _manager, "!manager");

		_;
	}


	function activeStrategy()
		public
		view
		//override
		returns (address[] memory)
	{
		return _activeStrategy;
	}


	function allocate()
		public
		//override
	{}

	function isDeficientStrategy(address strategy)
		public
		returns (bool)
	{

	}

	function deposit(address strategy, address token, uint256 amount)
		public
	{
		// Check if this AssetAllocator is utilizing the strategy
		require(_strategy_allocation[strategy].numerator > 0, "_strategy_allocation[strategy].numerator == 0");

		// Check if their is an deficiency
		require(isDeficientStrategy(strategy), "isDeficientStrategy(strategy) = false");

		// Transfer tokens to strategy
		IERC20(token).transfer(address(strategy), amount);

		_mint(msg.sender, amount);
	}

	function withdrawalRequestCreate()
		public
		//override
	{}


	function strategyAllocationUpdate(address __strategy, uint8 denominator, uint8 numerator)
		public
		//override
		accessManager()
	{
		_strategy_allocation[__strategy] = Allocation({
			denominator: denominator,
			numerator: numerator
		});
	}

	function strategyAdd(address __strategy, uint8 denominator, uint8 numerator)
		public
		//override
		accessManager()
	{
		_strategy.push(__strategy);

		_strategy_allocation[__strategy] = Allocation({
			denominator: denominator,
			numerator: numerator
		});
	}

	function strategySubtract(address __strategy)
		public
		//override
		accessManager()
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
}
