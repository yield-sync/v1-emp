// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";


interface IYieldSyncV1Strategy is
	IERC20
{
	/**
	* @notice Value of position denominated in ETH
	* @return positionValueInEth_ {uint256}
	*/
	function positionValueInEth()
		external
		view
		returns (uint256 positionValueInEth_)
	;

	/**
	* @notice
	* @return utilized_ {bool}
	*/
	function token_utilized(address _token)
		external
		view
		returns (bool utilized_)
	;

	/**
	* @notice
	* @return {address[]}
	*/
	function utilizedToken()
		external
		view
		returns (address[] memory)
	;
}
