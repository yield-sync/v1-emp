// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


interface IYieldSyncV1EMPRegistry
{
	/**
	* @param _yieldSyncV1EMP {address}
	*/
	function yieldSyncV1EMP_registered(address _yieldSyncV1EMP)
		external
		view
		returns (bool registered_)
	;

	/**
	* @param _yieldSyncV1EMPStrategy {address}
	*/
	function yieldSyncV1EMPStrategy_registered(address _yieldSyncV1EMPStrategy)
		external
		view
		returns (bool registered_)
	;


	/**
	* @param _yieldSyncV1EMP {address}
	*/
	function yieldSyncV1EMP_registeredUpdate(address _yieldSyncV1EMP)
		external
	;

	/**
	* @param _yieldSyncV1EMPDeployer {address}
	*/
	function yieldSyncV1EMPDeployerUpdate(address _yieldSyncV1EMPDeployer)
		external
	;

	/**
	* @param _yieldSyncV1EMPStrategy {address}
	*/
	function yieldSyncV1EMPStrategy_registeredUpdate(address _yieldSyncV1EMPStrategy)
		external
	;

	/**
	* @param _yieldSyncV1EMPStrategyDeployer {address}
	*/
	function yieldSyncV1EMPStrategyDeployerUpdate(address _yieldSyncV1EMPStrategyDeployer)
		external
	;
}
