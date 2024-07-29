// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IV1EMPArrayUtility } from "./interface/IV1EMPArrayUtility.sol";
import { IV1EMPRegistry } from "./interface/IV1EMPRegistry.sol";
import { IV1EMPStrategyUtility } from "./interface/IV1EMPStrategyUtility.sol";


contract V1EMPStrategyUtility is
	IV1EMPStrategyUtility
{
	IV1EMPArrayUtility public immutable I_V1_EMP_ARRAY_UTILITY;
	IV1EMPRegistry public immutable I_V1_EMP_REGISTRY;


	constructor (address _v1EMPRegistry)
	{
		I_V1_EMP_REGISTRY = IV1EMPRegistry(_v1EMPRegistry);
		I_V1_EMP_ARRAY_UTILITY = IV1EMPArrayUtility(
			I_V1_EMP_REGISTRY.v1EMPArrayUtility()
		);
	}


	/// @inheritdoc IV1EMPStrategyUtility
	function sort(address[] memory _array)
		public
		view
		override
		returns (address[] memory)
	{
		return I_V1_EMP_ARRAY_UTILITY.sort(_array);

	}

	/// @inheritdoc IV1EMPStrategyUtility
	function containsDuplicates(address[] memory _array)
		public
		override
		returns (bool)
	{
		return I_V1_EMP_ARRAY_UTILITY.containsDuplicates(_array);
	}
}
