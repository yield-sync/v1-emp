// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";


struct Allocation
{
	uint8 denominator;
	uint8 numerator;
}


interface IYieldSyncV1Strategy is
	IERC20
{
	/**
	* @return allocation_ {Allocation}
	*/
	function token_allocation(address _token)
		external
		view
		returns (Allocation memory allocation_)
	;


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
	* @param _token {address}
	* @return utilized_ {bool}
	*/
	function token_utilized(address _token)
		external
		view
		returns (bool utilized_)
	;

	/**
	* @notice Array of utilized tokens
	* @return utilizedToken_ {address[]}
	*/
	function utilizedToken()
		external
		view
		returns (address[] memory utilizedToken_)
	;
}
