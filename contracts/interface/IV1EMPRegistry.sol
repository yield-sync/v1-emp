// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


interface IV1EMPRegistry
{
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
	* @notice ERC20 -> ERC20ETHValueProvider
	* @param eRC20 {address}
	* @return eRC20ETHValueProvider_ {address}
	*/
	function eRC20_eRC20ETHValueProvider(address eRC20)
		external
		view
		returns (address eRC20ETHValueProvider_)
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
	* @return {address}
	*/
	function addressArrayUtility()
		external
		view
		returns (address)
	;

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

	/**
	* @dev [view-address]
	* @return {address}
	*/
	function governance()
		external
		view
		returns (address)
	;


	/**
	* @dev [view-address]
	* @return {address}
	*/
	function v1EMPDeployer()
		external
		view
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
	function v1EMPStrategyUtility()
		external
		view
		returns (address)
	;

	/**
	* @dev [view-address]
	* @return {address}
	*/
	function v1EMPUtility()
		external
		view
		returns (address)
	;


	/// @notice mutative


	/**
	* @notice AddressArrayUtility Update
	* @param __addressArrayUtility {address}
	*/
	function addressArrayUtilityUpdate(address __addressArrayUtility)
		external
	;

	/**
	* @notice Update eRC20 -> iERC20ETHValueProvider
	* @param _eRC20 {address}
	* @param _eRC20ETHValueProvider {address}
	*/
	function eRC20_eRC20ETHValueProviderUpdate(address _eRC20, address _eRC20ETHValueProvider)
		external
	;

	/**
	* @notice Governance Update
	* @param __governance {address}
	*/
	function governanceUpdate(address __governance)
		external
	;

	/**
	* @notice V1EMPDeployer Update
	* @param __v1EMPDeployer {address}
	*/
	function v1EMPDeployerUpdate(address __v1EMPDeployer)
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
	* @param __v1EMPStrategyDeployer {address}
	*/
	function v1EMPStrategyDeployerUpdate(address __v1EMPStrategyDeployer)
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
	* @param __v1EMPStrategyUtility {address}
	*/
	function v1EMPStrategyUtilityUpdate(address __v1EMPStrategyUtility)
		external
	;

	/**
	* @notice V1EMPUtility Update
	* @param __v1EMPUtility {address}
	*/
	function v1EMPUtilityUpdate(address __v1EMPUtility)
		external
	;
}
