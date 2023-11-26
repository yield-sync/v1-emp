// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


using SafeERC20 for IERC20;


struct Allocation
{
	uint8 denominator;
	uint8 numerator;
}


interface IStrategy
{
	/**
	* @notice
	* @param _utilizedToken {address[]}
	* @param _utilizedToken {uint256[]}
	*/
	function utilizedTokensDeposit(address[] memory _utilizedToken, uint256[] memory _amount)
		external
	;

	/**
	* @notice
	* @param _utilizedToken {address[]}
	* @param _utilizedToken {uint256[]}
	*/
	function utilizedTokensWithdraw(address[] memory _utilizedToken, uint256[] memory _amount)
		external
	;
}

interface IYieldSyncV1StrategyHandler is
	IERC20
{
	/**
	* @notice token to allocation
	* @dev [view-mapping]
	* @param token {address}
	* @return {Allocation}
	*/
	function token_allocation(address token)
		external
		view
		returns (Allocation memory)
	;

	/**
	* @notice token to utilized
	* @dev [view-mapping]
	* @param _token {address}
	* @return utilized_ {bool}
	*/
	function token_utilized(address _token)
		external
		view
		returns (bool utilized_)
	;


	/**
	* @notice Value of position denominated in WETH
	* @param target {address}
	* @return positionValueInWETH_ {uint256}
	*/
	function positionValueInWETH(address target)
		external
		view
		returns (uint256 positionValueInWETH_)
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

	/**
	* @notice Return value of token denominated in WETH
	* @param _token {uint256}
	* @return tokenValueInWETH_ {uint256}
	*/
	function utilizedTokenValueInWETH(address _token)
		external
		view
		returns (uint256 tokenValueInWETH_)
	;

	/**
	* @notice Deposit into strategy
	* @param _amount {uint256[]} Amount to be deposited
	*/
	function utilizedTokensDeposit(uint256[] memory _amount)
		external
	;

	/**
	* @notice Withdraw from strategy
	* @param _amount {uint256[]} Amount to be withdrawn
	*/
	function utilizedTokensWithdraw(uint256[] memory _amount)
		external
	;
}
