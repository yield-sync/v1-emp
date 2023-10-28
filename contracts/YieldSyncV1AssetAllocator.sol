// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

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

	bool internal _onlyPrioritizedStrategy;


	mapping (address strategy => Allocation allocation) internal _strategy_allocation;


	constructor (address __manager, string memory _name, string memory _symbol)
		ERC20(_name, _symbol)
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
		returns (address[] memory activeStrategy_)
	{
		return _activeStrategy;
	}

	function manager()
		public
		view
		returns (address manager_)
	{
		return _manager;
	}

	function onlyPrioritizedStrategy()
		public
		view
		returns (bool onlyPrioritizedStrategy_)
	{
		return _onlyPrioritizedStrategy;
	}

	function prioritizedStrategy()
		public
		view
		returns (address strategy_)
	{
		address strategy;

		uint256 greatestStrategyDeficiency = 0;
		uint256 totalValueInEth = 0;

		for (uint256 i = 0; i < _activeStrategy.length; i++)
		{
			totalValueInEth += IYieldSyncV1Strategy(_activeStrategy[i]).positionValueInEth();
		}

		for (uint256 i = 0; i < _activeStrategy.length; i++)
		{
			(, uint256 strategyAllocation) = SafeMath.tryDiv(
				IYieldSyncV1Strategy(_activeStrategy[i]).positionValueInEth(),
				totalValueInEth
			);

			if (strategyAllocation <= greatestStrategyDeficiency)
			{
				greatestStrategyDeficiency = strategyAllocation;
				strategy = _activeStrategy[i];
			}
		}

		return strategy;
	}


	function depositTokens(address strategy, address[] memory _utilizedToken)
		public
	{
		if (_onlyPrioritizedStrategy)
		{
			require(strategy == prioritizedStrategy(), "!prioritizedStrategy");
		}

		require(_utilizedToken.length == IYieldSyncV1Strategy(strategy).utilizedToken().length, "!utilizedToken.length");

		for (uint256 i = 0; i < _utilizedToken.length; i++)
		{
			require(
				IYieldSyncV1Strategy(strategy).token_utilized(_utilizedToken[i]),
				"!IYieldSyncV1Strategy(strategy).token_utilized(_utilizedToken[i])"
			);
		}
	}

	function strategyAllocationUpdate(address _strategy, uint8 _denominator, uint8 _numerator)
		public
		accessManager()
	{
		_strategy_allocation[_strategy] = Allocation({
			denominator: _denominator,
			numerator: _numerator
		});
	}

	function strategyAdd(address _strategy, uint8 _denominator, uint8 _numerator)
		public
		accessManager()
	{
		_activeStrategy.push(_strategy);

		_strategy_allocation[_strategy] = Allocation({
			denominator: _denominator,
			numerator: _numerator
		});
	}

	function strategySubtract(address _strategy)
		public
		accessManager()
	{
		_strategy_allocation[_strategy] = Allocation({
			denominator: _strategy_allocation[_strategy].denominator,
			numerator: 0
		});

		for (uint256 i = 0; i < _activeStrategy.length; i++)
		{
			if (_activeStrategy[i] == _strategy)
			{
				_activeStrategy[i] = _activeStrategy[_activeStrategy.length - 1];

				_activeStrategy.pop();

				break;
			}
		}
	}
}
