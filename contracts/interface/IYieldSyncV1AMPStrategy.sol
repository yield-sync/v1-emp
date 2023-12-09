// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


interface IYieldSyncV1AMPStrategy
{
	/**
	* @notice Utilized token value in ETH
	* @param _token {address}
	*/
	function utilizedTokenETHValue(address _token)
		external
		view
		returns (uint256 tokenETHValue_)
	;

	/**
	* @notice Return total amounts locked
	* @param _utilizedToken {address[]}
	*/
	function utilizedTokenTotalAmount(address[] memory _utilizedToken)
		external
		view
		returns (uint256[] memory utilizedTokenAmount_)
	;


	/**
	* @notice Deposit Utilized Tokens
	* @param _utilizedToken {address[]}
	* @param _utilizedTokenAmount {uint256[]}
	*/
	function utilizedTokenDeposit(address[] memory _utilizedToken, uint256[] memory _utilizedTokenAmount)
		external
	;

	/**
	* @notice Withdraw Utilized Tokens
	* @param _to {address}
	* @param _utilizedToken {address[]}
	* @param _utilizedTokenAmount {uint256[]}
	*/
	function utilizedTokenWithdraw(address _to, address[] memory _utilizedToken, uint256[] memory _utilizedTokenAmount)
		external
	;
}
