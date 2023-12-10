// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


interface IYieldSyncV1AMPStrategy
{
	/**
	* @notice Token value in ETH
	* @param _token {address}
	*/
	function tokenETHValue(address _token)
		external
		view
		returns (uint256 tokenETHValue_)
	;

	/**
	* @notice Total amounts locked
	* @param _token {address[]}
	*/
	function tokenTotalAmount(address[] memory _token)
		external
		view
		returns (uint256[] memory tokenAmount_)
	;


	/**
	* @notice Deposit tokens
	* @param _token {address[]}
	* @param _tokenAmount {uint256[]}
	*/
	function tokenDeposit(address[] memory _token, uint256[] memory _tokenAmount)
		external
	;

	/**
	* @notice Withdraw tokens
	* @param _to {address}
	* @param _token {address[]}
	* @param _tokenAmount {uint256[]}
	*/
	function tokenWithdraw(address _to, address[] memory _token, uint256[] memory _tokenAmount)
		external
	;
}
