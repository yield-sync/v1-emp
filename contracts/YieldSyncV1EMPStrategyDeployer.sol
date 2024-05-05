// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IAccessControlEnumerable } from "@openzeppelin/contracts/access/IAccessControlEnumerable.sol";

import { IYieldSyncV1EMPStrategyDeployer } from "./interface/IYieldSyncV1EMPStrategyDeployer.sol";
import { YieldSyncV1EMPStrategy } from "./YieldSyncV1EMPStrategy.sol";
import { IYieldSyncV1EMPRegistry } from "./interface/IYieldSyncV1EMPRegistry.sol";


contract YieldSyncV1EMPStrategyDeployer is
	IYieldSyncV1EMPStrategyDeployer
{
	receive ()
		external
		payable
	{}


	fallback ()
		external
		payable
	{}


	uint256 public fee;

	IYieldSyncV1EMPRegistry public immutable I_YIELD_SYNC_V1_EMP_REGISTRY;


	constructor (address _yieldSyncV1EMPRegistry)
	{
		fee = 0;

		I_YIELD_SYNC_V1_EMP_REGISTRY = IYieldSyncV1EMPRegistry(_yieldSyncV1EMPRegistry);
	}


	/// @inheritdoc IYieldSyncV1EMPStrategyDeployer
	function deployYieldSyncV1EMPStrategy(string memory _name, string memory _symbol)
		public
		returns (address yieldSyncV1EMPStrategy_)
	{
		yieldSyncV1EMPStrategy_ = address(
			new YieldSyncV1EMPStrategy(msg.sender, address(I_YIELD_SYNC_V1_EMP_REGISTRY), _name, _symbol)
		);

		I_YIELD_SYNC_V1_EMP_REGISTRY.yieldSyncV1EMPStrategyRegister(yieldSyncV1EMPStrategy_);
	}
}
