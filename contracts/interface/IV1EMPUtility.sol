// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { UtilizationERC20 } from "../struct/UtilizationERC20.sol";


interface IV1EMPUtility
{
	/**
	* @dev [view-address[]]
	* @notice Implemented v1EMP_utilizedERC20
	* @return {address[]}
	*/
	function v1EMP_utilizedERC20(address _v1EMP)
		external
		view
		returns (address[] memory)
	;

	/**
	* @dev [view-mapping]
	* @notice v1EMP -> utilizedERC20 -> utilizationERC20
	* @param _v1EMP {address}
	* @param _utilizedERC20 {address}
	* @return {UtilizationERC20}
	*/
	function v1EMP_utilizedERC20_utilizationERC20(address _v1EMP, address _utilizedERC20)
		external
		view
		returns (UtilizationERC20 memory)
	;


	/// @notice view


	/**
	* @notice Optimized Transfer Amount
	* @param _v1EMP {address}
	* @param utilizedERC20 {address}
	* @param transferAmount {uint256}
	* @return optimizedTransferAmount_ {uint256}
	*/
	function optimizedTransferAmount(address _v1EMP, address utilizedERC20, uint256 transferAmount)
		external
		view
		returns (uint256 optimizedTransferAmount_)
	;

	/**
	* @notice Percent One Hundred
	* @return percentOneHundred_ {uint256}
	*/
	function percentOneHundred()
		external
		view
		returns (uint256 percentOneHundred_)
	;

	/**
	* @notice Utilized ERC20 Amount Valid
	* @param _v1EMP {address}
	* @param _utilizedERC20Amount {uint256}
	* @return valid_ {bool}
	* @return utilizedERC20AmountTotalETHValue_ {uint256}
	* @return message_ {string}
	*/
	function utilizedERC20AmountValid(address _v1EMP, uint256[] memory _utilizedERC20Amount)
		external
		view
		returns (bool valid_, uint256 utilizedERC20AmountTotalETHValue_, string memory message_)
	;

	/**
	* @notice
	* @param _v1EMP {address}
	* @param _v1EMPStrategy {address[]}
	* @param _allocation {uint256[]}
	* @return valid_ {bool}
	* @return message_ {string}
	*/
	function utilizedV1EMPStrategyValid(address _v1EMP, address[] memory _v1EMPStrategy, uint256[] memory _allocation)
		external
		returns (bool valid_, string memory message_)
	;

	/**
	* @notice V1 EMP Strategy Utilized ERC20 Amount Valid
	* @param _v1EMP {address}
	* @param _v1EMPStrategyUtilizedERC20Amount {uint256[][]}
	* @return valid_ {bool}
	* @return message_ {string}
	*/
	function v1EMPStrategyUtilizedERC20AmountValid(address _v1EMP, uint256[][] memory _v1EMPStrategyUtilizedERC20Amount)
		external
		view
		returns (bool valid_, string memory message_)
	;


	/// @notice mutative


	/**
	* @notice Utilized Strategy Sync
	*/
	function utilizedV1EMPStrategySync()
		external
	;
}
