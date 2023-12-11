// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import { Allocation, IYieldSyncV1AMPAssetAllocator } from "./interface/IYieldSyncV1AMPAssetAllocator.sol";
import { IYieldSyncV1AMPStrategy } from "./interface/IYieldSyncV1AMPStrategy.sol";


using SafeERC20 for ERC20;


contract YieldSyncV1AMPAssetAllocator is
	ERC20,
	IYieldSyncV1AMPAssetAllocator
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


	/// @inheritdoc IYieldSyncV1AMPAssetAllocator
	function activeStrategy()
		external
		view
		returns (address[] memory)
	{
		return _activeStrategy;
	}

	/// @inheritdoc IYieldSyncV1AMPAssetAllocator
	function strategy_allocation(address _strategy)
		public
		view
		override
		returns (Allocation memory allocation_)
	{
		return _strategy_allocation[_strategy];
	}


	/// @inheritdoc IYieldSyncV1AMPAssetAllocator
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
				IYieldSyncV1AMPStrategy(_activeStrategy[i]).eTHValuePosition(msg.sender),
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

	/// @inheritdoc IYieldSyncV1AMPAssetAllocator
	function depositTokens(address _strategy, address[] memory _utilizedToken, uint256[] memory _utilizedTokenAmount)
		public
	{
		require(_utilizedToken.length > 0, "Must deposit at least one token");

		require(
			_utilizedToken.length == IYieldSyncV1AMPStrategy(_strategy).utilizedToken().length,
			"!utilizedToken.length"
		);

		if (onlyPrioritizedStrategy)
		{
			require(_strategy == prioritizedStrategy(), "!prioritizedStrategy");
		}

		uint256 totalDepositValue = 0;

		for (uint256 i = 0; i < _utilizedToken.length; i++)
		{
			require(
				IYieldSyncV1AMPStrategy(_strategy).token_utilized(_utilizedToken[i]),
				"!IYieldSyncV1AMPStrategy(_strategy).token_utilized(_utilizedToken[i])"
			);

			ERC20(_utilizedToken[i]).safeTransferFrom(msg.sender, address(this), _utilizedTokenAmount[i]);

			// Calculate the value of the deposited tokens
			totalDepositValue += IYieldSyncV1AMPStrategy(_strategy).utilizedTokenETHValue(
				_utilizedToken[i]
			) * _utilizedTokenAmount[i];
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

	/// @inheritdoc IYieldSyncV1AMPAssetAllocator
	function strategyAllocationUpdate(address _strategy, uint8 _denominator, uint8 _numerator)
		public
		accessManager()
	{
		_strategy_allocation[_strategy] = Allocation({
			denominator: _denominator,
			numerator: _numerator
		});
	}

	/// @inheritdoc IYieldSyncV1AMPAssetAllocator
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

	/// @inheritdoc IYieldSyncV1AMPAssetAllocator
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

	/// @inheritdoc IYieldSyncV1AMPAssetAllocator
	function totalValueOfAssetsInWETH()
		public
		view
		returns (uint256 totalETHValue_)
	{
		uint256 _totalETHValue = 0;

		for (uint256 i = 0; i < _activeStrategy.length; i++)
		{
			_totalETHValue += IYieldSyncV1AMPStrategy(_activeStrategy[i]).eTHValuePosition(address(this));
		}

		return _totalETHValue;
	}
}
