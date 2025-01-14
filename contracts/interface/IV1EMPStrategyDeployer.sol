// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


interface IV1EMPStrategyDeployer
{
	/**
	* @dev [view-bool]
	* @notice Deploy V1EMP Strategy Open
	*/
	function deployV1EMPStrategyOpen()
		external
		returns (bool)
	;


	/// @notice mutative


	/**
	* @notice Deploy V1 EMP Strategy
	*/
	function deployV1EMPStrategy()
		external
		returns (address v1EMPStrategy_)
	;

	/**
	* @notice Deploy V1EMP Strategy Open Update
	* @param _deployV1EMPStrategyOpen {bool}
	*/
	function deployV1EMPStrategyOpenUpdate(bool _deployV1EMPStrategyOpen)
		external
	;
}
