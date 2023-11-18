// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import { Allocation, IYieldSyncV1AssetAllocator } from "./interface/IYieldSyncV1AssetAllocator.sol";
import { IYieldSyncV1Strategy } from "./interface/IYieldSyncV1Strategy.sol";


using SafeERC20 for ERC20;


contract YieldSyncV1AssetAllocator is
	ERC20,
	IYieldSyncV1AssetAllocator
{
	uint256 public constant override INITIAL_MINT_RATE = 100;

	address internal _manager;

	address[] internal _activeStrategy;

	bool internal _onlyPrioritizedStrategy;


	mapping (address strategy => Allocation allocation) internal _strategy_allocation;


	constructor (address __manager, bool __onlyPrioritizedStrategy, string memory _name, string memory _symbol)
		ERC20(_name, _symbol)
	{
		_manager = __manager;
		_onlyPrioritizedStrategy = __onlyPrioritizedStrategy;
	}


	modifier accessManager()
	{
		require(msg.sender == _manager, "!manager");

		_;
	}


	/// @inheritdoc IYieldSyncV1AssetAllocator
	function activeStrategy()
		public
		view
		override
		returns (address[] memory activeStrategy_)
	{
		return _activeStrategy;
	}

	/// @inheritdoc IYieldSyncV1AssetAllocator
	function manager()
		public
		view
		override
		returns (address manager_)
	{
		return _manager;
	}

	/// @inheritdoc IYieldSyncV1AssetAllocator
	function onlyPrioritizedStrategy()
		public
		view
		override
		returns (bool onlyPrioritizedStrategy_)
	{
		return _onlyPrioritizedStrategy;
	}

	/// @inheritdoc IYieldSyncV1AssetAllocator
	function prioritizedStrategy()
		public
		view
		override
		returns (address strategy_)
	{
		address strategy;

		uint256 greatestStrategyDeficiency = 0;
		uint256 _totalValueOfAssetsInWETH = totalValueOfAssetsInWETH();

		for (uint256 i = 0; i < _activeStrategy.length; i++)
		{
			(, uint256 strategyAllocation) = SafeMath.tryDiv(
				IYieldSyncV1Strategy(_activeStrategy[i]).positionValueInWETH(msg.sender),
				_totalValueOfAssetsInWETH
			);

			if (strategyAllocation <= greatestStrategyDeficiency)
			{
				greatestStrategyDeficiency = strategyAllocation;
				strategy = _activeStrategy[i];
			}
		}

		return strategy;
	}

	/// @inheritdoc IYieldSyncV1AssetAllocator
	function depositTokens(address strategy, address[] memory _utilizedToken,  uint256[] memory _amounts)
		public
	{
		require(_utilizedToken.length > 0, "Must deposit at least one token");

		require(_utilizedToken.length == IYieldSyncV1Strategy(strategy).utilizedToken().length, "!utilizedToken.length");

		if (_onlyPrioritizedStrategy)
		{
			require(strategy == prioritizedStrategy(), "!prioritizedStrategy");
		}

		uint256 totalDepositValue = 0;

		for (uint256 i = 0; i < _utilizedToken.length; i++)
		{
			require(
				IYieldSyncV1Strategy(strategy).token_utilized(_utilizedToken[i]),
				"!IYieldSyncV1Strategy(strategy).token_utilized(_utilizedToken[i])"
			);

			ERC20(_utilizedToken[i]).safeTransferFrom(msg.sender, address(this), _amounts[i]);

			// Calculate the value of the deposited tokens
			totalDepositValue += IYieldSyncV1Strategy(strategy).utilizedTokenValueInWETH(_utilizedToken[i]) * _amounts[i];
		}

		uint256 tokensToMint;

		if (totalSupply() == 0 || totalValueOfAssetsInWETH() == 0)
		{
			// Initial mint
			tokensToMint = totalDepositValue * INITIAL_MINT_RATE;
		}
		else
		{
			// Calculate proportion of deposit value to total asset value
			tokensToMint = totalDepositValue * totalSupply() / totalValueOfAssetsInWETH();
		}

		// Mint the allocator tokens to the sender
		_mint(msg.sender, tokensToMint);
	}

	/// @inheritdoc IYieldSyncV1AssetAllocator
	function strategy_allocation(address strategy)
		public
		view
		override
		returns (Allocation memory)
	{
		return _strategy_allocation[strategy];
	}

	/// @inheritdoc IYieldSyncV1AssetAllocator
	function strategyAllocationUpdate(address _strategy, uint8 _denominator, uint8 _numerator)
		public
		accessManager()
	{
		_strategy_allocation[_strategy] = Allocation({
			denominator: _denominator,
			numerator: _numerator
		});
	}

	/// @inheritdoc IYieldSyncV1AssetAllocator
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

	/// @inheritdoc IYieldSyncV1AssetAllocator
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

	/// @inheritdoc IYieldSyncV1AssetAllocator
	function totalValueOfAssetsInWETH()
		public
		view
		returns (uint256 totalValueInWETH_)
	{
		uint256 _totalValueInWETH = 0;

		for (uint256 i = 0; i < _activeStrategy.length; i++)
		{
			_totalValueInWETH += IYieldSyncV1Strategy(_activeStrategy[i]).positionValueInWETH(address(this));
		}

		return _totalValueInWETH;
	}
}
