// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { IERC20, IYieldSyncV1AssetAllocator } from "./interface/IYieldSyncV1AssetAllocator.sol";
import { IYieldSyncV1Strategy } from "./interface/IYieldSyncV1Strategy.sol";


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
		returns (address[] memory)
	{
		return _activeStrategy;
	}


	function allocate()
		public
	{}

	function greatestDeficientStrategy()
		public
		view
		returns (address strategy_)
	{
		address strategy = address(0);

		uint256 greatestStrategyDeficiency = 0;
		uint256 totalValueInEth = 0;

		for (uint256 i = 0; i < _activeStrategy.length; i++)
		{
			totalValueInEth += IYieldSyncV1Strategy(_activeStrategy[i]).positionValueInEth();
		}

		for (uint256 i = 0; i < _activeStrategy.length; i++)
		{
			uint256 strategyAllocation = IYieldSyncV1Strategy(_activeStrategy[i]).positionValueInEth() / totalValueInEth;

			if (strategyAllocation < greatestStrategyDeficiency)
			{
				greatestStrategyDeficiency = strategyAllocation;
				strategy = _activeStrategy[i];
			}
		}

		return strategy;
	}

	function deposit()
		public
	{
	}

	function withdrawalRequestCreate()
		public
	{}


	function strategyAllocationUpdate(address strategy, uint8 denominator, uint8 numerator)
		public
		accessManager()
	{
		_strategy_allocation[strategy] = Allocation({
			denominator: denominator,
			numerator: numerator
		});
	}

	function strategyAdd(address strategy, uint8 denominator, uint8 numerator)
		public
		accessManager()
	{
		_activeStrategy.push(strategy);

		_strategy_allocation[strategy] = Allocation({
			denominator: denominator,
			numerator: numerator
		});
	}

	function strategySubtract(address strategy)
		public
		accessManager()
	{
		// [update] _strategy
		for (uint256 i = 0; i < _activeStrategy.length; i++)
		{
			if (_activeStrategy[i] == strategy)
			{
				_activeStrategy[i] = _activeStrategy[_activeStrategy.length - 1];

				_activeStrategy.pop();

				break;
			}
		}

		// [update] _strategy_allocation
		_strategy_allocation[strategy] = Allocation({
			denominator: _strategy_allocation[strategy].denominator,
			numerator: 0
		});
	}
}
