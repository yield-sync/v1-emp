// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


interface IYieldSyncV1EMPStrategyDeployer
{
	/**
	* @param _name {string}
	* @param _symbol {string}
	*/
	function deployYieldSyncV1EMPStrategy(string memory _name, string memory _symbol)
		external
		returns (address yieldSyncV1EMPStrategy_)
	;
}
