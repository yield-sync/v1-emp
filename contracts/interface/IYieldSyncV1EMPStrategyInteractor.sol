// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;


interface IYieldSyncV1EMPStrategyInteractor
{
	/**
	* @notice Total amounts locked
	* @param _utilizedERC20 {address[]}
	*/
	function utilizedERC20TotalAmount(address[] memory _utilizedERC20)
		external
		view
		returns (uint256[] memory utilizedERC20Amount_)
	;


	/**
	* @notice Deposit utilizedERC20s
	* @param _from {address}
	* @param _utilizedERC20 {address[]}
	* @param _utilizedERC20Amount {uint256[]}
	*/
	function utilizedERC20Deposit(address _from, address[] memory _utilizedERC20, uint256[] memory _utilizedERC20Amount)
		external
	;

	/**
	* @notice Withdraw utilizedERC20s
	* @param _to {address}
	* @param _utilizedERC20 {address[]}
	* @param _utilizedERC20Amount {uint256[]}
	*/
	function utilizedERC20Withdraw(address _to, address[] memory _utilizedERC20, uint256[] memory _utilizedERC20Amount)
		external
	;
}
