// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import { Allocation, IYieldSyncV1AssetAllocator } from "./interface/IYieldSyncV1AssetAllocator.sol";
import { IYieldSyncV1StrategyHandler } from "./interface/IYieldSyncV1StrategyHandler.sol";


using SafeERC20 for ERC20;


contract YieldSyncV1AssetAllocator is
	ERC20,
	IYieldSyncV1AssetAllocator
{
	address public override manager;
	address[] internal _activeStrategy;

	bool public override onlyPrioritizedStrategy;

	uint256 public constant override INITIAL_MINT_RATE = 100;


	mapping (address strategy => Allocation allocation) internal _strategy_allocation;


	constructor (address _manager, bool _onlyPrioritizedStrategy, string memory _name, string memory _symbol)
		ERC20(_name, _symbol)
	{
		manager = _manager;
		onlyPrioritizedStrategy = _onlyPrioritizedStrategy;
	}


	modifier accessManager()
	{
		require(msg.sender == manager, "!manager");

		_;
	}


	/// @inheritdoc IYieldSyncV1AssetAllocator
	function activeStrategy()
		external
		view
		returns (address[] memory)
	{
		return _activeStrategy;
	}

	/// @inheritdoc IYieldSyncV1AssetAllocator
	function strategy_allocation(address _strategy)
		public
		view
		override
		returns (Allocation memory allocation_)
	{
		return _strategy_allocation[_strategy];
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
				IYieldSyncV1StrategyHandler(_activeStrategy[i]).positionValueInETH(msg.sender),
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
	function depositTokens(address _strategy, address[] memory _utilizedToken, uint256[] memory _amounts)
		public
	{
		require(_utilizedToken.length > 0, "Must deposit at least one token");

		require(
			_utilizedToken.length == IYieldSyncV1StrategyHandler(_strategy).utilizedToken().length, "!utilizedToken.length"
		);

		if (onlyPrioritizedStrategy)
		{
			require(_strategy == prioritizedStrategy(), "!prioritizedStrategy");
		}

		uint256 totalDepositValue = 0;

		for (uint256 i = 0; i < _utilizedToken.length; i++)
		{
			require(
				IYieldSyncV1StrategyHandler(_strategy).token_utilized(_utilizedToken[i]),
				"!IYieldSyncV1Strategy(_strategy).token_utilized(_utilizedToken[i])"
			);

			ERC20(_utilizedToken[i]).safeTransferFrom(msg.sender, address(this), _amounts[i]);

			// Calculate the value of the deposited tokens
			totalDepositValue += IYieldSyncV1StrategyHandler(_strategy).utilizedTokenValueInETH(
				_utilizedToken[i]
			) * _amounts[i];
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
		returns (uint256 totalValueInETH_)
	{
		uint256 _totalValueInETH = 0;

		for (uint256 i = 0; i < _activeStrategy.length; i++)
		{
			_totalValueInETH += IYieldSyncV1StrategyHandler(_activeStrategy[i]).positionValueInETH(address(this));
		}

		return _totalValueInETH;
	}
}
