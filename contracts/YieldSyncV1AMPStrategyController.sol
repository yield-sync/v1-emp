
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
	address[] public utilizedToken;
	uint256[] public utilizedTokenAllocation;

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
		uint256[] memory uTAPT = utilizedTokenAmountPerToken();

		require(uTAPT.length == utilizedToken.length, "uTAPT.length != utilizedToken.length");

		eTHValuePosition_ = 0;

		for (uint256 i = 0; i < utilizedToken.length; i++)
		{
			eTHValuePosition_ += uTAPT[i] * yieldSyncV1AMPStrategy.utilizedTokenETHValue(utilizedToken[i]) * balanceOf(_target);
		}
	}

	/// @inheritdoc IYieldSyncV1AMPStrategyController
	function eTHValueUtilizedTokenAmount(uint256[] memory _utilizedTokenAmount)
		public
		view
		override
		returns (uint256 eTHValueUtilizedTokenAmount_)
	{
		require(utilizedToken.length == _utilizedTokenAmount.length, "utilizedToken.length != _utilizedTokenAmount.length");

		eTHValueUtilizedTokenAmount_ = 0;

		for (uint256 i = 0; i < utilizedToken.length; i++)
		{
			eTHValueUtilizedTokenAmount_ += yieldSyncV1AMPStrategy.utilizedTokenETHValue(utilizedToken[i]) * _utilizedTokenAmount[i];
		}
	}

	/// @inheritdoc IYieldSyncV1AMPStrategyController
	function utilizedTokenAmountPerToken()
		public
		view
		override
		returns (uint256[] memory utilizedTokenAmount_)
	{
		utilizedTokenAmount_ = yieldSyncV1AMPStrategy.utilizedTokenTotalAmount(utilizedToken);

		require(utilizedToken.length == utilizedTokenAmount_.length , "utilizedToken.length != utilizedTokenAmount_.length");

		for (uint256 i = 0; i < utilizedToken.length; i++)
		{
			utilizedTokenAmount_[i] = utilizedTokenAmount_[i] / totalSupply();
		}
	}

	/// @inheritdoc IYieldSyncV1AMPStrategyController
	function utilizedTokenAllocationSet(uint256[] memory _utilizedTokenAllocation)
		public
	{
		require(msg.sender == manager, "msg.sender != manager");

		uint256 utilizedTokenAllocationTotal = 0;

		for (uint256 i = 0; i < _utilizedTokenAllocation.length; i++)
		{
			utilizedTokenAllocationTotal += _utilizedTokenAllocation[i];
		}

		require(utilizedTokenAllocationTotal == 100, "utilizedTokenAllocationTotal != 100");

		utilizedTokenAllocation = _utilizedTokenAllocation;
	}

	/// @inheritdoc IYieldSyncV1AMPStrategyController
	function utilizedTokenAmountValid(uint256[] memory _utilizedTokenAmount)
		public
		view
		returns (bool utilizedTokenAmountValid_)
	{
		utilizedTokenAmountValid_ = true;

		uint256 _eTHValueUtilizedTokenAmount = eTHValueUtilizedTokenAmount(_utilizedTokenAmount);

		for (uint256 i = 0; i < utilizedToken.length; i++)
		{
			(bool utilizedTokenAmountPercentComputed, uint256 amountRatioActual) = SafeMath.tryDiv(
				yieldSyncV1AMPStrategy.utilizedTokenETHValue(utilizedToken[i]) * _utilizedTokenAmount[i],
				_eTHValueUtilizedTokenAmount
			);

			require(utilizedTokenAmountPercentComputed, "!utilizedTokenAmountPercentComputed");

			if (utilizedTokenAllocation[i] != amountRatioActual)
			{
				utilizedTokenAmountValid_ = false;

				break;
			}
		}
	}


	/// @inheritdoc IYieldSyncV1AMPStrategyController
	function initializeStrategy(address _strategy, address[] memory _utilizedToken)
		public
		override
	{
		require(address(yieldSyncV1AMPStrategy) == address(0), "address(yieldSyncV1AMPStrategy) != address(0)");

		require(msg.sender == manager, "msg.sender != manager");

		require(_strategy != address(0), "_strategy == address(0)");

		yieldSyncV1AMPStrategy = IYieldSyncV1AMPStrategy(_strategy);

		utilizedToken = _utilizedToken;
	}

	/// @inheritdoc IYieldSyncV1AMPStrategyController
	function utilizedTokenDeposit(uint256[] memory _utilizedTokenAmount)
		public
		override
		nonReentrant()
	{
		require(_utilizedTokenAmount.length == utilizedToken.length, "_utilizedTokenAmount.length != utilizedToken.length");

		require(utilizedTokenAmountValid(_utilizedTokenAmount), "!utilizedTokenAmountValid(_utilizedTokenAmount)");

		uint256 valueBefore = eTHValuePosition(msg.sender);

		for (uint256 i = 0; i < utilizedToken.length; i++)
		{
			IERC20(utilizedToken[i]).approve(address(yieldSyncV1AMPStrategy), _utilizedTokenAmount[i]);
		}

		yieldSyncV1AMPStrategy.utilizedTokenDeposit(utilizedToken, _utilizedTokenAmount);

		_mint(msg.sender, eTHValuePosition(msg.sender) - valueBefore);
	}

	/// @inheritdoc IYieldSyncV1AMPStrategyController
	function utilizedTokenWithdraw(uint256 _tokenAmount)
		public
		override
		nonReentrant()
	{
		require(balanceOf(msg.sender) >= _tokenAmount, "!_tokenAmount");

		uint256[] memory uTAPT = utilizedTokenAmountPerToken();

		require(uTAPT.length == utilizedToken.length, "uTAPT.length != utilizedToken.length");

		for (uint256 i = 0; i < utilizedToken.length; i++)
		{
			uTAPT[i] += uTAPT[i] * _tokenAmount;
		}

		yieldSyncV1AMPStrategy.utilizedTokenWithdraw(msg.sender, utilizedToken, uTAPT);

		_burn(msg.sender, _tokenAmount);
	}
}
