// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


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
		returns (bool updateNeeded, address[] memory utilizedERC20_, UtilizationERC20[] memory utilizationERC20_)
	{
		updateNeeded = false;

		uint256 utilizedERC20MaxLength = 0;

		address[] memory utilizedYieldSyncV1EMPStrategy = IYieldSyncV1EMP(msg.sender).utilizedYieldSyncV1EMPStrategy();

		// First get the total length of the ERC20 addresses and check if they need updates
		for (uint256 i = 0; i < utilizedYieldSyncV1EMPStrategy.length; i++)
		{
			// Get the count for the utilized ERC 20 update
			uint256 utilizedERC20UpdateTracker = IYieldSyncV1EMPStrategy(
				utilizedYieldSyncV1EMPStrategy[i]
			).utilizedERC20UpdateTracker();

			// If an update is needed..
			if (
				yieldSyncV1EMP_yieldSyncV1EMPStrategy_utilizedERC20UpdateTracker[msg.sender][
					utilizedYieldSyncV1EMPStrategy[i]
				] != utilizedERC20UpdateTracker
			)
			{
				// Set updatedNeeded to true
				updateNeeded = true;

				// Update local record of update tracker
				yieldSyncV1EMP_yieldSyncV1EMPStrategy_utilizedERC20UpdateTracker[msg.sender][
					utilizedYieldSyncV1EMPStrategy[i]
				] = utilizedERC20UpdateTracker;
			}

			// Set max length of utilized ERC20 to the sum of all lengths of each utilized ERC20 on stratgies
			utilizedERC20MaxLength += IYieldSyncV1EMPStrategy(utilizedYieldSyncV1EMPStrategy[i]).utilizedERC20().length;
		}

		// If no update is needed return updateNaded as false
		if (!updateNeeded)
		{
			return (updateNeeded, utilizedERC20_, utilizationERC20_);
		}

		// Initialize the utilizedERC20 to the max possible size it can be
		utilizedERC20_ = new address[](utilizedERC20MaxLength);

		// Set the count to 0
		uint256 utilizedERC20I = 0;

		// For each EMP utilized strategy..
		for (uint256 i = 0; i < utilizedYieldSyncV1EMPStrategy.length; i++)
		{
			// Get the utilized ERC20
			address[] memory strategyUtilizedERC20 = IYieldSyncV1EMPStrategy(utilizedYieldSyncV1EMPStrategy[i]).utilizedERC20();

			// Add each ERC20 to the EMP UtilizedERC20
			for (uint256 ii = 0; ii < strategyUtilizedERC20.length; ii++)
			{
				utilizedERC20_[utilizedERC20I++] = strategyUtilizedERC20[ii];
			}
		}

		// Clean up the array
		utilizedERC20_ = I_YIELD_SYNC_V1_EMP_ARRAY_UTILITY.removeDuplicates(utilizedERC20_);
		utilizedERC20_ = I_YIELD_SYNC_V1_EMP_ARRAY_UTILITY.sort(utilizedERC20_);

		utilizationERC20_ = new UtilizationERC20[](utilizedERC20_.length);

		uint256 utilizedERC20AllocationTotal;

		/**
		 * This is not done in the loop above because the utilizedERC20 has to be cleaned first before adding the
		 * utilizations to the values.
		 */

		// For each strategy..
		for (uint256 i = 0; i < utilizedYieldSyncV1EMPStrategy.length; i++)
		{
			// Initialize an interface for the strategy
			IYieldSyncV1EMPStrategy iYieldSyncV1EMPStrategy = IYieldSyncV1EMPStrategy(utilizedYieldSyncV1EMPStrategy[i]);

			// For each utilized erc20 for stategy..
			for (uint256 ii = 0; ii < utilizedERC20_.length; ii++)
			{
				/**
				 * The objective here is to set the utilization for each ERC20
				 */
				// Get the utilization
				UtilizationERC20 memory utilizationERC20 = iYieldSyncV1EMPStrategy.utilizedERC20_utilizationERC20(utilizedERC20_[ii]);

				// If for depositing..
				if (utilizationERC20.deposit)
				{
					utilizationERC20_[ii].deposit = true;

					// Multiple the allocation for the ERC20 on the strategy with the EMP strategy allocation
					uint256 utilizationERC20Allocation = utilizationERC20.allocation.mul(
						IYieldSyncV1EMP(msg.sender).utilizedYieldSyncV1EMPStrategy_allocation(utilizedYieldSyncV1EMPStrategy[i])
					).div(
						1e18
					);

					// Add the allocation to anything that exists before
					utilizationERC20_[ii].allocation += utilizationERC20Allocation; // On EMP it is queried by address not placement

					// Add to the total sum of allocation total
					utilizedERC20AllocationTotal += utilizationERC20Allocation;
				}

				// If the token is withdrawn set the withdrawn to true
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
}
