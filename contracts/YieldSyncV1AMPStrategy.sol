
// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import {
	IERC20,
	IYieldSyncV1AMPStrategyInteractor,
	IYieldSyncV1AMPStrategy,
	SafeERC20
} from "./interface/IYieldSyncV1AMPStrategy.sol";


using SafeERC20 for IERC20;


contract YieldSyncV1AMPStrategy is
	ERC20,
	IYieldSyncV1AMPStrategy,
	ReentrancyGuard
{
	using SafeERC20 for uint256;
	address public immutable manager;

	address[] internal _utilizedERC20;

	uint256 constant public override ONE_HUNDRED_PERCENT = 1e18;

	uint256[] internal _utilizedERC20Allocation;

	IYieldSyncV1AMPStrategyInteractor public override yieldSyncV1AMPStrategyInteractor;


	receive ()
		external
		payable
	{}


	fallback ()
		external
		payable
	{}


	constructor (address _manager, string memory _name, string memory _symbol)
		ERC20(_name, _symbol)
	{
		manager = _manager;
	}


	//// @notice view


	/// @inheritdoc IYieldSyncV1AMPStrategy
	function utilizedERC20()
		public
		view
		override
		returns (address[] memory)
	{
		return _utilizedERC20;
	}

	/// @inheritdoc IYieldSyncV1AMPStrategy
	function utilizedERC20Allocation()
		public
		view
		override
		returns (uint256[] memory)
	{
		return _utilizedERC20Allocation;
	}

	/// @inheritdoc IYieldSyncV1AMPStrategy
	function balanceOfETHValue(address _target)
		public
		view
		override
		returns (uint256 balanceOfETHValue_)
	{
		uint256[] memory uTAPB = utilizedERC20AmountPerBurn();

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			balanceOfETHValue_ += uTAPB[i] * yieldSyncV1AMPStrategyInteractor.eRC20ETHValue(_utilizedERC20[i]) * balanceOf(_target);
		}
	}

	/// @inheritdoc IYieldSyncV1AMPStrategy
	function utilizedERC20AmountValid(uint256[] memory _utilizedERC20Amount)
		public
		view
		returns (bool utilizedERC20AmountValid_)
	{
		require(_utilizedERC20.length == _utilizedERC20Amount.length, "_utilizedERC20.length != _utilizedERC20Amount.length");

		utilizedERC20AmountValid_ = true;

		uint256 totalETHValue;

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			totalETHValue += SafeMath.div(
				SafeMath.mul(
				_utilizedERC20Amount[i] * 10 ** (18 - ERC20(_utilizedERC20[i]).decimals()),
					yieldSyncV1AMPStrategyInteractor.eRC20ETHValue(_utilizedERC20[i])
				),
				10 ** 18
			);
		}

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			(bool computed, uint256 amountAllocationActual) = SafeMath.tryDiv(
				SafeMath.mul(
					SafeMath.div(
						SafeMath.mul(
							_utilizedERC20Amount[i],
							yieldSyncV1AMPStrategyInteractor.eRC20ETHValue(_utilizedERC20[i])
						),
						10 ** ERC20(_utilizedERC20[i]).decimals()
					),
					1e18
				),
				totalETHValue
			);

			require(computed, "!computed");

			if (_utilizedERC20Allocation[i] != amountAllocationActual)
			{
				utilizedERC20AmountValid_ = false;

				break;
			}
		}
	}

	/// @inheritdoc IYieldSyncV1AMPStrategy
	function utilizedERC20AmountPerBurn()
		public
		view
		override
		returns (uint256[] memory utilizedERC20Amount_)
	{
		utilizedERC20Amount_ = yieldSyncV1AMPStrategyInteractor.eRC20TotalAmount(_utilizedERC20);

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			(, uint256 utilizedERC20Amount) = SafeMath.tryDiv(SafeMath.mul(utilizedERC20Amount_[i], 1e18), totalSupply());

			utilizedERC20Amount_[i] = utilizedERC20Amount;
		}
	}


	/// @notice mutative


	/// @inheritdoc IYieldSyncV1AMPStrategy
	function initializeStrategy(
		address _strategy,
		address[] memory __utilizedERC20,
		uint256[] memory __utilizedERC20Allocation
	)
		public
		override
	{
		require(manager == msg.sender, "manager != msg.sender");

		require(
			address(yieldSyncV1AMPStrategyInteractor) == address(0), "address(yieldSyncV1AMPStrategyInteractor) != address(0)"
		);

		require(
			__utilizedERC20.length == __utilizedERC20Allocation.length,
			"__utilizedERC20.length != __utilizedERC20Allocation.length"
		);

		yieldSyncV1AMPStrategyInteractor = IYieldSyncV1AMPStrategyInteractor(_strategy);

		_utilizedERC20 = __utilizedERC20;

		utilizedERC20AllocationSet(__utilizedERC20Allocation);
	}

	/// @inheritdoc IYieldSyncV1AMPStrategy
	function utilizedERC20AllocationSet(uint256[] memory __utilizedERC20Allocation)
		public
		override
	{
		require(manager == msg.sender, "manager != msg.sender");

		require(
			_utilizedERC20.length == __utilizedERC20Allocation.length,
			"_utilizedERC20.length != __utilizedERC20Allocation.length"
		);

		uint256 _utilizedERC20AllocationTotal;

		for (uint256 i = 0; i < __utilizedERC20Allocation.length; i++)
		{
			_utilizedERC20AllocationTotal += __utilizedERC20Allocation[i];
		}

		require(_utilizedERC20AllocationTotal == ONE_HUNDRED_PERCENT, "_utilizedERC20AllocationTotal != ONE_HUNDRED_PERCENT");

		_utilizedERC20Allocation = __utilizedERC20Allocation;
	}

	/// @inheritdoc IYieldSyncV1AMPStrategy
	function utilizedERC20Deposit(uint256[] memory _utilizedERC20Amount)
		public
		override
		nonReentrant()
	{
		require(_utilizedERC20.length == _utilizedERC20Amount.length, "_utilizedERC20.length != _utilizedERC20Amount.length");

		require(utilizedERC20AmountValid(_utilizedERC20Amount), "!utilizedERC20AmountValid(_utilizedERC20Amount)");

		require(yieldSyncV1AMPStrategyInteractor.eRC20DepositsOpen(), "!yieldSyncV1AMPStrategyInteractor.eRC20DepositsOpen()");

		yieldSyncV1AMPStrategyInteractor.eRC20Deposit(msg.sender, _utilizedERC20, _utilizedERC20Amount);

		uint256 utilizedERC20AmountETHValue;

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			utilizedERC20AmountETHValue += SafeMath.div(
				SafeMath.mul(
					_utilizedERC20Amount[i] * 10 ** (18 - ERC20(_utilizedERC20[i]).decimals()),
					yieldSyncV1AMPStrategyInteractor.eRC20ETHValue(_utilizedERC20[i])
				),
				1e18
			);
		}

		_mint(msg.sender, utilizedERC20AmountETHValue);
	}

	/// @inheritdoc IYieldSyncV1AMPStrategy
	function utilizedERC20Withdraw(uint256 _tokenAmount)
		public
		override
		nonReentrant()
	{
		require(balanceOf(msg.sender) >= _tokenAmount, "!_tokenAmount");

		require(
			yieldSyncV1AMPStrategyInteractor.eRC20WithdrawalsOpen(),
			"!yieldSyncV1AMPStrategyInteractor.eRC20WithdrawalsOpen()"
		);

		uint256[] memory uTAPB = utilizedERC20AmountPerBurn();

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			uTAPB[i] = SafeMath.div(uTAPB[i] * _tokenAmount, 1e18);
		}

		yieldSyncV1AMPStrategyInteractor.eRC20Withdraw(msg.sender, _utilizedERC20, uTAPB);

		_burn(msg.sender, _tokenAmount);
	}
}
