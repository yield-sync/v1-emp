// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;


interface IYieldSyncV1EMPStrategyDeployer
{
	/**
	* @param _name {string}
	* @param _symbol {string}
	*/
	function deployYieldSyncV1EMPStrategy(string memory _name, string memory _symbol)
		external
		payable
		returns (address yieldSyncV1EMPStrategy_)
	;

	/**
	* @param _fee {uint256}
	*/
	function feeUpdate(uint256 _fee)
		external
	;
}
