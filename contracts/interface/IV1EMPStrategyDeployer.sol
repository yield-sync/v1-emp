// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


interface IV1EMPStrategyDeployer
{
	/**
	* @notice Deploy V1 EMP Strategy
	*/
	function deployV1EMPStrategy()
		external
		returns (address v1EMPStrategy_)
	;
}
