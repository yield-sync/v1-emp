
// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


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
	address public immutable override Manager;
	address public immutable override YieldSyncV1EMPDeployer;

	address[] internal _utilizedERC20;

	bool public override utilizedERC20DepositOpen;
	bool public override utilizedERC20WithdrawOpen;

	uint256 constant public override ONE_HUNDRED_PERCENT = 1e18;

	mapping (address utilizedERC20 => Purpose purpose) internal _utilizedERC20_purpose;

	IYieldSyncV1EMPETHValueFeed public override iYieldSyncV1EMPETHValueFeed;
	IYieldSyncV1EMPRegistry public override iYieldSyncV1EMPRegistry;
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
		address _YieldSyncV1EMPDeployer,
		address _iYieldSyncV1EMPRegistry,
		address _Manager,
		string memory _name,
		string memory _symbol
	)
		ERC20(_name, _symbol)
	{
		utilizedERC20DepositOpen = false;
		utilizedERC20WithdrawOpen = false;

		YieldSyncV1EMPDeployer = _YieldSyncV1EMPDeployer;
		Manager = _Manager;

		iYieldSyncV1EMPRegistry = IYieldSyncV1EMPRegistry(_iYieldSyncV1EMPRegistry);
	}

	modifier authManager()
	{
		require(Manager == msg.sender, "Manager != msg.sender");

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
		return iYieldSyncV1EMPETHValueFeed.utilizedERC20ETHValue(__utilizedERC20);
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
		initialized()
		returns (uint256[] memory utilizedERC20Amount_)
	{
		utilizedERC20Amount_ = iYieldSyncV1EMPStrategyInteractor.utilizedERC20TotalAmount(_utilizedERC20);

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
		initialized()
	{
		require(
			iYieldSyncV1EMPRegistry.yieldSynV1EMPDeployer_yieldSyncV1EMP_registered(YieldSyncV1EMPDeployer, msg.sender),
			"!iYieldSyncV1EMPRegistry.yieldSynV1EMPDeployer_yieldSyncV1EMP_registered(YieldSyncV1EMPDeployer, msg.sender)"
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

		uint256[] memory uTAPB = utilizedERC20AmountPerBurn();

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			uTAPB[i] = SafeMath.div(uTAPB[i] * _tokenAmount, 1e18);
		}

		iYieldSyncV1EMPStrategyInteractor.utilizedERC20Withdraw(msg.sender, _utilizedERC20, uTAPB);

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

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function iYieldSyncV1EMPETHValueFeedUpdate(address _iYieldSyncV1EMPETHValueFeed)
		public
		override
		authManager()
	{
		iYieldSyncV1EMPETHValueFeed = IYieldSyncV1EMPETHValueFeed(_iYieldSyncV1EMPETHValueFeed);
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function iYieldSyncV1EMPStrategyInteractorUpdate(address _YSSInteractor)
		public
		override
		authManager()
	{
		iYieldSyncV1EMPStrategyInteractor = IYieldSyncV1EMPStrategyInteractor(_YSSInteractor);
	}
}
