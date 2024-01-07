// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


interface IYieldSyncV1EMPRegistry
{
	/**
	* @param _yieldSynV1EMPDeployer {address}
	* @param _yieldSyncV1EMP {address}
	*/
	function yieldSynV1EMPDeployer_yieldSyncV1EMP_registered(address _yieldSynV1EMPDeployer, address _yieldSyncV1EMP)
		external
		view
		returns (bool registered_)
	;


	/**
	* @param _yieldSyncV1EMP {address}
	*/
	function yieldSynV1EMPDeployer_yieldSyncV1EMP_registeredUpdate(address _yieldSyncV1EMP)
		external
	;
}
