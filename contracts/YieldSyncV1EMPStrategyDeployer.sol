// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IYieldSyncV1EMPStrategyDeployer } from "./interface/IYieldSyncV1EMPStrategyDeployer.sol";
import { YieldSyncV1EMPStrategy } from "./YieldSyncV1EMPStrategy.sol";
import { IYieldSyncV1EMPRegistry } from "./interface/IYieldSyncV1EMPRegistry.sol";


contract YieldSyncV1EMPStrategyDeployer is
	IYieldSyncV1EMPStrategyDeployer
{
	address public immutable YIELD_SYNC_UTILITY_V1_ARRAY;

	IYieldSyncV1EMPRegistry public immutable I_YIELD_SYNC_V1_EMP_REGISTRY;


	receive ()
		external
		payable
	{}


	fallback ()
		external
		payable
	{}


	constructor (address _yieldSyncV1EMPRegistry, address _yieldSyncUtilityV1Array)
	{
		I_YIELD_SYNC_V1_EMP_REGISTRY = IYieldSyncV1EMPRegistry(_yieldSyncV1EMPRegistry);

		YIELD_SYNC_UTILITY_V1_ARRAY = _yieldSyncUtilityV1Array;
	}


	/// @inheritdoc IYieldSyncV1EMPStrategyDeployer
	function deployYieldSyncV1EMPStrategy(string memory _name, string memory _symbol)
		public
		returns (address yieldSyncV1EMPStrategy_)
	{
		yieldSyncV1EMPStrategy_ = address(
			new YieldSyncV1EMPStrategy(
				msg.sender,
				YIELD_SYNC_UTILITY_V1_ARRAY,
				address(I_YIELD_SYNC_V1_EMP_REGISTRY),
				_name,
				_symbol
			)
		);

		I_YIELD_SYNC_V1_EMP_REGISTRY.yieldSyncV1EMPStrategyRegister(yieldSyncV1EMPStrategy_);
	}
}
