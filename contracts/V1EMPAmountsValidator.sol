// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import { IV1EMP } from "./interface/IV1EMP.sol";
import { IV1EMPAmountsValidator } from "./interface/IV1EMPAmountsValidator.sol";
import { IV1EMPETHValueFeed } from "./interface/IV1EMPETHValueFeed.sol";
import { IV1EMPRegistry } from "./interface/IV1EMPRegistry.sol";
import { IV1EMPStrategy } from "./interface/IV1EMPStrategy.sol";


contract V1EMPAmountsValidator is
	IV1EMPAmountsValidator
{
	using SafeMath for uint256;

	uint256 public constant ONE_HUNDRED_PERCENT = 1e18;

	IV1EMPRegistry public immutable I_V1_EMP_REGISTRY;


	receive ()
		external
		payable
	{}


	fallback ()
		external
		payable
	{}


	constructor (address _v1EMPRegistry)
	{
		I_V1_EMP_REGISTRY = IV1EMPRegistry(_v1EMPRegistry);
	}


	modifier authEMP()
	{
		require(I_V1_EMP_REGISTRY.v1EMP_v1EMPId(msg.sender) > 0, "!authorized");

		_;
	}


	/// @inheritdoc IV1EMPAmountsValidator
	function utilizedERC20AmountValid(uint256[] memory _utilizedERC20Amount)
		public
		view
		override
		authEMP()
		returns (bool valid_, uint256 utilizedERC20AmountTotalETHValue_)
	{
		address[] memory utilizedERC20 = IV1EMP(msg.sender).utilizedERC20();

		require(_utilizedERC20Amount.length == utilizedERC20.length, "!(_utilizedERC20Amount.length == utilizedERC20.length)");

		valid_ = true;

		utilizedERC20AmountTotalETHValue_ = 0;

		uint256[] memory eRC20AmountETHValue = new uint256[](utilizedERC20.length);

		for (uint256 i = 0; i < utilizedERC20.length; i++)
		{
			uint256 utilizedERC20AmountETHValue = _utilizedERC20Amount[i].mul(
				IV1EMPETHValueFeed(I_V1_EMP_REGISTRY.eRC20_v1EMPERC20ETHValueFeed(utilizedERC20[i])).utilizedERC20ETHValue()
			).div(
				1e18
			);

			utilizedERC20AmountTotalETHValue_ += utilizedERC20AmountETHValue;

			eRC20AmountETHValue[i] = utilizedERC20AmountETHValue;
		}

		for (uint256 i = 0; i < utilizedERC20.length; i++)
		{
			uint256 utilizedERC20AllocationActual = eRC20AmountETHValue[i].mul(1e18).div(
				utilizedERC20AmountTotalETHValue_,
				"!computed"
			);

			if (utilizedERC20AllocationActual != IV1EMP(msg.sender).utilizedERC20_utilizationERC20(utilizedERC20[i]).allocation)
			{
				valid_ = false;

				break;
			}
		}

		return (valid_, utilizedERC20AmountTotalETHValue_);
	}

	/// @inheritdoc IV1EMPAmountsValidator
	function v1EMPStrategyUtilizedERC20AmountValid(uint256[][] memory _v1EMPStrategyUtilizedERC20Amount)
		public
		override
		authEMP()
		returns (bool valid_)
	{
		address[] memory utilizedV1EMPStrategy = IV1EMP(msg.sender).utilizedV1EMPStrategy();

		require(
			utilizedV1EMPStrategy.length == _v1EMPStrategyUtilizedERC20Amount.length,
			"!(utilizedV1EMPStrategy.length == _v1EMPStrategyUtilizedERC20Amount.length)"
		);

		valid_ = true;

		uint256 utilizedV1EMPStrategyERC20AmountETHValueTotal_ = 0;

		uint256[] memory utilizedV1EMPStrategyERC20AmountETHValue = new uint256[](utilizedV1EMPStrategy.length);

		for (uint256 i = 0; i < utilizedV1EMPStrategy.length; i++)
		{
			(uint256 utilizedERC20AmountETHValueTotal_, ) = IV1EMPStrategy(utilizedV1EMPStrategy[i]).utilizedERC20AmountETHValue(
				_v1EMPStrategyUtilizedERC20Amount[i]
			);

			utilizedV1EMPStrategyERC20AmountETHValueTotal_ += utilizedERC20AmountETHValueTotal_;

			utilizedV1EMPStrategyERC20AmountETHValue[i] = utilizedERC20AmountETHValueTotal_;
		}

		for (uint256 i = 0; i < utilizedV1EMPStrategy.length; i++)
		{
			uint256 utilizedERC20AmountAllocationActual = utilizedV1EMPStrategyERC20AmountETHValue[i].mul(1e18).div(
				utilizedV1EMPStrategyERC20AmountETHValueTotal_,
				"!computed"
			);

			if (utilizedERC20AmountAllocationActual != IV1EMP(msg.sender).utilizedV1EMPStrategy_allocation(utilizedV1EMPStrategy[i]))
			{
				valid_ = false;

				break;
			}
		}

		return valid_;
	}
}
