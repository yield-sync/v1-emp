// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


interface IYieldSyncV1EMPRegistry
{
	/**
	* @dev [view-address]
	* @return {address}
	*/
	function YIELD_SYNC_GOVERNANCE()
		external
		returns (address)
	;

	/**
	* @dev [view-address]
	* @return {address}
	*/
	function yieldSyncV1EMPArrayUtility()
		external
		returns (address)
	;

	/**
	* @dev [view-address]
	* @return {address}
	*/
	function yieldSyncV1EMPDeployer()
		external
		returns (address)
	;

	/**
	* @dev [view-address]
	* @return {address}
	*/
	function yieldSyncV1EMPStrategyDeployer()
		external
		returns (address)
	;

	/**
	* @dev [view-address]
	* @return {address}
	*/
	function yieldSyncV1EMPStrategyUtility()
		external
		returns (address)
	;

	/**
	* @dev [view-address]
	* @return {address}
	*/
	function yieldSyncV1EMPAmountsValidator()
		external
		returns (address)
	;

	/**
	* @param eRC20 {address}
	* @return yieldSyncV1EMPERC20ETHValueFeed_ {address}
	*/
	function eRC20_yieldSyncV1EMPERC20ETHValueFeed(address eRC20)
		external
		view
		returns (address yieldSyncV1EMPERC20ETHValueFeed_)
	;

	/**
	* @param _yieldSyncV1EMP {address}
	* @return yieldSyncV1EMPId_ {uint256}
	*/
	function yieldSyncV1EMP_yieldSyncV1EMPId(address _yieldSyncV1EMP)
		external
		view
		returns (uint256 yieldSyncV1EMPId_)
	;

	/**
	* @param _yieldSyncV1EMPStrategy {address}
	* @return yieldSyncV1EMPStrategyId_ {uint256}
	*/
	function yieldSyncV1EMPStrategy_yieldSyncV1EMPStrategyId(address _yieldSyncV1EMPStrategy)
		external
		view
		returns (uint256 yieldSyncV1EMPStrategyId_)
	;

	/**
	* @param _yieldSyncV1EMPId {uint256}
	* @return yieldSyncV1EMP_ {address}
	*/
	function yieldSyncV1EMPId_yieldSyncV1EMP(uint256 _yieldSyncV1EMPId)
		external
		view
		returns (address yieldSyncV1EMP_)
	;

	/**
	* @param _yieldSyncV1EMPStrategyId {uint256}
	* @return yieldSyncV1EMPStrategy_ {address}
	*/
	function yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(uint256 _yieldSyncV1EMPStrategyId)
		external
		view
		returns (address yieldSyncV1EMPStrategy_)
	;


	/// @notice view


	/**
	* @dev [view-address]
	* @return {address}
	*/
	function yieldSyncGovernancePayTo()
		external
		view
		returns (address)
	;


	/// @notice mutative


	/**
	* @notice Update eRC20_iYieldSyncV1EMPERC20ETHValueFeed
	* @param _eRC20 {address}
	* @param _yieldSyncV1EMPERC20ETHValueFeed {address}
	*/
	function eRC20_yieldSyncV1EMPERC20ETHValueFeedUpdate(address _eRC20, address _yieldSyncV1EMPERC20ETHValueFeed)
		external
	;

	/**
	* @param _yieldSyncV1EMPArrayUtility {address}
	*/
	function yieldSyncV1EMPArrayUtilityUpdate(address _yieldSyncV1EMPArrayUtility)
		external
	;


	/**
	* @param _yieldSyncV1EMPDeployer {address}
	*/
	function yieldSyncV1EMPDeployerUpdate(address _yieldSyncV1EMPDeployer)
		external
	;

	/**
	* @param _yieldSyncV1EMP {address}
	*/
	function yieldSyncV1EMPRegister(address _yieldSyncV1EMP)
		external
	;

	/**
	* @param _yieldSyncV1EMPStrategyDeployer {address}
	*/
	function yieldSyncV1EMPStrategyDeployerUpdate(address _yieldSyncV1EMPStrategyDeployer)
		external
	;

	/**
	* @param _yieldSyncV1EMPStrategy {address}
	*/
	function yieldSyncV1EMPStrategyRegister(address _yieldSyncV1EMPStrategy)
		external
	;

	/**
	* @param _yieldSyncV1EMPStrategyUtility {address}
	*/
	function yieldSyncV1EMPStrategyUtilityUpdate(address _yieldSyncV1EMPStrategyUtility)
		external
	;

	/**
	* @param _yieldSyncV1EMPAmountsValidator {address}
	*/
	function yieldSyncV1EMPAmountsValidatorUpdate(address _yieldSyncV1EMPAmountsValidator)
		external
	;
}
