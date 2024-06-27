// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import { IYieldSyncV1EMPArrayUtility } from "./interface/IYieldSyncV1EMPArrayUtility.sol";
import { IYieldSyncV1EMP } from "./interface/IYieldSyncV1EMP.sol";
import { IYieldSyncV1EMPETHValueFeed } from "./interface/IYieldSyncV1EMPETHValueFeed.sol";
import { IYieldSyncV1EMPRegistry } from "./interface/IYieldSyncV1EMPRegistry.sol";
import { IYieldSyncV1EMPStrategy } from "./interface/IYieldSyncV1EMPStrategy.sol";
import { IYieldSyncV1EMPUtility, UtilizationERC20 } from "./interface/IYieldSyncV1EMPUtility.sol";


contract YieldSyncV1EMPUtility is
	IYieldSyncV1EMPUtility
{
	using SafeMath for uint256;

	uint256 public constant ONE_HUNDRED_PERCENT = 1e18;

	IYieldSyncV1EMPArrayUtility public immutable I_YIELD_SYNC_V1_EMP_ARRAY_UTILITY;
	IYieldSyncV1EMPRegistry public immutable I_YIELD_SYNC_V1_EMP_REGISTRY;

	mapping(
		address yieldSyncV1EMP => mapping (address yieldSyncV1EMPStrategy => uint256 utilizedERC20UpdateTracker)
	) public yieldSyncV1EMP_yieldSyncV1EMPStrategy_utilizedERC20UpdateTracker;


	receive ()
		external
		payable
	{}


	fallback ()
		external
		payable
	{}


	constructor (address _yieldSyncV1EMPRegistry)
	{
		I_YIELD_SYNC_V1_EMP_REGISTRY = IYieldSyncV1EMPRegistry(_yieldSyncV1EMPRegistry);
		I_YIELD_SYNC_V1_EMP_ARRAY_UTILITY = IYieldSyncV1EMPArrayUtility(
			I_YIELD_SYNC_V1_EMP_REGISTRY.yieldSyncV1EMPArrayUtility()
		);
	}


	modifier authEMP()
	{
		require(I_YIELD_SYNC_V1_EMP_REGISTRY.yieldSyncV1EMP_yieldSyncV1EMPId(msg.sender) > 0, "!authorized");

		_;
	}


	/// @inheritdoc IYieldSyncV1EMPUtility
	function utilizedERC20Generator()
		public
		override
		authEMP()
		returns (bool updatedNeeded_, address[] memory utilizedERC20_, UtilizationERC20[] memory utilizationERC20_)
	{
		updatedNeeded_ = false;

		uint256 utilizedERC20MaxLength = 0;

		address[] memory utilizedYieldSyncV1EMPStrategy = IYieldSyncV1EMP(msg.sender).utilizedYieldSyncV1EMPStrategy();

		for (uint256 i = 0; i < utilizedYieldSyncV1EMPStrategy.length; i++)
		{
			uint256 utilizedERC20UpdateTracker = IYieldSyncV1EMPStrategy(
				utilizedYieldSyncV1EMPStrategy[i]
			).utilizedERC20UpdateTracker();

			if (
				yieldSyncV1EMP_yieldSyncV1EMPStrategy_utilizedERC20UpdateTracker[msg.sender][
					utilizedYieldSyncV1EMPStrategy[i]
				] != utilizedERC20UpdateTracker
			)
			{
				updatedNeeded_ = true;

				yieldSyncV1EMP_yieldSyncV1EMPStrategy_utilizedERC20UpdateTracker[msg.sender][
					utilizedYieldSyncV1EMPStrategy[i]
				] = utilizedERC20UpdateTracker;
			}

			utilizedERC20MaxLength += IYieldSyncV1EMPStrategy(utilizedYieldSyncV1EMPStrategy[i]).utilizedERC20().length;
		}

		if (!updatedNeeded_)
		{
			return (updatedNeeded_, utilizedERC20_, utilizationERC20_);
		}

		utilizedERC20_ = new address[](utilizedERC20MaxLength);

		uint256 utilizedERC20I = 0;

		for (uint256 i = 0; i < utilizedYieldSyncV1EMPStrategy.length; i++)
		{
			address[] memory strategyUtilizedERC20 = IYieldSyncV1EMPStrategy(utilizedYieldSyncV1EMPStrategy[i]).utilizedERC20();

			for (uint256 ii = 0; ii < strategyUtilizedERC20.length; ii++)
			{
				utilizedERC20_[utilizedERC20I++] = strategyUtilizedERC20[ii];
			}
		}

		utilizedERC20_ = I_YIELD_SYNC_V1_EMP_ARRAY_UTILITY.removeDuplicates(utilizedERC20_);
		utilizedERC20_ = I_YIELD_SYNC_V1_EMP_ARRAY_UTILITY.sort(utilizedERC20_);

		utilizationERC20_ = new UtilizationERC20[](utilizedERC20_.length);

		uint256 utilizedERC20AllocationTotal;

		// For each strategy..
		for (uint256 i = 0; i < utilizedYieldSyncV1EMPStrategy.length; i++)
		{
			IYieldSyncV1EMPStrategy iYieldSyncV1EMPStrategy = IYieldSyncV1EMPStrategy(utilizedYieldSyncV1EMPStrategy[i]);

			// For each utilized erc20 for stategy..
			for (uint256 ii = 0; ii < utilizedERC20_.length; ii++)
			{
				// Get the utilization
				UtilizationERC20 memory utilizationERC20 = iYieldSyncV1EMPStrategy.utilizedERC20_utilizationERC20(utilizedERC20_[ii]);

				// If for depositing..
				if (utilizationERC20.deposit)
				{
					utilizationERC20_[ii].deposit = true;

					uint256 utilizationERC20Allocation = utilizationERC20.allocation.mul(
						IYieldSyncV1EMP(msg.sender).utilizedYieldSyncV1EMPStrategy_allocation(utilizedYieldSyncV1EMPStrategy[i])
					).div(
						1e18
					);

					utilizationERC20_[ii].allocation += utilizationERC20Allocation;

					utilizedERC20AllocationTotal += utilizationERC20Allocation;
				}

				if (utilizationERC20.withdraw)
				{
					utilizationERC20_[ii].withdraw = true;
				}
			}
		}

		// Check that the total alocation is 100%
		require(utilizedERC20AllocationTotal == ONE_HUNDRED_PERCENT, "!(utilizedERC20AllocationTotal == ONE_HUNDRED_PERCENT)");
	}

	/// @inheritdoc IYieldSyncV1EMPUtility
	function utilizedERC20AmountValid(uint256[] memory _utilizedERC20Amount)
		public
		view
		override
		authEMP()
		returns (bool valid_, uint256 utilizedERC20AmountTotalETHValue_)
	{
		address[] memory utilizedERC20 = IYieldSyncV1EMP(msg.sender).utilizedERC20();

		require(_utilizedERC20Amount.length == utilizedERC20.length, "!(_utilizedERC20Amount.length == utilizedERC20.length)");

		valid_ = true;

		utilizedERC20AmountTotalETHValue_ = 0;

		uint256[] memory eRC20AmountETHValue = new uint256[](utilizedERC20.length);

		for (uint256 i = 0; i < utilizedERC20.length; i++)
		{
			uint256 utilizedERC20AmountETHValue = _utilizedERC20Amount[i].mul(
				IYieldSyncV1EMPETHValueFeed(
					I_YIELD_SYNC_V1_EMP_REGISTRY.eRC20_yieldSyncV1EMPERC20ETHValueFeed(utilizedERC20[i])
				).utilizedERC20ETHValue()
			).div(
				1e18
			);

			eRC20AmountETHValue[i] = utilizedERC20AmountETHValue;

			utilizedERC20AmountTotalETHValue_ += utilizedERC20AmountETHValue;
		}

		for (uint256 i = 0; i < utilizedERC20.length; i++)
		{
			uint256 utilizedERC20AllocationActual = eRC20AmountETHValue[i].mul(1e18).div(
				utilizedERC20AmountTotalETHValue_,
				"!computed"
			);

			if (
				utilizedERC20AllocationActual != IYieldSyncV1EMP(msg.sender).utilizedERC20_utilizationERC20(
					utilizedERC20[i]
				).allocation
			)
			{
				valid_ = false;

				break;
			}
		}

		return (valid_, utilizedERC20AmountTotalETHValue_);
	}

	/// @inheritdoc IYieldSyncV1EMPUtility
	function yieldSyncV1EMPStrategyUtilizedERC20AmountValid(uint256[][] memory _yieldSyncV1EMPStrategyUtilizedERC20Amount)
		public
		override
		returns (bool valid_)
	{
		address[] memory utilizedYieldSyncV1EMPStrategy = IYieldSyncV1EMP(msg.sender).utilizedYieldSyncV1EMPStrategy();

		require(
			utilizedYieldSyncV1EMPStrategy.length == _yieldSyncV1EMPStrategyUtilizedERC20Amount.length,
			"!(utilizedYieldSyncV1EMPStrategy.length == _yieldSyncV1EMPStrategyUtilizedERC20Amount.length)"
		);

		valid_ = true;

		uint256 utilizedYieldSyncV1EMPStrategyERC20AmountETHValueTotal_ = 0;

		uint256[] memory utilizedYieldSyncV1EMPStrategyERC20AmountETHValue = new uint256[](
			utilizedYieldSyncV1EMPStrategy.length
		);

		for (uint256 i = 0; i < utilizedYieldSyncV1EMPStrategy.length; i++)
		{
			uint256 utilizedERC20AmountETHValue = IYieldSyncV1EMPStrategy(
				utilizedYieldSyncV1EMPStrategy[i]
			).utilizedERC20AmountETHValue(
				_yieldSyncV1EMPStrategyUtilizedERC20Amount[i]
			);

			utilizedYieldSyncV1EMPStrategyERC20AmountETHValue[i] = utilizedERC20AmountETHValue;

			utilizedYieldSyncV1EMPStrategyERC20AmountETHValueTotal_ += utilizedERC20AmountETHValue;
		}

		for (uint256 i = 0; i < utilizedYieldSyncV1EMPStrategy.length; i++)
		{
			uint256 utilizedERC20AmountAllocationActual = utilizedYieldSyncV1EMPStrategyERC20AmountETHValue[i].mul(1e18).div(
				utilizedYieldSyncV1EMPStrategyERC20AmountETHValueTotal_,
				"!computed"
			);

			if (
				utilizedERC20AmountAllocationActual != IYieldSyncV1EMP(msg.sender).utilizedYieldSyncV1EMPStrategy_allocation(
					utilizedYieldSyncV1EMPStrategy[i]
				)
			)
			{
				valid_ = false;

				break;
			}
		}

		return valid_;
	}

	/// @inheritdoc IYieldSyncV1EMPUtility
	function utilizedERC20TotalAmount()
		public
		view
		override
		authEMP()
		returns (uint256[] memory utilizedERC20TotalAmount_)
	{
		address[] memory utilizedERC20 = IYieldSyncV1EMP(msg.sender).utilizedERC20();

		utilizedERC20TotalAmount_ = new uint256[](utilizedERC20.length);

		address[] memory utilizedYieldSyncV1EMPStrategy = IYieldSyncV1EMP(msg.sender).utilizedYieldSyncV1EMPStrategy();

		for (uint256 i = 0; i < utilizedERC20.length; i++)
		{
			utilizedERC20TotalAmount_[i] += IERC20(utilizedERC20[i]).balanceOf(address(this));

			for (uint256 ii = 0; ii < utilizedYieldSyncV1EMPStrategy.length; ii++)
			{
				utilizedERC20TotalAmount_[i] += IYieldSyncV1EMPStrategy(
					utilizedYieldSyncV1EMPStrategy[ii]
				).iYieldSyncV1EMPStrategyInteractor().utilizedERC20TotalAmount(utilizedERC20[i]);
			}
		}
	}
}
