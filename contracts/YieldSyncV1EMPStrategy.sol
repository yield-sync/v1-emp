
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
	UtilizedERC20
} from "./interface/IYieldSyncV1EMPStrategy.sol";


contract YieldSyncV1EMPStrategy is
	ERC20,
	IYieldSyncV1EMPStrategy,
	ReentrancyGuard
{
	address public override manager;

	bool public override utilizedERC20DepositOpen;
	bool public override utilizedERC20WithdrawOpen;

	uint256 public constant override ONE_HUNDRED_PERCENT = 1e18;

	UtilizedERC20[] internal _utilizedERC20;

	IYieldSyncV1EMPRegistry public override immutable I_YIELD_SYNC_V1_EMP_REGISTRY;

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


	constructor (address _manager, address _yieldSyncV1EMPRegistry, string memory _name, string memory _symbol)
		ERC20(_name, _symbol)
	{
		utilizedERC20DepositOpen = false;
		utilizedERC20WithdrawOpen = false;

		manager = _manager;

		I_YIELD_SYNC_V1_EMP_REGISTRY = IYieldSyncV1EMPRegistry(_yieldSyncV1EMPRegistry);
	}


	modifier authEMP()
	{
		require(
			I_YIELD_SYNC_V1_EMP_REGISTRY.yieldSyncV1EMP_yieldSyncV1EMPId(msg.sender) > 0,
			"!(I_YIELD_SYNC_V1_EMP_REGISTRY.yieldSyncV1EMP_yieldSyncV1EMPId(msg.sender) > 0)"
		);

		_;
	}

	modifier authManager()
	{
		require(manager == msg.sender, "!(manager == msg.sender)");

		_;
	}

	modifier initialized()
	{
		require(
			address(iYieldSyncV1EMPETHValueFeed) != address(0),
			"!(address(iYieldSyncV1EMPETHValueFeed) != address(0))"
		);

		require(
			address(iYieldSyncV1EMPStrategyInteractor) != address(0),
			"!(address(iYieldSyncV1EMPStrategyInteractor) != address(0))"
		);

		_;
	}

	modifier utilizedERC20TransferClosed()
	{
		require(
			!utilizedERC20DepositOpen && !utilizedERC20WithdrawOpen,
			"!(utilizedERC20DepositOpen && !utilizedERC20WithdrawOpen)"
		);

		_;
	}


	/// @notice view


	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20()
		public
		view
		returns (UtilizedERC20[] memory utilizedERC20_)
	{
		utilizedERC20_ = _utilizedERC20;
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20AmountETHValue(uint256[] memory _utilizedERC20Amount)
		public
		view
		override
		returns (uint256 utilizedERC20AmountTotalETHValue_)
	{
		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			if (_utilizedERC20[i].deposit)
			{
				utilizedERC20AmountTotalETHValue_ += SafeMath.div(
					SafeMath.mul(
						SafeMath.mul(_utilizedERC20Amount[i], 10 ** (18 - ERC20(_utilizedERC20[i].eRC20).decimals())),
						iYieldSyncV1EMPETHValueFeed.utilizedERC20ETHValue(_utilizedERC20[i].eRC20)
					),
					1e18
				);
			}
		}
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
	function utilizedERC20Update(UtilizedERC20[] memory __utilizedERC20)
		public
		override
		authManager()
	{
		uint256 utilizedERC20AllocationTotal;

		for (uint256 i = 0; i < __utilizedERC20.length; i++)
		{
			if (__utilizedERC20[i].deposit)
			{
				utilizedERC20AllocationTotal += __utilizedERC20[i].allocation;
			}
		}

		require(utilizedERC20AllocationTotal == ONE_HUNDRED_PERCENT, "!(utilizedERC20AllocationTotal == ONE_HUNDRED_PERCENT)");

		delete _utilizedERC20;

		for (uint256 i = 0; i < __utilizedERC20.length; i++)
		{
			_utilizedERC20.push(__utilizedERC20[i]);
		}
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20Deposit(address _from, uint256[] memory _utilizedERC20Amount)
		public
		override
		authEMP()
		nonReentrant()
		initialized()
	{
		require(utilizedERC20DepositOpen, "!utilizedERC20DepositOpen");

		require(_utilizedERC20.length == _utilizedERC20Amount.length, "!(_utilizedERC20.length == _utilizedERC20Amount.length)");

		uint256 _utilizedERC20AmountETHValue = utilizedERC20AmountETHValue(_utilizedERC20Amount);

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			if (!_utilizedERC20[i].deposit)
			{
				require(_utilizedERC20Amount[i] == 0, "!(_utilizedERC20Amount[i] == 0)");
			}

			(bool computed, uint256 utilizedERC20AmountAllocationActual) = SafeMath.tryDiv(
				SafeMath.mul(
					SafeMath.div(
						SafeMath.mul(
							_utilizedERC20Amount[i],
							iYieldSyncV1EMPETHValueFeed.utilizedERC20ETHValue(_utilizedERC20[i].eRC20)
						),
						10 ** ERC20(_utilizedERC20[i].eRC20).decimals()
					),
					1e18
				),
				_utilizedERC20AmountETHValue
			);

			require(computed, "!computed");

			require(
				_utilizedERC20[i].allocation == utilizedERC20AmountAllocationActual,
				"!(_utilizedERC20[i].allocation == utilizedERC20AmountAllocationActual)"
			);
		}

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			iYieldSyncV1EMPStrategyInteractor.utilizedERC20Deposit(
				_from,
				_utilizedERC20[i].eRC20,
				_utilizedERC20Amount[i]
			);
		}

		_mint(_from, _utilizedERC20AmountETHValue);
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
	function utilizedERC20Withdraw(address _to, uint256 _ERC20Amount)
		public
		override
		authEMP()
		nonReentrant()
		initialized()
	{
		require(utilizedERC20WithdrawOpen, "!utilizedERC20WithdrawOpen");

		require(balanceOf(msg.sender) >= _ERC20Amount, "!(balanceOf(msg.sender) >= _ERC20Amount)");

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			if (_utilizedERC20[i].withdraw)
			{
				(bool computed, uint256 utilizedERC20AmountPerToken) = SafeMath.tryDiv(
					SafeMath.mul(iYieldSyncV1EMPStrategyInteractor.utilizedERC20TotalAmount(_utilizedERC20[i].eRC20), 1e18),
					totalSupply()
				);

				require(computed, "!computed");

				iYieldSyncV1EMPStrategyInteractor.utilizedERC20Withdraw(
					_to,
					_utilizedERC20[i].eRC20,
					SafeMath.div(SafeMath.mul(utilizedERC20AmountPerToken, _ERC20Amount), 1e18)
				);
			}
		}

		_burn(msg.sender, _ERC20Amount);
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
