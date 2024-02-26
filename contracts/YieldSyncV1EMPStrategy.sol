
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import {
	IYieldSyncV1EMPETHValueFeed,
	IYieldSyncV1EMPRegistry,
	IYieldSyncV1EMPStrategyInteractor,
	IYieldSyncV1EMPStrategy,
	Purpose
} from "./interface/IYieldSyncV1EMPStrategy.sol";


contract YieldSyncV1EMPStrategy is
	ERC20,
	IYieldSyncV1EMPStrategy,
	ReentrancyGuard
{
	address public override manager;

	address[] internal _utilizedERC20;

	bool public override utilizedERC20DepositOpen;
	bool public override utilizedERC20WithdrawOpen;

	uint256 constant public override ONE_HUNDRED_PERCENT = 1e18;

	mapping (address utilizedERC20 => Purpose purpose) internal _utilizedERC20_purpose;

	IYieldSyncV1EMPRegistry public override immutable iYieldSyncV1EMPRegistry;

	IYieldSyncV1EMPETHValueFeed public override iYieldSyncV1EMPETHValueFeed;
	IYieldSyncV1EMPStrategyInteractor public override iYieldSyncV1EMPStrategyInteractor;


	receive ()
		external
		payable
	{}


	fallback ()
		external
		payable
	{}


	constructor (
		address _iYieldSyncV1EMPRegistry,
		address _manager,
		string memory _name,
		string memory _symbol
	)
		ERC20(_name, _symbol)
	{
		utilizedERC20DepositOpen = false;
		utilizedERC20WithdrawOpen = false;

		manager = _manager;

		iYieldSyncV1EMPRegistry = IYieldSyncV1EMPRegistry(_iYieldSyncV1EMPRegistry);
	}

	modifier authManager()
	{
		require(manager == msg.sender, "manager != msg.sender");

		_;
	}

	modifier initialized()
	{
		require(
			address(iYieldSyncV1EMPETHValueFeed) != address(0),
			"address(iYieldSyncV1EMPETHValueFeed) == address(0)"
		);

		require(
			address(iYieldSyncV1EMPStrategyInteractor) != address(0),
			"address(iYieldSyncV1EMPStrategyInteractor) == address(0)"
		);

		_;
	}

	modifier utilizedERC20TransferClosed()
	{
		require(!utilizedERC20DepositOpen && !utilizedERC20WithdrawOpen, "utilizedERC20DepositOpen || utilizedERC20WithdrawOpen");

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
	function utilizedERC20_purpose(address __utilizedERC20)
		public
		view
		override
		returns (Purpose memory purpopse_)
	{
		return _utilizedERC20_purpose[__utilizedERC20];
	}


	/// @notice mutative


	/// @inheritdoc IYieldSyncV1EMPStrategy
	function iYieldSyncV1EMPETHValueFeedUpdate(address _iYieldSyncV1EMPETHValueFeed)
		public
		override
		authManager()
		utilizedERC20TransferClosed()
	{
		iYieldSyncV1EMPETHValueFeed = IYieldSyncV1EMPETHValueFeed(_iYieldSyncV1EMPETHValueFeed);
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function iYieldSyncV1EMPStrategyInteractorUpdate(address _iYieldSyncStrategyInteractor)
		public
		override
		authManager()
		utilizedERC20TransferClosed()
	{
		iYieldSyncV1EMPStrategyInteractor = IYieldSyncV1EMPStrategyInteractor(_iYieldSyncStrategyInteractor);
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function managerUpdate(address _manager)
		public
		override
		authManager()
	{
		manager = _manager;
	}

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
		initialized()
	{
		require(
			iYieldSyncV1EMPRegistry.yieldSyncV1EMP_yieldSyncV1EMPId(msg.sender) > 0,
			"iYieldSyncV1EMPRegistry.yieldSyncV1EMP_yieldSyncV1EMPId(msg.sender) == 0"
		);

		require(utilizedERC20DepositOpen, "!utilizedERC20DepositOpen");

		require(_utilizedERC20.length == _utilizedERC20Amount.length, "_utilizedERC20.length != _utilizedERC20Amount.length");

		bool utilizedERC20AmountValid = true;

		uint256 utilizedERC20AmountTotalETHValue;

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			if (_utilizedERC20_purpose[_utilizedERC20[i]].deposit)
			{
				utilizedERC20AmountTotalETHValue += SafeMath.div(
					SafeMath.mul(
						SafeMath.mul(_utilizedERC20Amount[i], 10 ** (18 - ERC20(_utilizedERC20[i]).decimals())),
						iYieldSyncV1EMPETHValueFeed.utilizedERC20ETHValue(_utilizedERC20[i])
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
							SafeMath.mul(_utilizedERC20Amount[i], iYieldSyncV1EMPETHValueFeed.utilizedERC20ETHValue(_utilizedERC20[i])),
							10 ** ERC20(_utilizedERC20[i]).decimals()
						),
						1e18
					),
					utilizedERC20AmountTotalETHValue
				);

				require(computed, "!computed");

				if (_utilizedERC20_purpose[_utilizedERC20[i]].allocation != amountAllocationActual)
				{
					utilizedERC20AmountValid = false;

					break;
				}
			}
			else
			{
				if (_utilizedERC20Amount[i] > 0)
				{
					utilizedERC20AmountValid = false;

					break;
				}
			}
		}

		require(utilizedERC20AmountValid, "!utilizedERC20AmountValid");

		iYieldSyncV1EMPStrategyInteractor.utilizedERC20Deposit(msg.sender, _utilizedERC20, _utilizedERC20Amount);

		_mint(msg.sender, utilizedERC20AmountTotalETHValue);
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20DepositOpenToggle()
		public
		override
		authManager()
		initialized()
	{
		utilizedERC20DepositOpen = !utilizedERC20DepositOpen;
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20Withdraw(uint256 _tokenAmount)
		public
		override
		nonReentrant()
		initialized()
	{
		require(utilizedERC20WithdrawOpen, "!utilizedERC20WithdrawOpen");

		require(balanceOf(msg.sender) >= _tokenAmount, "balanceOf(msg.sender) < _tokenAmount");

		uint256[] memory utilizedERC20AmountPerBurn = iYieldSyncV1EMPStrategyInteractor.utilizedERC20TotalAmount(_utilizedERC20);

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			if (_utilizedERC20_purpose[_utilizedERC20[i]].withdraw)
			{
				(, uint256 utilizedERC20Amount) = SafeMath.tryDiv(SafeMath.mul(utilizedERC20AmountPerBurn[i], 1e18), totalSupply());

				utilizedERC20AmountPerBurn[i] = utilizedERC20Amount;
			}
			else
			{
				utilizedERC20AmountPerBurn[i] = 0;
			}
		}

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			utilizedERC20AmountPerBurn[i] = SafeMath.div(utilizedERC20AmountPerBurn[i] * _tokenAmount, 1e18);
		}

		iYieldSyncV1EMPStrategyInteractor.utilizedERC20Withdraw(msg.sender, _utilizedERC20, utilizedERC20AmountPerBurn);

		_burn(msg.sender, _tokenAmount);
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20WithdrawOpenToggle()
		public
		override
		authManager()
		initialized()
	{
		utilizedERC20WithdrawOpen = !utilizedERC20WithdrawOpen;
	}
}
