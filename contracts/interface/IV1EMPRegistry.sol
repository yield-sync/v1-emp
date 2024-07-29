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
	function v1EMPStrategyDeployer()
		external
		returns (address)
	;

	/**
	* @dev [view-address]
	* @return {address}
	*/
	function v1EMPAmountsValidator()
		external
		returns (address)
	;

	/**
	* @param eRC20 {address}
	* @return v1EMPERC20ETHValueFeed_ {address}
	*/
	function eRC20_v1EMPERC20ETHValueFeed(address eRC20)
		external
		view
		returns (address v1EMPERC20ETHValueFeed_)
	;

	/**
	* @param _v1EMP {address}
	* @return v1EMPId_ {uint256}
	*/
	function v1EMP_v1EMPId(address _v1EMP)
		external
		view
		returns (uint256 v1EMPId_)
	;

	/**
	* @param _v1EMPStrategy {address}
	* @return v1EMPStrategyId_ {uint256}
	*/
	function v1EMPStrategy_v1EMPStrategyId(address _v1EMPStrategy)
		external
		view
		returns (uint256 v1EMPStrategyId_)
	;

	/**
	* @param _v1EMPId {uint256}
	* @return v1EMP_ {address}
	*/
	function v1EMPId_v1EMP(uint256 _v1EMPId)
		external
		view
		returns (address v1EMP_)
	;

	/**
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
	* @return {address}
	*/
	function governancePayTo()
		external
		view
		returns (address)
	;


	/// @notice mutative


	/**
	* @notice Update eRC20_iV1EMPERC20ETHValueFeed
	* @param _eRC20 {address}
	* @param _v1EMPERC20ETHValueFeed {address}
	*/
	function eRC20_v1EMPERC20ETHValueFeedUpdate(address _eRC20, address _v1EMPERC20ETHValueFeed)
		external
	;

	/**
	* @param _v1EMPArrayUtility {address}
	*/
	function v1EMPArrayUtilityUpdate(address _v1EMPArrayUtility)
		external
	;


	/**
	* @param _v1EMPDeployer {address}
	*/
	function v1EMPDeployerUpdate(address _v1EMPDeployer)
		external
	;

	/**
	* @param _v1EMP {address}
	*/
	function v1EMPRegister(address _v1EMP)
		external
	;

	/**
	* @param _v1EMPStrategyDeployer {address}
	*/
	function v1EMPStrategyDeployerUpdate(address _v1EMPStrategyDeployer)
		external
	;

	/**
	* @param _v1EMPStrategy {address}
	*/
	function v1EMPStrategyRegister(address _v1EMPStrategy)
		external
	;

	/**
	* @param _v1EMPAmountsValidator {address}
	*/
	function v1EMPAmountsValidatorUpdate(address _v1EMPAmountsValidator)
		external
	;
}
