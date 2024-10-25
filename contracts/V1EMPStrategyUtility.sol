
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import { IV1EMPArrayUtility } from "./interface/IV1EMPArrayUtility.sol";
import { IV1EMPETHValueFeed } from "./interface/IV1EMPETHValueFeed.sol";
import { IV1EMPRegistry } from "./interface/IV1EMPRegistry.sol";
import { IV1EMPStrategy } from "./interface/IV1EMPStrategy.sol";
import {
	IV1EMPStrategyUtility,
	UtilizationERC20
} from "./interface/IV1EMPStrategyUtility.sol";


contract V1EMPStrategyUtility is
	IV1EMPStrategyUtility
{
	using SafeMath for uint256;


	IV1EMPArrayUtility internal immutable _I_V1_EMP_ARRAY_UTILITY;
	IV1EMPRegistry internal immutable _I_V1_EMP_REGISTRY;


	constructor (address _v1EMPRegistry)
	{
		_I_V1_EMP_REGISTRY = IV1EMPRegistry(_v1EMPRegistry);
		_I_V1_EMP_ARRAY_UTILITY = IV1EMPArrayUtility(_I_V1_EMP_REGISTRY.v1EMPArrayUtility());
	}


	modifier existantV1EMPStrategy(address _v1EMPStrategy)
	{
		require(
			_I_V1_EMP_REGISTRY.v1EMPStrategy_v1EMPStrategyId(_v1EMPStrategy) > 0,
			"!(_I_V1_EMP_REGISTRY.v1EMPStrategy_v1EMPStrategyId(_v1EMPStrategy) > 0)"
		);

		_;
	}


	/// @notice view


	/// @inheritdoc IV1EMPStrategyUtility
	function depositAmountsValid(address _v1EMPStrategy, uint256[] memory _utilizedERC20Amount)
		public
		view
		override
		existantV1EMPStrategy(_v1EMPStrategy)
		returns (bool valid_, string memory message_, uint256 utilizedERC20AmountETHValueTotal_)
	{
		valid_ = true;

		IV1EMPStrategy iV1EMPStrategy = IV1EMPStrategy(_v1EMPStrategy);

		address[] memory utilizedERC20 = iV1EMPStrategy.utilizedERC20();

		if (utilizedERC20.length != _utilizedERC20Amount.length)
		{
			return (false, "!(utilizedERC20.length == _utilizedERC20Amount.length)", utilizedERC20AmountETHValueTotal_);
		}

		uint256[] memory utilizedERC20AmountETHValue_;

		(utilizedERC20AmountETHValueTotal_, utilizedERC20AmountETHValue_) = utilizedERC20AmountETHValue(
			_v1EMPStrategy,
			_utilizedERC20Amount
		);

		for (uint256 i = 0; i < utilizedERC20.length; i++)
		{
			if (!iV1EMPStrategy.utilizedERC20_utilizationERC20(utilizedERC20[i]).deposit)
			{
				if (_utilizedERC20Amount[i] != 0)
				{
					return (false, "!(_utilizedERC20Amount[i] == 0)", utilizedERC20AmountETHValueTotal_);
				}
			}

			uint256 utilizedERC20AmountAllocationActual = utilizedERC20AmountETHValue_[i].mul(1e18).div(
				utilizedERC20AmountETHValueTotal_,
				"!computed"
			);

			if (iV1EMPStrategy.utilizedERC20_utilizationERC20(utilizedERC20[i]).allocation != utilizedERC20AmountAllocationActual)
			{
				return (
					false,
					"!(iV1EMPStrategy.utilizedERC20_utilizationERC20(utilizedERC20[i]).allocation == utilizedERC20AmountAllocationActual)",
					utilizedERC20AmountETHValueTotal_
				);
			}
		}
	}

	/// @inheritdoc IV1EMPStrategyUtility
	function utilizedERC20AmountETHValue(address _v1EMPStrategy, uint256[] memory _utilizedERC20Amount)
		public
		view
		override
		existantV1EMPStrategy(_v1EMPStrategy)
		returns (uint256 utilizedERC20AmountETHValueTotal_, uint256[] memory utilizedERC20AmountETHValue_)
	{
		IV1EMPStrategy iV1EMPStrategy = IV1EMPStrategy(_v1EMPStrategy);

		address[] memory utilizedERC20 = iV1EMPStrategy.utilizedERC20();

		require(utilizedERC20.length == _utilizedERC20Amount.length, "!(utilizedERC20.length == _utilizedERC20Amount.length)");

		utilizedERC20AmountETHValue_ = new uint256[](_utilizedERC20Amount.length);

		for (uint256 i = 0; i < utilizedERC20.length; i++)
		{
			if (iV1EMPStrategy.utilizedERC20_utilizationERC20(utilizedERC20[i]).deposit)
			{
				utilizedERC20AmountETHValue_[i] = _utilizedERC20Amount[i].mul(
					IV1EMPETHValueFeed(_I_V1_EMP_REGISTRY.eRC20_v1EMPERC20ETHValueFeed(utilizedERC20[i])).utilizedERC20ETHValue()
				).div(
					10 ** IV1EMPETHValueFeed(_I_V1_EMP_REGISTRY.eRC20_v1EMPERC20ETHValueFeed(utilizedERC20[i])).eRC20Decimals()
				);

				utilizedERC20AmountETHValueTotal_ += utilizedERC20AmountETHValue_[i];
			}
		}
	}

	/// @inheritdoc IV1EMPStrategyUtility
	function utilizedERC20Sort(address[] memory _utilizedERC20)
		public
		view
		override
		returns (address[] memory)
	{
		return _I_V1_EMP_ARRAY_UTILITY.sort(_utilizedERC20);
	}


	/// @notice mutative


	/// @inheritdoc IV1EMPStrategyUtility
	function utilizedERC20UpdateValid(
		address _v1EMPStrategy,
		address[] memory _utilizedERC20,
		UtilizationERC20[] memory _utilizationERC20
	)
		public
		override
		existantV1EMPStrategy(_v1EMPStrategy)
		returns (bool valid_, string memory message_)
	{
		valid_ = true;

		if (_utilizedERC20.length != _utilizationERC20.length)
		{
			return (false, "!(_utilizedERC20.length == _utilizationERC20.length)");
		}

		if (_I_V1_EMP_ARRAY_UTILITY.containsDuplicates(_utilizedERC20))
		{
			return (false, "_I_V1_EMP_ARRAY_UTILITY.containsDuplicates(_utilizedERC20)");
		}

		uint256 utilizedERC20AllocationTotal;

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			if (_I_V1_EMP_REGISTRY.eRC20_v1EMPERC20ETHValueFeed(_utilizedERC20[i]) == address(0))
			{
				return (false, "!(_I_V1_EMP_REGISTRY.eRC20_v1EMPERC20ETHValueFeed(_utilizedERC20[i]) != address(0))");
			}

			if (_utilizationERC20[i].deposit)
			{
				utilizedERC20AllocationTotal += _utilizationERC20[i].allocation;
			}
		}

		if (utilizedERC20AllocationTotal != _I_V1_EMP_REGISTRY.ONE_HUNDRED_PERCENT())
		{
			return (false, "!(utilizedERC20AllocationTotal == _I_V1_EMP_REGISTRY.ONE_HUNDRED_PERCENT())");
		}
	}
}
