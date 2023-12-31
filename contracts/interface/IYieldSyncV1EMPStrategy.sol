// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { IYieldSyncV1EMPETHValueFeed } from "./IYieldSyncV1EMPETHValueFeed.sol";
import { IYieldSyncV1EMPStrategyInteractor } from "./IYieldSyncV1EMPStrategyInteractor.sol";


using SafeERC20 for IERC20;


struct Purpose
{
	bool deposit;
	bool withdraw;
	uint256 allocation;
}


interface IYieldSyncV1EMPStrategy is
	IERC20
{
	/**
	* @dev [view-address]
	* @notice Manager
	* @return {address}
	*/
	function manager()
		external
		view
		returns (address)
	;

	/**
	* @dev [view-address[]]
	* @notice Utilized ERC20s
	* @return {address[]}
	*/
	function utilizedERC20()
		external
		view
		returns (address[] memory)
	;

	/**
	* @notice Utilized ERC20 ETH Value
	* @param _utilizedERC20 {address}
	* @return utilizedERC20ETHValue_ {uint256}
	*/
	function utilizedERC20ETHValue(address _utilizedERC20)
		external
		view
		returns (uint256 utilizedERC20ETHValue_)
	;

	/**
	* @notice Utilized ERC20 Deposit Open
	*/
	function utilizedERC20DepositOpen()
		external
		view
		returns (bool)
	;

	/**
	* @notice Utilized ERC20 Withdraw Open
	*/
	function utilizedERC20WithdrawOpen()
		external
		view
		returns (bool)
	;

	/**
	* @dev [view-uint256]
	* @notice One Hundred Percent
	* @return {uint256}
	*/
	function ONE_HUNDRED_PERCENT()
		external
		view
		returns (uint256)
	;

	/**
	* @dev [view-IYieldSyncV1EMPETHValueFeed]
	* @notice Implemented IYieldSyncV1EMPETHValueFeed
	* @return {IYieldSyncV1EMPETHValueFeed}
	*/
	function yieldSyncV1EMPETHValueFeed()
		external
		view
		returns (IYieldSyncV1EMPETHValueFeed)
	;

	/**
	* @dev [view-IYieldSyncV1EMPStrategyInteractor]
	* @notice Implemented IYieldSyncV1EMPStrategyInteractor
	* @return {IYieldSyncV1EMPStrategyInteractor}
	*/
	function yieldSyncV1EMPStrategyInteractor()
		external
		view
		returns (IYieldSyncV1EMPStrategyInteractor)
	;

	/**
	* @dev [view-mapping]
	* @notice Utilized ERC20 Allocation
	* @param __utilizedERC20 {address}
	* @return purpopse_ {Purpose}
	*/
	function utilizedERC20_purpose(address __utilizedERC20)
		external
		view
		returns (Purpose memory purpopse_)
	;

	/**
	* @notice Eth value of position
	* @param target {address}
	* @return balanceOfETHValue_ {uint256}
	*/
	function balanceOfETHValue(address target)
		external
		view
		returns (uint256 balanceOfETHValue_)
	;

	/**
	* @notice Utilized ERC20 amounts returned per ERC20
	* @return utilizedERC20Amount_ {uint256[]}
	*/
	function utilizedERC20AmountPerBurn()
		external
		view
		returns (uint256[] memory utilizedERC20Amount_)
	;

	/**
	* @notice Valid utilized ERC20 amounts
	* @param _utilizedERC20Amount {uint256}
	* @return utilizedERC20AmountValid_ {bool}
	*/
	function utilizedERC20AmountValid(uint256[] memory _utilizedERC20Amount)
		external
		returns (bool utilizedERC20AmountValid_)
	;

	/**
	* @notice Set utilized ERC20s and purpose
	* @param __utilizedERC20 {address[]}
	* @param _purpose {Purpose[]}
	*/
	function utilizedERC20AndPurposeUpdate(address[] memory __utilizedERC20, Purpose[] memory _purpose)
		external
	;

	/**
	* @notice Deposit utilized ERC20s
	* @param _utilizedERC20Amount {uint256[]}
	*/
	function utilizedERC20Deposit(uint256[] memory _utilizedERC20Amount)
		external
	;

	/**
	* @notice Utilized ERC20 Deposit Open Toggle
	*/
	function utilizedERC20DepositOpenToggle()
		external
	;

	/**
	* @notice Withdraw utilized ERC20s
	* @param _ERC20Amount {uint256}
	*/
	function utilizedERC20Withdraw(uint256 _ERC20Amount)
		external
	;

	/**
	* @notice Utilized ERC20 Deposit Open Toggle
	*/
	function utilizedERC20WithdrawOpenToggle()
		external
	;

	/**
	* @notice Update yieldSyncV1EMPETHValueFeed
	* @param _yieldSyncV1EMPETHValueFeed {address}
	*/
	function yieldSyncV1EMPETHValueFeedUpdate(address _yieldSyncV1EMPETHValueFeed)
		external
	;

	/**
	* @notice Update yieldSyncV1EMPStrategyInteractor
	* @param _YSSInteractor {address}
	*/
	function yieldSyncV1EMPStrategyInteractorUpdate(address _YSSInteractor)
		external
	;
}
