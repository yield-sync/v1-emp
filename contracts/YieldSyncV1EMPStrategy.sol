
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import { IYieldSyncV1EMPETHValueFeed } from "./interface/IYieldSyncV1EMPETHValueFeed.sol";
import {
	IYieldSyncV1EMPRegistry,
	IYieldSyncV1EMPStrategy,
	IYieldSyncV1EMPStrategyInteractor,
	IYieldSyncV1EMPStrategyUtility,
	UtilizationERC20
} from "./interface/IYieldSyncV1EMPStrategy.sol";


contract YieldSyncV1EMPStrategy is
	ReentrancyGuard,
	ERC20,
	IYieldSyncV1EMPStrategy
{
	using SafeMath for uint256;


	address public override manager;

	address[] internal _utilizedERC20;

	bool public override utilizedERC20DepositOpen;
	bool public override utilizedERC20WithdrawOpen;

	uint256 public constant override ONE_HUNDRED_PERCENT = 1e18;
	uint256 public override utilizedERC20UpdateTracker;

	IYieldSyncV1EMPRegistry public override immutable I_YIELD_SYNC_V1_EMP_REGISTRY;
	IYieldSyncV1EMPStrategyUtility public override immutable I_YIELD_SYNC_V1_EMP_STRATEGY_UTILITY;

	IYieldSyncV1EMPStrategyInteractor public override iYieldSyncV1EMPStrategyInteractor;

	mapping (address utilizedERC20 => UtilizationERC20 utilizationERC20) internal _utilizedERC20_utilizationERC20;


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

		utilizedERC20UpdateTracker = 0;

		I_YIELD_SYNC_V1_EMP_REGISTRY = IYieldSyncV1EMPRegistry(_yieldSyncV1EMPRegistry);
		I_YIELD_SYNC_V1_EMP_STRATEGY_UTILITY = IYieldSyncV1EMPStrategyUtility(
			I_YIELD_SYNC_V1_EMP_REGISTRY.yieldSyncV1EMPStrategyUtility()
		);
	}


	modifier authEMP()
	{
		require(I_YIELD_SYNC_V1_EMP_REGISTRY.yieldSyncV1EMP_yieldSyncV1EMPId(msg.sender) > 0, "!authorized");

		_;
	}

	modifier authManager()
	{
		require(manager == msg.sender, "!authorized");

		_;
	}

	modifier initialized()
	{
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
			"!(!utilizedERC20DepositOpen && !utilizedERC20WithdrawOpen)"
		);

		_;
	}


	/// @notice view


	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20()
		public
		view
		override
		returns (address[] memory utilizedERC20_)
	{
		return _utilizedERC20;
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20_utilizationERC20(address __utilizedERC20)
		public
		view
		override
		returns (UtilizationERC20 memory)
	{
		return _utilizedERC20_utilizationERC20[__utilizedERC20];
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20AmountETHValue(uint256[] memory _utilizedERC20Amount)
		public
		view
		override
		returns (uint256 utilizedERC20AmountETHValueTotal_, uint256[] memory utilizedERC20AmountETHValue_)
	{
		utilizedERC20AmountETHValue_ = new uint256[](_utilizedERC20Amount.length);

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			if (_utilizedERC20_utilizationERC20[_utilizedERC20[i]].deposit)
			{
				uint256 ethValue = _utilizedERC20Amount[i].mul(
					IYieldSyncV1EMPETHValueFeed(
						I_YIELD_SYNC_V1_EMP_REGISTRY.eRC20_yieldSyncV1EMPERC20ETHValueFeed(_utilizedERC20[i])
					).utilizedERC20ETHValue()
				).div(
					1e18
				);

				utilizedERC20AmountETHValueTotal_ += ethValue;

				utilizedERC20AmountETHValue_[i] = ethValue;
			}
		}
	}


	/// @notice mutative


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
	function utilizedERC20Update(address[] memory __utilizedERC20, UtilizationERC20[] memory _utilizationERC20)
		public
		override
		authManager()
		utilizedERC20TransferClosed()
	{
		require(__utilizedERC20.length == _utilizationERC20.length, "!(__utilizedERC20.length == _utilizationERC20.length)");

		require(
			!I_YIELD_SYNC_V1_EMP_STRATEGY_UTILITY.containsDuplicates(__utilizedERC20),
			"I_YIELD_SYNC_V1_EMP_STRATEGY_UTILITY.containsDuplicates(__utilizedERC20)"
		);

		uint256 utilizedERC20AllocationTotal;

		for (uint256 i = 0; i < __utilizedERC20.length; i++)
		{
			require(
				I_YIELD_SYNC_V1_EMP_REGISTRY.eRC20_yieldSyncV1EMPERC20ETHValueFeed(__utilizedERC20[i]) != address(0),
				"!(I_YIELD_SYNC_V1_EMP_REGISTRY.eRC20_yieldSyncV1EMPERC20ETHValueFeed(__utilizedERC20[i]) != address(0))"
			);

			if (_utilizationERC20[i].deposit)
			{
				utilizedERC20AllocationTotal += _utilizationERC20[i].allocation;
			}
		}

		require(utilizedERC20AllocationTotal == ONE_HUNDRED_PERCENT, "!(utilizedERC20AllocationTotal == ONE_HUNDRED_PERCENT)");

		delete _utilizedERC20;

		_utilizedERC20 = __utilizedERC20;

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			_utilizedERC20_utilizationERC20[_utilizedERC20[i]] = _utilizationERC20[i];
		}

		_utilizedERC20 = I_YIELD_SYNC_V1_EMP_STRATEGY_UTILITY.sort(_utilizedERC20);

		utilizedERC20UpdateTracker++;
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

		(
			uint256 utilizedERC20AmountETHValueTotal_,
			uint256[] memory utilizedERC20AmountETHValue_
		) = utilizedERC20AmountETHValue(_utilizedERC20Amount);

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			if (!_utilizedERC20_utilizationERC20[_utilizedERC20[i]].deposit)
			{
				require(_utilizedERC20Amount[i] == 0, "!(_utilizedERC20Amount[i] == 0)");
			}

			uint256 utilizedERC20AmountAllocationActual = utilizedERC20AmountETHValue_[i].mul(1e18).div(
				utilizedERC20AmountETHValueTotal_,
				"!computed"
			);

			require(
				_utilizedERC20_utilizationERC20[_utilizedERC20[i]].allocation == utilizedERC20AmountAllocationActual,
				"!(_utilizedERC20_utilizationERC20[_utilizedERC20[i]].allocation == utilizedERC20AmountAllocationActual)"
			);
		}

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			iYieldSyncV1EMPStrategyInteractor.utilizedERC20Deposit(
				_from,
				_utilizedERC20[i],
				_utilizedERC20Amount[i]
			);
		}

		_mint(msg.sender, utilizedERC20AmountETHValueTotal_);
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
	function utilizedERC20Withdraw(uint256 _eRC20Amount)
		public
		override
		authEMP()
		nonReentrant()
		initialized()
	{
		require(utilizedERC20WithdrawOpen, "!utilizedERC20WithdrawOpen");

		require(balanceOf(msg.sender) >= _eRC20Amount, "!(balanceOf(msg.sender) >= _eRC20Amount)");

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			if (_utilizedERC20_utilizationERC20[_utilizedERC20[i]].withdraw)
			{
				uint256 utilizedERC20AmountPerToken = SafeMath.div(
					SafeMath.mul(iYieldSyncV1EMPStrategyInteractor.utilizedERC20TotalAmount(_utilizedERC20[i]), 1e18),
					totalSupply(),
					"!computed"
				);

				iYieldSyncV1EMPStrategyInteractor.utilizedERC20Withdraw(
					msg.sender,
					_utilizedERC20[i],
					SafeMath.div(SafeMath.mul(utilizedERC20AmountPerToken, _eRC20Amount), 1e18)
				);
			}
		}

		_burn(msg.sender, _eRC20Amount);
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
