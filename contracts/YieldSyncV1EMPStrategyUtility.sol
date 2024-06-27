// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IYieldSyncV1EMPArrayUtility } from "./interface/IYieldSyncV1EMPArrayUtility.sol";
import { IYieldSyncV1EMPRegistry } from "./interface/IYieldSyncV1EMPRegistry.sol";
import { IYieldSyncV1EMPStrategyUtility } from "./interface/IYieldSyncV1EMPStrategyUtility.sol";


contract YieldSyncV1EMPStrategyUtility is
	IYieldSyncV1EMPStrategyUtility
{
	IYieldSyncV1EMPArrayUtility public immutable I_YIELD_SYNC_V1_EMP_ARRAY_UTILITY;
	IYieldSyncV1EMPRegistry public immutable I_YIELD_SYNC_V1_EMP_REGISTRY;


	constructor (address _yieldSyncV1EMPRegistry)
	{
		I_YIELD_SYNC_V1_EMP_REGISTRY = IYieldSyncV1EMPRegistry(_yieldSyncV1EMPRegistry);
		I_YIELD_SYNC_V1_EMP_ARRAY_UTILITY = IYieldSyncV1EMPArrayUtility(
			I_YIELD_SYNC_V1_EMP_REGISTRY.yieldSyncV1EMPArrayUtility()
		);
	}


	/// @inheritdoc IYieldSyncV1EMPStrategyUtility
	function sort(address[] memory _array)
		public
		view
		override
		returns (address[] memory)
	{
		return I_YIELD_SYNC_V1_EMP_ARRAY_UTILITY.sort(_array);

	}

	/// @inheritdoc IYieldSyncV1EMPStrategyUtility
	function containsDuplicates(address[] memory _array)
		public
		override
		returns (bool)
	{
		return I_YIELD_SYNC_V1_EMP_ARRAY_UTILITY.containsDuplicates(_array);
	}
}
