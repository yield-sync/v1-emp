
// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import {
	Allocation,
	IERC20,
	IYieldSyncV1Strategy,
	IYieldSyncV1StrategyController
} from "./interface/IYieldSyncV1StrategyController.sol";


contract YieldSyncV1StrategyController is
	ERC20,
	IYieldSyncV1StrategyController,
	ReentrancyGuard
{
	address public immutable deployer;
	address[] public utilizedToken;

	mapping (address token => Allocation allocation) internal _token_allocation;

	IYieldSyncV1Strategy public yieldSyncV1Strategy;


	receive ()
		external
		payable
	{}


	fallback ()
		external
		payable
	{}


	constructor (address _deployer, string memory _name, string memory _symbol)
		ERC20(_name, _symbol)
	{
		deployer = _deployer;
	}


	/// @inheritdoc IYieldSyncV1StrategyController
	function token_allocation(address _token)
		external
		view
		override
		returns (Allocation memory)
	{
		return _token_allocation[_token];
	}


	/// @inheritdoc IYieldSyncV1StrategyController
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
			eTHValuePosition_ += uTAPT[i] * yieldSyncV1Strategy.utilizedTokenETHValue(utilizedToken[i]) * balanceOf(
				_target
			);
		}
	}

	/// @inheritdoc IYieldSyncV1StrategyController
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
			eTHValueUtilizedTokenAmount_ += yieldSyncV1Strategy.utilizedTokenETHValue(utilizedToken[i]) * _utilizedTokenAmount[i];
		}
	}

	/// @inheritdoc IYieldSyncV1StrategyController
	function utilizedTokenAmountPerToken()
		public
		view
		override
		returns (uint256[] memory utilizedTokenAmount_)
	{
		utilizedTokenAmount_ = yieldSyncV1Strategy.utilizedTokenTotalAmount(utilizedToken);

		require(utilizedToken.length == utilizedTokenAmount_.length , "utilizedToken.length != utilizedTokenAmount_.length");

		for (uint256 i = 0; i < utilizedToken.length; i++)
		{
			utilizedTokenAmount_[i] = utilizedTokenAmount_[i] / totalSupply();
		}
	}

	/// @inheritdoc IYieldSyncV1StrategyController
	function utilizedTokenAmountValid(uint256[] memory _utilizedTokenAmount)
		public
		view
		returns (bool utilizedTokenAmountValid_)
	{
		utilizedTokenAmountValid_ = true;

		uint256 _eTHValueUtilizedTokenAmount = eTHValueUtilizedTokenAmount(_utilizedTokenAmount);

		for (uint256 i = 0; i < utilizedToken.length; i++)
		{
			(bool amountPercentTargetComputed, uint256 amountRatioTarget) = SafeMath.tryDiv(
				_token_allocation[utilizedToken[i]].numerator,
				_token_allocation[utilizedToken[i]].denominator
			);

			require(amountPercentTargetComputed, "!amountPercentTargetComputed");

			(bool amountPercentActualComputed, uint256 amountRatioActual) = SafeMath.tryDiv(
				yieldSyncV1Strategy.utilizedTokenETHValue(utilizedToken[i]) * _utilizedTokenAmount[i],
				_eTHValueUtilizedTokenAmount
			);

			require(amountPercentActualComputed, "!amountPercentActualComputed");

			if (amountRatioTarget != amountRatioActual)
			{
				utilizedTokenAmountValid_ = false;

				break;
			}
		}
	}


	/// @inheritdoc IYieldSyncV1StrategyController
	function initializeStrategy(address _strategy, address[] memory _utilizedToken, Allocation[] memory _allocation)
		public
		override
	{
		require(msg.sender == deployer, "msg.sender != deployer");
		require(_strategy != address(0), "!_strategy");
		require(address(yieldSyncV1Strategy) == address(0), "address(yieldSyncV1Strategy) != address(0)");

		yieldSyncV1Strategy = IYieldSyncV1Strategy(_strategy);

		utilizedToken = _utilizedToken;

		uint256 totalAllocations = 0;

		for (uint256 i = 0; i < _allocation.length; i++)
		{
			(bool computedPercent, uint256 percent) = SafeMath.tryDiv(_allocation[i].numerator, _allocation[i].denominator);

			require(computedPercent, "!computedPercent");

			totalAllocations += percent;
		}

		require(totalAllocations == 100, "totalAllocations != 100");

		for (uint256 i = 0; i < _utilizedToken.length; i++)
		{
			_token_allocation[_utilizedToken[i]] = _allocation[i];
		}
	}

	/// @inheritdoc IYieldSyncV1StrategyController
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
			IERC20(utilizedToken[i]).approve(address(yieldSyncV1Strategy), _utilizedTokenAmount[i]);
		}

		yieldSyncV1Strategy.utilizedTokenDeposit(utilizedToken, _utilizedTokenAmount);

		_mint(msg.sender, eTHValuePosition(msg.sender) - valueBefore);
	}

	/// @inheritdoc IYieldSyncV1StrategyController
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

		yieldSyncV1Strategy.utilizedTokenWithdraw(msg.sender, utilizedToken, uTAPT);

		_burn(msg.sender, _tokenAmount);
	}
}
