// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IYieldSyncV1EMPRegistry } from "./interface/IYieldSyncV1EMPRegistry.sol";


contract YieldSyncV1EMPRegistry is
	IYieldSyncV1EMPRegistry
{
	mapping (
		address yieldSynV1EMPDeployer => mapping(address yieldSyncV1EMP => bool registered)
	) internal _yieldSynV1EMPDeployer_yieldSyncV1EMP_registered;


	/// @inheritdoc IYieldSyncV1EMPRegistry
	function yieldSynV1EMPDeployer_yieldSyncV1EMP_registered(address _yieldSynV1EMPDeployer, address _yieldSyncV1EMP)
		public
		view
		returns (bool registered_)
	{
		return _yieldSynV1EMPDeployer_yieldSyncV1EMP_registered[_yieldSynV1EMPDeployer][_yieldSyncV1EMP];
	}


	/// @inheritdoc IYieldSyncV1EMPRegistry
	function yieldSynV1EMPDeployer_yieldSyncV1EMP_registeredUpdate(address _yieldSyncV1EMP)
		public
		override
	{
		_yieldSynV1EMPDeployer_yieldSyncV1EMP_registered[msg.sender][_yieldSyncV1EMP] = true;
	}
}
