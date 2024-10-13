// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


interface IV1EMPRegistry
{
	/**
	* @dev [view-address]
	* @return {address}
	*/
	function GOVERNANCE()
		external
		returns (address)
	;

	/**
	* @dev [view-address]
	* @return {address}
	*/
	function v1EMPArrayUtility()
		external
		returns (address)
	;

	/**
	* @dev [view-address]
	* @return {address}
	*/
	function v1EMPDeployer()
		external
		returns (address)
	;

	/**
	* @dev [view-address]
	* @return {address}
	*/
	function v1EMPStrategyUtility()
		external
		returns (address)
	;

	/**
	* @dev [view-address]
	* @return {address}
	*/
	function v1EMPStrategyDeployer()
		external
		returns (address)
	;

	/**
	* @dev [view-address]
	* @return {address}
	*/
	function v1EMPUtility()
		external
		returns (address)
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
	* @dev [view-uint256]
	* @notice V1 EMP Id Tracker
	* @return {uint256}
	*/
	function v1EMPIdTracker()
		external
		view
		returns (uint256)
	;

	/**
	* @dev [view-uint256]
	* @notice V1 EMP Strategy Id Tracker
	* @return {uint256}
	*/
	function v1EMPStrategyIdTracker()
		external
		view
		returns (uint256)
	;

	/**
	* @notice ERC20 -> V1EMPERC20ETHValueFeed
	* @param eRC20 {address}
	* @return v1EMPERC20ETHValueFeed_ {address}
	*/
	function eRC20_v1EMPERC20ETHValueFeed(address eRC20)
		external
		view
		returns (address v1EMPERC20ETHValueFeed_)
	;

	/**
	* @notice v1EMP -> v1EMPId
	* @param _v1EMP {address}
	* @return v1EMPId_ {uint256}
	*/
	function v1EMP_v1EMPId(address _v1EMP)
		external
		view
		returns (uint256 v1EMPId_)
	;

	/**
	* @notice v1EMPId -> v1EMP
	* @param _v1EMPId {uint256}
	* @return v1EMP_ {address}
	*/
	function v1EMPId_v1EMP(uint256 _v1EMPId)
		external
		view
		returns (address v1EMP_)
	;

	/**
	* @notice v1EMPStrategy -> v1EMPStrategyId
	* @param _v1EMPStrategy {address}
	* @return v1EMPStrategyId_ {uint256}
	*/
	function v1EMPStrategy_v1EMPStrategyId(address _v1EMPStrategy)
		external
		view
		returns (uint256 v1EMPStrategyId_)
	;

	/**
	* @notice v1EMPStrategyId -> v1EMPStrategy
	* @param _v1EMPStrategyId {uint256}
	* @return v1EMPStrategy_ {address}
	*/
	function v1EMPStrategyId_v1EMPStrategy(uint256 _v1EMPStrategyId)
		external
		view
		returns (address v1EMPStrategy_)
	;


	/// @notice view


	/**
	* @dev [view-address]
	* @notice Governance Pay To
	* @return {address}
	*/
	function governancePayTo()
		external
		view
		returns (address)
	;


	/// @notice mutative


	/**
	* @notice Update eRC20 -> iV1EMPERC20ETHValueFeed
	* @param _eRC20 {address}
	* @param _v1EMPERC20ETHValueFeed {address}
	*/
	function eRC20_v1EMPERC20ETHValueFeedUpdate(address _eRC20, address _v1EMPERC20ETHValueFeed)
		external
	;

	/**
	* @notice V1EMPArrayUtility Update
	* @param _v1EMPArrayUtility {address}
	*/
	function v1EMPArrayUtilityUpdate(address _v1EMPArrayUtility)
		external
	;


	/**
	* @notice V1EMPDeployer Update
	* @param _v1EMPDeployer {address}
	*/
	function v1EMPDeployerUpdate(address _v1EMPDeployer)
		external
	;

	/**
	* @notice V1EMPRegister
	* @param _v1EMP {address}
	*/
	function v1EMPRegister(address _v1EMP)
		external
	;

	/**
	* @notice V1EMPStrategyDeployer Update
	* @param _v1EMPStrategyDeployer {address}
	*/
	function v1EMPStrategyDeployerUpdate(address _v1EMPStrategyDeployer)
		external
	;

	/**
	* @notice V1EMPStrategy Register
	* @param _v1EMPStrategy {address}
	*/
	function v1EMPStrategyRegister(address _v1EMPStrategy)
		external
	;

	/**
	* @notice V1EMPStrategyUtility Update
	* @param _v1EMPStrategyUtility {address}
	*/
	function v1EMPStrategyUtilityUpdate(address _v1EMPStrategyUtility)
		external
	;

	/**
	* @notice V1EMPUtility Update
	* @param _v1EMPUtility {address}
	*/
	function v1EMPUtilityUpdate(address _v1EMPUtility)
		external
	;
}
