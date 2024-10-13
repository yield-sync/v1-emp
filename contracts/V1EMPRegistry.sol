// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IGovernance } from "@yield-sync/v1-sdk/contracts/interface/IGovernance.sol";

import { IV1EMPRegistry } from "./interface/IV1EMPRegistry.sol";


contract V1EMPRegistry is
	IV1EMPRegistry
{
	address public immutable override GOVERNANCE;

	address public override v1EMPUtility;
	address public override v1EMPArrayUtility;
	address public override v1EMPDeployer;
	address public override v1EMPStrategyDeployer;
	address public override v1EMPStrategyUtility;

	uint256 public constant override ONE_HUNDRED_PERCENT = 1e18;

	uint256 public override v1EMPIdTracker;
	uint256 public override v1EMPStrategyIdTracker;

	mapping (address eRC20 => address v1EMPERC20ETHValueFeed) public override eRC20_v1EMPERC20ETHValueFeed;

	mapping (address v1EMP => uint256 v1EMPId) public override v1EMP_v1EMPId;

	mapping (address v1EMPStrategy => uint256 v1EMPStrategyId) public override v1EMPStrategy_v1EMPStrategyId;

	mapping (uint256 v1EMPId => address v1EMP) public override v1EMPId_v1EMP;

	mapping (uint256 v1EMPStrategyId => address v1EMPStrategy) public override v1EMPStrategyId_v1EMPStrategy;


	constructor (address _governance)
	{
		GOVERNANCE = _governance;
	}


	modifier authGovernance()
	{
		require(IGovernance(GOVERNANCE).hasRole(bytes32(0), msg.sender), "!authorized");

		_;
	}


	/// @notice view


	/// @inheritdoc IV1EMPRegistry
	function governancePayTo()
		public
		view
		returns (address)
	{
		return IGovernance(GOVERNANCE).payTo();
	}


	/// @notice mutative


	/// @inheritdoc IV1EMPRegistry
	function eRC20_v1EMPERC20ETHValueFeedUpdate(address _eRC20, address _v1EMPERC20ETHValueFeed)
		public
		override
		authGovernance()
	{
		require(_eRC20 != address(0), "!(_eRC20 != address(0))");

		require(_v1EMPERC20ETHValueFeed != address(0), "!(_v1EMPERC20ETHValueFeed != address(0))");

		eRC20_v1EMPERC20ETHValueFeed[_eRC20] = _v1EMPERC20ETHValueFeed;
	}

	/// @inheritdoc IV1EMPRegistry
	function v1EMPArrayUtilityUpdate(address _v1EMPArrayUtility)
		public
		override
		authGovernance()
	{
		require(v1EMPArrayUtility == address(0), "!(v1EMPArrayUtility == address(0))");

		v1EMPArrayUtility = _v1EMPArrayUtility;
	}


	/// @inheritdoc IV1EMPRegistry
	function v1EMPDeployerUpdate(address _v1EMPDeployer)
		public
		override
		authGovernance()
	{
		require(v1EMPUtility != address(0), "!(v1EMPUtility != address(0))");

		require(v1EMPDeployer == address(0), "!(v1EMPDeployer == address(0))");

		v1EMPDeployer = _v1EMPDeployer;
	}

	/// @inheritdoc IV1EMPRegistry
	function v1EMPRegister(address _v1EMP)
		public
		override
	{
		require(v1EMPDeployer == msg.sender, "!(v1EMPDeployer == msg.sender)");

		v1EMPIdTracker++;

		v1EMP_v1EMPId[_v1EMP] = v1EMPIdTracker;
		v1EMPId_v1EMP[v1EMPIdTracker] = _v1EMP;
	}

	/// @inheritdoc IV1EMPRegistry
	function v1EMPStrategyDeployerUpdate(address _v1EMPStrategyDeployer)
		public
		override
		authGovernance()
	{
		require(v1EMPStrategyDeployer == address(0), "!(v1EMPStrategyDeployer == address(0))");

		v1EMPStrategyDeployer = _v1EMPStrategyDeployer;
	}

	/// @inheritdoc IV1EMPRegistry
	function v1EMPStrategyRegister(address _v1EMPStrategy)
		public
		override
	{
		require(v1EMPStrategyDeployer == msg.sender, "!(v1EMPStrategyDeployer == msg.sender)");

		v1EMPStrategyIdTracker++;

		v1EMPStrategy_v1EMPStrategyId[_v1EMPStrategy] = v1EMPStrategyIdTracker;
		v1EMPStrategyId_v1EMPStrategy[v1EMPStrategyIdTracker] = _v1EMPStrategy;
	}

	/// @inheritdoc IV1EMPRegistry
	function v1EMPStrategyUtilityUpdate(address _v1EMPStrategyUtility)
		public
		override
		authGovernance()
	{
		require(v1EMPArrayUtility != address(0), "!(v1EMPArrayUtility != address(0))");

		require(v1EMPStrategyUtility == address(0), "!(v1EMPStrategyUtility == address(0))");

		v1EMPStrategyUtility = _v1EMPStrategyUtility;
	}

	/// @inheritdoc IV1EMPRegistry
	function v1EMPUtilityUpdate(address _v1EMPUtility)
		public
		override
		authGovernance()
	{
		require(v1EMPArrayUtility != address(0), "!(v1EMPArrayUtility != address(0))");

		require(v1EMPUtility == address(0), "!(v1EMPUtility == address(0))");

		v1EMPUtility = _v1EMPUtility;
	}
}
