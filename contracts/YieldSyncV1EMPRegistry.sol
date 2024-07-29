// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IYieldSyncGovernance } from "@yield-sync/v1-sdk/contracts/interface/IYieldSyncGovernance.sol";

import { IYieldSyncV1EMPRegistry } from "./interface/IYieldSyncV1EMPRegistry.sol";


contract YieldSyncV1EMPRegistry is
	IYieldSyncV1EMPRegistry
{
	address public override immutable YIELD_SYNC_GOVERNANCE;

	address public override yieldSyncV1EMPArrayUtility;
	address public override yieldSyncV1EMPDeployer;
	address public override yieldSyncV1EMPStrategyDeployer;
	address public override yieldSyncV1EMPStrategyUtility;
	address public override yieldSyncV1EMPAmountsValidator;

	uint256 public yieldSyncEMPIdTracker;
	uint256 public yieldSyncEMPStrategyIdTracker;

	mapping (address eRC20 => address yieldSyncV1EMPERC20ETHValueFeed) public override eRC20_yieldSyncV1EMPERC20ETHValueFeed;

	mapping (address yieldSyncV1EMP => uint256 yieldSyncV1EMPId) public override yieldSyncV1EMP_yieldSyncV1EMPId;

	mapping (
		address yieldSyncV1EMPStrategy => uint256 yieldSyncV1EMPStrategyId
	) public override yieldSyncV1EMPStrategy_yieldSyncV1EMPStrategyId;

	mapping (uint256 yieldSyncV1EMPId => address yieldSyncV1EMP) public override yieldSyncV1EMPId_yieldSyncV1EMP;

	mapping (
		uint256 yieldSyncV1EMPStrategyId => address yieldSyncV1EMPStrategy
	) public override yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy;


	receive ()
		external
		payable
	{}


	fallback ()
		external
		payable
	{}


	constructor (address yieldSyncGovernance)
	{
		YIELD_SYNC_GOVERNANCE = yieldSyncGovernance;

		yieldSyncEMPIdTracker = 0;
		yieldSyncEMPStrategyIdTracker = 0;
	}


	modifier authYieldSyncGovernance()
	{
		require(IYieldSyncGovernance(YIELD_SYNC_GOVERNANCE).hasRole(bytes32(0), msg.sender), "!authorized");

		_;
	}


	/// @notice view


	/// @inheritdoc IYieldSyncV1EMPRegistry
	function yieldSyncGovernancePayTo()
		public
		view
		returns (address)
	{
		return IYieldSyncGovernance(YIELD_SYNC_GOVERNANCE).payTo();
	}


	/// @notice mutative


	/// @inheritdoc IYieldSyncV1EMPRegistry
	function eRC20_yieldSyncV1EMPERC20ETHValueFeedUpdate(address _eRC20, address _yieldSyncV1EMPERC20ETHValueFeed)
		public
		override
		authYieldSyncGovernance()
	{
		require(_eRC20 != address(0), "!(_eRC20 != address(0))");

		require(_yieldSyncV1EMPERC20ETHValueFeed != address(0), "!(_yieldSyncV1EMPERC20ETHValueFeed != address(0))");

		eRC20_yieldSyncV1EMPERC20ETHValueFeed[_eRC20] = _yieldSyncV1EMPERC20ETHValueFeed;
	}

	/// @inheritdoc IYieldSyncV1EMPRegistry
	function yieldSyncV1EMPArrayUtilityUpdate(address _yieldSyncV1EMPArrayUtility)
		public
		override
		authYieldSyncGovernance()
	{
		require(yieldSyncV1EMPArrayUtility == address(0), "!(yieldSyncV1EMPArrayUtility == address(0))");

		yieldSyncV1EMPArrayUtility = _yieldSyncV1EMPArrayUtility;
	}


	/// @inheritdoc IYieldSyncV1EMPRegistry
	function yieldSyncV1EMPDeployerUpdate(address _yieldSyncV1EMPDeployer)
		public
		override
		authYieldSyncGovernance()
	{
		require(yieldSyncV1EMPAmountsValidator != address(0), "!(yieldSyncV1EMPAmountsValidator != address(0))");

		require(yieldSyncV1EMPDeployer == address(0), "!(yieldSyncV1EMPDeployer == address(0))");

		yieldSyncV1EMPDeployer = _yieldSyncV1EMPDeployer;
	}

	/// @inheritdoc IYieldSyncV1EMPRegistry
	function yieldSyncV1EMPRegister(address _yieldSyncV1EMP)
		public
		override
	{
		require(yieldSyncV1EMPDeployer == msg.sender, "!(yieldSyncV1EMPDeployer == msg.sender)");

		yieldSyncEMPIdTracker++;

		yieldSyncV1EMP_yieldSyncV1EMPId[_yieldSyncV1EMP] = yieldSyncEMPIdTracker;
		yieldSyncV1EMPId_yieldSyncV1EMP[yieldSyncEMPIdTracker] = _yieldSyncV1EMP;
	}

	/// @inheritdoc IYieldSyncV1EMPRegistry
	function yieldSyncV1EMPStrategyDeployerUpdate(address _yieldSyncV1EMPStrategyDeployer)
		public
		override
		authYieldSyncGovernance()
	{
		require(yieldSyncV1EMPStrategyUtility != address(0), "!(yieldSyncV1EMPStrategyUtility != address(0))");

		require(yieldSyncV1EMPStrategyDeployer == address(0), "!(yieldSyncV1EMPStrategyDeployer == address(0))");

		yieldSyncV1EMPStrategyDeployer = _yieldSyncV1EMPStrategyDeployer;
	}

	/// @inheritdoc IYieldSyncV1EMPRegistry
	function yieldSyncV1EMPStrategyRegister(address _yieldSyncV1EMPStrategy)
		public
		override
	{
		require(yieldSyncV1EMPStrategyDeployer == msg.sender, "!(yieldSyncV1EMPStrategyDeployer == msg.sender)");

		yieldSyncEMPStrategyIdTracker++;

		yieldSyncV1EMPStrategy_yieldSyncV1EMPStrategyId[_yieldSyncV1EMPStrategy] = yieldSyncEMPStrategyIdTracker;
		yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy[yieldSyncEMPStrategyIdTracker] = _yieldSyncV1EMPStrategy;
	}

	/// @inheritdoc IYieldSyncV1EMPRegistry
	function yieldSyncV1EMPStrategyUtilityUpdate(address _yieldSyncV1EMPStrategyUtility)
		public
		override
		authYieldSyncGovernance()
	{
		require(yieldSyncV1EMPArrayUtility != address(0), "!(yieldSyncV1EMPArrayUtility != address(0))");

		require(yieldSyncV1EMPStrategyUtility == address(0), "!(yieldSyncV1EMPStrategyUtility == address(0))");

		yieldSyncV1EMPStrategyUtility = _yieldSyncV1EMPStrategyUtility;
	}

	/// @inheritdoc IYieldSyncV1EMPRegistry
	function yieldSyncV1EMPAmountsValidatorUpdate(address _yieldSyncV1EMPAmountsValidator)
		public
		override
		authYieldSyncGovernance()
	{
		require(yieldSyncV1EMPArrayUtility != address(0), "!(yieldSyncV1EMPArrayUtility != address(0))");

		require(yieldSyncV1EMPAmountsValidator == address(0), "!(yieldSyncV1EMPAmountsValidator == address(0))");

		yieldSyncV1EMPAmountsValidator = _yieldSyncV1EMPAmountsValidator;
	}
}
