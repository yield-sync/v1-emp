
// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import {
	IYieldSyncV1EMPETHValueFeed,
	IYieldSyncV1EMPStrategyInteractor,
	IYieldSyncV1EMPStrategy,
	Purpose
} from "./interface/IYieldSyncV1EMPStrategy.sol";


contract YieldSyncV1EMPStrategy is
	ERC20,
	IYieldSyncV1EMPStrategy,
	ReentrancyGuard
{
	address public immutable manager;

	address[] internal _utilizedERC20;

	bool public override utilizedERC20DepositOpen;
	bool public override utilizedERC20WithdrawOpen;

	uint256 constant public override ONE_HUNDRED_PERCENT = 1e18;

	mapping (address utilizedERC20 => Purpose purpose) internal _utilizedERC20_purpose;

	IYieldSyncV1EMPETHValueFeed public override yieldSyncV1EMPETHValueFeed;
	IYieldSyncV1EMPStrategyInteractor public override yieldSyncV1EMPStrategyInteractor;


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
		utilizedERC20DepositOpen = false;
		utilizedERC20WithdrawOpen = false;

		manager = _manager;
	}


	modifier authManager()
	{
		require(manager == msg.sender, "manager != msg.sender");

		_;
	}

	modifier operational()
	{
		require(
			address(yieldSyncV1EMPETHValueFeed) != address(0),
			"address(yieldSyncV1EMPETHValueFeed) == address(0)"
		);

		require(
			address(yieldSyncV1EMPStrategyInteractor) != address(0),
			"address(yieldSyncV1EMPStrategyInteractor) == address(0)"
		);

		_;
	}


	//// @notice view


	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20()
		public
		view
		override
		returns (address[] memory)
	{
		return _utilizedERC20;
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20ETHValue(address __utilizedERC20)
		public
		view
		override
		returns (uint256 utilizedERC20ETHValue_)
	{
		return yieldSyncV1EMPETHValueFeed.utilizedERC20ETHValue(__utilizedERC20);
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20_purpose(address __utilizedERC20)
		public
		view
		override
		returns (Purpose memory purpopse_)
	{
		return _utilizedERC20_purpose[__utilizedERC20];
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function balanceOfETHValue(address _target)
		public
		view
		override
		returns (uint256 balanceOfETHValue_)
	{
		uint256[] memory uTAPB = utilizedERC20AmountPerBurn();

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			balanceOfETHValue_ += SafeMath.mul(
				uTAPB[i],
				SafeMath.mul(balanceOf(_target), utilizedERC20ETHValue(_utilizedERC20[i]))
			);
		}
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20AmountPerBurn()
		public
		view
		override
		operational()
		returns (uint256[] memory utilizedERC20Amount_)
	{
		utilizedERC20Amount_ = yieldSyncV1EMPStrategyInteractor.utilizedERC20TotalAmount(_utilizedERC20);

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			if (_utilizedERC20_purpose[_utilizedERC20[i]].withdraw)
			{
				(, uint256 utilizedERC20Amount) = SafeMath.tryDiv(SafeMath.mul(utilizedERC20Amount_[i], 1e18), totalSupply());

				utilizedERC20Amount_[i] = utilizedERC20Amount;
			}
			else
			{
				utilizedERC20Amount_[i] = 0;
			}
		}
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20AmountValid(uint256[] memory _utilizedERC20Amount)
		public
		view
		operational()
		returns (bool utilizedERC20AmountValid_)
	{
		require(_utilizedERC20.length == _utilizedERC20Amount.length, "_utilizedERC20.length != _utilizedERC20Amount.length");

		utilizedERC20AmountValid_ = true;

		uint256 utilizedERC20AmountTotalETHValue;

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			if (_utilizedERC20_purpose[_utilizedERC20[i]].deposit)
			{
				utilizedERC20AmountTotalETHValue += SafeMath.div(
					SafeMath.mul(
						SafeMath.mul(_utilizedERC20Amount[i], 10 ** (18 - ERC20(_utilizedERC20[i]).decimals())),
						utilizedERC20ETHValue(_utilizedERC20[i])
					),
					1e18
				);
			}
		}

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			if (_utilizedERC20_purpose[_utilizedERC20[i]].deposit)
			{
				(bool computed, uint256 amountAllocationActual) = SafeMath.tryDiv(
					SafeMath.mul(
						SafeMath.div(
							SafeMath.mul(_utilizedERC20Amount[i], utilizedERC20ETHValue(_utilizedERC20[i])),
							10 ** ERC20(_utilizedERC20[i]).decimals()
						),
						1e18
					),
					utilizedERC20AmountTotalETHValue
				);

				require(computed, "!computed");

				if (_utilizedERC20_purpose[_utilizedERC20[i]].allocation != amountAllocationActual)
				{
					utilizedERC20AmountValid_ = false;

					break;
				}
			}
			else
			{
				if (_utilizedERC20Amount[i] > 0)
				{
					utilizedERC20AmountValid_ = false;

					break;
				}
			}
		}
	}


	/// @notice mutative


	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20AndPurposeUpdate(address[] memory __utilizedERC20, Purpose[] memory _purpose)
		public
		override
		authManager()
	{
		require(__utilizedERC20.length == _purpose.length, "__utilizedERC20.length != _purpose.length");

		_utilizedERC20 = __utilizedERC20;

		uint256 _utilizedERC20AllocationTotal;

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			_utilizedERC20_purpose[_utilizedERC20[i]] = _purpose[i];

			if (_utilizedERC20_purpose[_utilizedERC20[i]].deposit)
			{
				_utilizedERC20AllocationTotal += _utilizedERC20_purpose[_utilizedERC20[i]].allocation;
			}
		}

		require(_utilizedERC20AllocationTotal == ONE_HUNDRED_PERCENT, "_utilizedERC20AllocationTotal != ONE_HUNDRED_PERCENT");

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			_utilizedERC20_purpose[_utilizedERC20[i]] = _purpose[i];
		}
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20Deposit(uint256[] memory _utilizedERC20Amount)
		public
		override
		nonReentrant()
		operational()
	{
		require(utilizedERC20DepositOpen, "!utilizedERC20DepositOpen");

		require(utilizedERC20AmountValid(_utilizedERC20Amount), "!utilizedERC20AmountValid(_utilizedERC20Amount)");

		yieldSyncV1EMPStrategyInteractor.utilizedERC20Deposit(msg.sender, _utilizedERC20, _utilizedERC20Amount);

		uint256 utilizedERC20AmountTotalETHValue;

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			if (_utilizedERC20_purpose[_utilizedERC20[i]].deposit)
			{
				utilizedERC20AmountTotalETHValue += SafeMath.div(
					SafeMath.mul(
						_utilizedERC20Amount[i] * 10 ** (18 - ERC20(_utilizedERC20[i]).decimals()),
						utilizedERC20ETHValue(_utilizedERC20[i])
					),
					1e18
				);
			}
		}

		_mint(msg.sender, utilizedERC20AmountTotalETHValue);
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20DepositOpenToggle()
		public
		override
		authManager()
		operational()
	{
		utilizedERC20DepositOpen = !utilizedERC20DepositOpen;
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20Withdraw(uint256 _tokenAmount)
		public
		override
		nonReentrant()
		operational()
	{
		require(utilizedERC20WithdrawOpen, "!utilizedERC20WithdrawOpen");

		require(balanceOf(msg.sender) >= _tokenAmount, "!_tokenAmount");

		uint256[] memory uTAPB = utilizedERC20AmountPerBurn();

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			uTAPB[i] = SafeMath.div(uTAPB[i] * _tokenAmount, 1e18);
		}

		yieldSyncV1EMPStrategyInteractor.utilizedERC20Withdraw(msg.sender, _utilizedERC20, uTAPB);

		_burn(msg.sender, _tokenAmount);
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20WithdrawOpenToggle()
		public
		override
		authManager()
		operational()
	{
		utilizedERC20WithdrawOpen = !utilizedERC20WithdrawOpen;
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function yieldSyncV1EMPETHValueFeedUpdate(address _yieldSyncV1EMPETHValueFeed)
		public
		override
		authManager()
	{
		yieldSyncV1EMPETHValueFeed = IYieldSyncV1EMPETHValueFeed(_yieldSyncV1EMPETHValueFeed);
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function yieldSyncV1EMPStrategyInteractorUpdate(address _yieldSyncV1EMPStrategyInteractor)
		public
		override
		authManager()
	{
		yieldSyncV1EMPStrategyInteractor = IYieldSyncV1EMPStrategyInteractor(_yieldSyncV1EMPStrategyInteractor);
	}
}
