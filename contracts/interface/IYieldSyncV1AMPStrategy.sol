// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


interface IYieldSyncV1AMPStrategy
{
	/**
	* @notice ERC20 value in ETH
	* @param _eRC20 {address}
	*/
	function eRC20ETHValue(address _eRC20)
		external
		view
		returns (uint256 eRC20ETHValue_)
	;

	/**
	* @notice Total amounts locked
	* @param _eRC20 {address[]}
	*/
	function eRC20TotalAmount(address[] memory _eRC20)
		external
		view
		returns (uint256[] memory eRC20Amount_)
	;


	/**
	* @notice Deposit eRC20s
	* @param _eRC20 {address[]}
	* @param _eRC20Amount {uint256[]}
	*/
	function eRC20Deposit(address[] memory _eRC20, uint256[] memory _eRC20Amount)
		external
	;

	/**
	* @notice Withdraw eRC20s
	* @param _to {address}
	* @param _eRC20 {address[]}
	* @param _eRC20Amount {uint256[]}
	*/
	function eRC20Withdraw(address _to, address[] memory _eRC20, uint256[] memory _eRC20Amount)
		external
	;
}
