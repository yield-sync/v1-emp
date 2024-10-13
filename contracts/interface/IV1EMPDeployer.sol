// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


interface IV1EMPDeployer
{
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
}
