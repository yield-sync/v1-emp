// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";


interface IYieldSyncV1Strategy is
	IERC20
{
	/**
	* @notice Tokens utilized
	*/
	function utilizedToken()
		external
		view
		returns (address[] memory)
	;
}
