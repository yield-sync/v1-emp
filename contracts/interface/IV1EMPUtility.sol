// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { UtilizationERC20 } from "../struct/UtilizationERC20.sol";


interface IV1EMPUtility
{
	/**
	* @dev [view-IV1EMPArrayUtility]
	* @notice Implemented IV1EMPArrayUtility
	* @return {IV1EMPArrayUtility}
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
	* @notice
	* @param _v1EMP {address}
	* @return utilizedERC20TotalAmount_ {uint256[]}
	*/
	function utilizedERC20TotalBalance(address _v1EMP)
		external
		view
		returns (uint256[] memory utilizedERC20TotalAmount_)
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
	* @notice Utilized ERC20 Available And Tranfer Amount
	* @param _v1EMP {address}
	* @param _eRC20Amount {uint256}
	* @return utilizedERC20Available_ {bool}
	* @return transferAmount_ {uint256[]}
	*/
	function utilizedERC20AvailableAndTransferAmount(address _v1EMP, uint256 _eRC20Amount)
		external
		view
		returns(bool utilizedERC20Available_, uint256[] memory transferAmount_)
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


	/// @notice mutative


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
	* @notice Utilized Strategy Sync
	*/
	function utilizedStrategySync()
		external
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
		returns (bool valid_, string memory message_)
	;
}
