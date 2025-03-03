// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


interface IV1EMPDeployer
{
	/**
	* @dev [view-bool]
	* @notice Deploy V1EMP Open
	*/
	function deployV1EMPOpen()
		external
		returns (bool)
	;


	/// @notice mutative


	/**
	* @notice Deploy V1EMP
	* @param _name {string}
	* @param _symbol {string}
	* @return v1EMP_ {address}
	*/
	function deployV1EMP(bool _utilizedERC20WithdrawFull, string memory _name, string memory _symbol)
		external
		returns (address v1EMP_)
	;

	/**
	* @notice Deploy V1EMP Open Update
	* @param _deployV1EMPOpen {bool}
	*/
	function deployV1EMPOpenUpdate(bool _deployV1EMPOpen)
		external
	;
}
