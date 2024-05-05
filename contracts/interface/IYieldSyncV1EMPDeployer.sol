// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


interface IYieldSyncV1EMPDeployer
{
	/**
	* @param _name {string}
	* @param _symbol {string}
	*/
	function deployYieldSyncV1EMP(string memory _name, string memory _symbol)
		external
		returns (address yieldSyncV1EMP_)
	;
}
