// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


contract YieldSyncV1EMPRegistry
{
	mapping (
		address yieldSynV1EMPDeployer => mapping(address yieldSyncV1EMP => bool valid)
	) public yieldSynV1EMPDeployer_yieldSyncV1EMP_valid;


	function yieldSyncV1EMP_validUpdate(address _yieldSyncV1EMP)
		public
	{
		yieldSynV1EMPDeployer_yieldSyncV1EMP_valid[msg.sender][_yieldSyncV1EMP] = true;
	}
}
