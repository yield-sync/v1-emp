// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


interface IV1EMPDeployer
{
	/**
	* @param _name {string}
	* @param _symbol {string}
	*/
	function deployV1EMP(string memory _name, string memory _symbol)
		external
		returns (address v1EMP_)
	;
}
