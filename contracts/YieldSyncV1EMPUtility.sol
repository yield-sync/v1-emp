// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import { IYieldSyncV1EMP } from "./interface/IYieldSyncV1EMP.sol";
import { IYieldSyncV1EMPETHValueFeed } from "./interface/IYieldSyncV1EMPETHValueFeed.sol";
import { IYieldSyncV1EMPRegistry } from "./interface/IYieldSyncV1EMPRegistry.sol";
import { IYieldSyncV1EMPStrategy } from "./interface/IYieldSyncV1EMPStrategy.sol";
import { IYieldSyncV1EMPUtility } from "./interface/IYieldSyncV1EMPUtility.sol";


contract YieldSyncV1EMPUtility is
	IYieldSyncV1EMPUtility
{
	using SafeMath for uint256;

	uint256 public constant ONE_HUNDRED_PERCENT = 1e18;

	IYieldSyncV1EMPRegistry public immutable I_YIELD_SYNC_V1_EMP_REGISTRY;


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
	}


	modifier authEMP()
	{
		require(I_YIELD_SYNC_V1_EMP_REGISTRY.yieldSyncV1EMP_yieldSyncV1EMPId(msg.sender) > 0, "!authorized");

		_;
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
