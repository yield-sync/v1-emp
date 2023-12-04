// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


interface IYieldSyncV1Strategy
{
	function utilizedTokenETHValue(address _token)
		external
		view
		returns (uint256 tokenETHValue_)
	;

	/**
	* @notice
	* @param _utilizedToken {address[]}
	* @param _utilizedTokenAmount {uint256[]}
	*/
	function utilizedTokenDeposit(address[] memory _utilizedToken, uint256[] memory _utilizedTokenAmount)
		external
	;

	/**
	* @notice
	* @param _to {address}
	* @param _utilizedToken {address[]}
	* @param _utilizedTokenAmount {uint256[]}
	*/
	function utilizedTokenWithdraw(address _to, address[] memory _utilizedToken, uint256[] memory _utilizedTokenAmount)
		external
	;

	/**
	* @notice Return total amounts locked
	*/
	function utilizedTokenTotalAmount(address[] memory _utilizedToken)
		external
		view
		returns (uint256[] memory utilizedTokenAmount_)
	;
}
