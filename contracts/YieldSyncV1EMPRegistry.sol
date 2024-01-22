// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IYieldSyncV1EMPRegistry } from "./interface/IYieldSyncV1EMPRegistry.sol";


contract YieldSyncV1EMPRegistry is
	IYieldSyncV1EMPRegistry
{
	address public manager;
	address public yieldSyncV1EMPDeployer;
	address public yieldSyncV1EMPStrategyDeployer;

	mapping (address yieldSyncV1EMP => bool registered) public override yieldSyncV1EMP_registered;
	mapping (address yieldSyncV1EMPStrategy => bool registered) public override yieldSyncV1EMPStrategy_registered;


	constructor ()
	{
		manager = msg.sender;
	}


	/// @inheritdoc IYieldSyncV1EMPRegistry
	function yieldSyncV1EMPDeployerUpdate(address _yieldSyncV1EMPDeployer)
		public
		override
	{
		require(manager == msg.sender, "");

		require(yieldSyncV1EMPDeployer == address(0), "");

		yieldSyncV1EMPDeployer = _yieldSyncV1EMPDeployer;
	}

	/// @inheritdoc IYieldSyncV1EMPRegistry
	function yieldSyncV1EMP_registeredUpdate(address _yieldSyncV1EMP)
		public
		override
	{
		require(yieldSyncV1EMPDeployer == msg.sender, "");

		yieldSyncV1EMP_registered[_yieldSyncV1EMP] = true;
	}

	/// @inheritdoc IYieldSyncV1EMPRegistry
	function yieldSyncV1EMPStrategyDeployerUpdate(address _yieldSyncV1EMPStrategyDeployer)
		public
		override
	{
		require(manager == msg.sender, "");

		require(yieldSyncV1EMPStrategyDeployer == address(0), "");

		yieldSyncV1EMPStrategyDeployer = _yieldSyncV1EMPStrategyDeployer;
	}

	/// @inheritdoc IYieldSyncV1EMPRegistry
	function yieldSyncV1EMPStrategy_registeredUpdate(address _yieldSyncV1EMPStrategy)
		public
		override
	{
		require(yieldSyncV1EMPStrategyDeployer == msg.sender, "");

		yieldSyncV1EMPStrategy_registered[_yieldSyncV1EMPStrategy] = true;
	}
}
