
// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import {
	IERC20,
	IYieldSyncV1AMPStrategy,
	IYieldSyncV1AMPStrategyController
} from "./interface/IYieldSyncV1AMPStrategyController.sol";


contract YieldSyncV1AMPStrategyController is
	ERC20,
	IYieldSyncV1AMPStrategyController,
	ReentrancyGuard
{
	address public immutable manager;
	address[] public utilizedERC20;
	uint256[] public utilizedERC20Allocation;

	IYieldSyncV1AMPStrategy public yieldSyncV1AMPStrategy;


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


	/// @inheritdoc IYieldSyncV1AMPStrategyController
	function eTHValuePosition(address _target)
		public
		view
		override
		returns (uint256 eTHValuePosition_)
	{
		uint256[] memory uTAPB = utilizedERC20AmountPerBurn();

		eTHValuePosition_ = 0;

		for (uint256 i = 0; i < utilizedERC20.length; i++)
		{
			eTHValuePosition_ += uTAPB[i] * yieldSyncV1AMPStrategy.eRC20ETHValue(utilizedERC20[i]) * balanceOf(_target);
		}
	}

	/// @inheritdoc IYieldSyncV1AMPStrategyController
	function eTHValueUtilizedERC20Amount(uint256[] memory _utilizedERC20Amount)
		public
		view
		override
		returns (uint256 eTHValueUtilizedERC20Amount_)
	{
		require(utilizedERC20.length == _utilizedERC20Amount.length, "utilizedERC20.length != _utilizedERC20Amount.length");

		eTHValueUtilizedERC20Amount_ = 0;

		for (uint256 i = 0; i < utilizedERC20.length; i++)
		{
			eTHValueUtilizedERC20Amount_ += yieldSyncV1AMPStrategy.eRC20ETHValue(utilizedERC20[i]) * _utilizedERC20Amount[i];
		}
	}

	/// @inheritdoc IYieldSyncV1AMPStrategyController
	function utilizedERC20AmountPerBurn()
		public
		view
		override
		returns (uint256[] memory utilizedERC20Amount_)
	{
		utilizedERC20Amount_ = yieldSyncV1AMPStrategy.eRC20TotalAmount(utilizedERC20);

		require(utilizedERC20.length == utilizedERC20Amount_.length , "utilizedERC20.length != utilizedERC20Amount_.length");

		for (uint256 i = 0; i < utilizedERC20.length; i++)
		{
			utilizedERC20Amount_[i] = utilizedERC20Amount_[i] / totalSupply();
		}
	}

	/// @inheritdoc IYieldSyncV1AMPStrategyController
	function utilizedERC20AllocationSet(uint256[] memory _utilizedERC20Allocation)
		public
	{
		require(msg.sender == manager, "msg.sender != manager");

		uint256 utilizedERC20AllocationTotal = 0;

		for (uint256 i = 0; i < _utilizedERC20Allocation.length; i++)
		{
			utilizedERC20AllocationTotal += _utilizedERC20Allocation[i];
		}

		require(utilizedERC20AllocationTotal == 100, "utilizedERC20AllocationTotal != 100");

		utilizedERC20Allocation = _utilizedERC20Allocation;
	}

	/// @inheritdoc IYieldSyncV1AMPStrategyController
	function utilizedERC20AmountValid(uint256[] memory _utilizedERC20Amount)
		public
		view
		returns (bool utilizedERC20AmountValid_)
	{
		utilizedERC20AmountValid_ = true;

		uint256 _eTHValueUtilizedERC20Amount = eTHValueUtilizedERC20Amount(_utilizedERC20Amount);

		for (uint256 i = 0; i < utilizedERC20.length; i++)
		{
			(bool utilizedERC20AmountPercentComputed, uint256 amountRatioActual) = SafeMath.tryDiv(
				_utilizedERC20Amount[i] * yieldSyncV1AMPStrategy.eRC20ETHValue(utilizedERC20[i]),
				_eTHValueUtilizedERC20Amount
			);

			require(utilizedERC20AmountPercentComputed, "!utilizedERC20AmountPercentComputed");

			if (utilizedERC20Allocation[i] != amountRatioActual)
			{
				utilizedERC20AmountValid_ = false;

				break;
			}
		}
	}


	/// @inheritdoc IYieldSyncV1AMPStrategyController
	function initializeStrategy(address _strategy, address[] memory _utilizedERC20)
		public
		override
	{
		require(address(yieldSyncV1AMPStrategy) == address(0), "address(yieldSyncV1AMPStrategy) != address(0)");

		require(msg.sender == manager, "msg.sender != manager");

		require(_strategy != address(0), "_strategy == address(0)");

		yieldSyncV1AMPStrategy = IYieldSyncV1AMPStrategy(_strategy);

		utilizedERC20 = _utilizedERC20;
	}

	/// @inheritdoc IYieldSyncV1AMPStrategyController
	function utilizedERC20Deposit(uint256[] memory _utilizedERC20Amount)
		public
		override
		nonReentrant()
	{
		require(_utilizedERC20Amount.length == utilizedERC20.length, "_utilizedERC20Amount.length != utilizedERC20.length");

		require(utilizedERC20AmountValid(_utilizedERC20Amount), "!utilizedERC20AmountValid(_utilizedERC20Amount)");

		uint256 valueBefore = eTHValuePosition(msg.sender);

		for (uint256 i = 0; i < utilizedERC20.length; i++)
		{
			IERC20(utilizedERC20[i]).approve(address(yieldSyncV1AMPStrategy), _utilizedERC20Amount[i]);
		}

		yieldSyncV1AMPStrategy.eRC20Deposit(utilizedERC20, _utilizedERC20Amount);

		_mint(msg.sender, eTHValuePosition(msg.sender) - valueBefore);
	}

	/// @inheritdoc IYieldSyncV1AMPStrategyController
	function utilizedERC20Withdraw(uint256 _tokenAmount)
		public
		override
		nonReentrant()
	{
		require(balanceOf(msg.sender) >= _tokenAmount, "!_tokenAmount");

		uint256[] memory uTAPB = utilizedERC20AmountPerBurn();

		require(uTAPB.length == utilizedERC20.length, "uTAPB.length != utilizedERC20.length");

		for (uint256 i = 0; i < utilizedERC20.length; i++)
		{
			uTAPB[i] += uTAPB[i] * _tokenAmount;
		}

		yieldSyncV1AMPStrategy.eRC20Withdraw(msg.sender, utilizedERC20, uTAPB);

		_burn(msg.sender, _tokenAmount);
	}
}
