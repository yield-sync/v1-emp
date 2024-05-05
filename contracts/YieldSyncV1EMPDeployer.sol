// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { YieldSyncV1EMP } from "./YieldSyncV1EMP.sol";
import { IYieldSyncV1EMPDeployer } from "./interface/IYieldSyncV1EMPDeployer.sol";
import { IYieldSyncV1EMPRegistry } from "./interface/IYieldSyncV1EMPRegistry.sol";


contract YieldSyncV1EMPDeployer is
	IYieldSyncV1EMPDeployer
{
	receive ()
		external
		payable
	{}


	fallback ()
		external
		payable
	{}


	IYieldSyncV1EMPRegistry public immutable I_YIELD_SYNC_V1_EMP_REGISTRY;


	constructor (address _yieldSyncV1EMPRegistry)
	{
		I_YIELD_SYNC_V1_EMP_REGISTRY = IYieldSyncV1EMPRegistry(_yieldSyncV1EMPRegistry);
	}


	/// @inheritdoc IYieldSyncV1EMPDeployer
	function deployYieldSyncV1EMP(string memory _name, string memory _symbol)
		public
		returns (address yieldSyncV1EMP_)
	{
		yieldSyncV1EMP_ = address(new YieldSyncV1EMP(msg.sender, address(I_YIELD_SYNC_V1_EMP_REGISTRY), _name, _symbol));

		I_YIELD_SYNC_V1_EMP_REGISTRY.yieldSyncV1EMPRegister(yieldSyncV1EMP_);
	}
}
