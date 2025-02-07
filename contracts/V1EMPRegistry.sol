// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IGovernance } from "@yield-sync/governance/contracts/interface/IGovernance.sol";

import { IV1EMPRegistry } from "./interface/IV1EMPRegistry.sol";


contract V1EMPRegistry is
	IV1EMPRegistry
{
	address internal _addressArrayUtility;
	address internal _governance;
	address internal _v1EMPUtility;
	address internal _v1EMPDeployer;
	address internal _v1EMPStrategyDeployer;
	address internal _v1EMPStrategyUtility;

	uint256 public constant override ONE_HUNDRED_PERCENT = 1e18;

	uint256 public override v1EMPIdTracker;
	uint256 public override v1EMPStrategyIdTracker;

	mapping (address eRC20 => address eRC20ETHValueProvider) public override eRC20_eRC20ETHValueProvider;

	mapping (address v1EMP => uint256 v1EMPId) public override v1EMP_v1EMPId;

	mapping (address v1EMPStrategy => uint256 v1EMPStrategyId) public override v1EMPStrategy_v1EMPStrategyId;

	mapping (uint256 v1EMPId => address v1EMP) public override v1EMPId_v1EMP;

	mapping (uint256 v1EMPStrategyId => address v1EMPStrategy) public override v1EMPStrategyId_v1EMPStrategy;


	constructor (address __governance)
	{
		_governance = __governance;
	}


	modifier authGovernance()
	{
		_authGovernance();

		_;
	}


	/// @notice internal


	function _authGovernance()
		internal
		view
	{
		require(IGovernance(_governance).hasRole(bytes32(0), msg.sender), "!authorized");
	}


	/// @notice view


	/// @inheritdoc IV1EMPRegistry
	function addressArrayUtility()
		public
		view
		override
		returns(address)
	{
		return _addressArrayUtility;
	}

	/// @inheritdoc IV1EMPRegistry
	function governancePayTo()
		public
		view
		returns (address)
	{
		return IGovernance(_governance).payTo();
	}

	/// @inheritdoc IV1EMPRegistry
	function governance()
		public
		view
		override
		returns(address)
	{
		return _governance;
	}


	/// @inheritdoc IV1EMPRegistry
	function v1EMPDeployer()
		public
		view
		override
		returns(address)
	{
		return _v1EMPDeployer;
	}

	/// @inheritdoc IV1EMPRegistry
	function v1EMPStrategyDeployer()
		public
		view
		override
		returns(address)
	{
		return _v1EMPStrategyDeployer;
	}

	/// @inheritdoc IV1EMPRegistry
	function v1EMPStrategyUtility()
		public
		view
		override
		returns(address)
	{
		return _v1EMPStrategyUtility;
	}

	/// @inheritdoc IV1EMPRegistry
	function v1EMPUtility()
		public
		view
		override
		returns(address)
	{
		return _v1EMPUtility;
	}


	/// @notice mutative


	/// @inheritdoc IV1EMPRegistry
	function addressArrayUtilityUpdate(address __addressArrayUtility)
		public
		override
		authGovernance()
	{
		require(__addressArrayUtility != address(0), "__addressArrayUtility == address(0)");

		require(_addressArrayUtility == address(0), "_addressArrayUtility != address(0)");

		_addressArrayUtility = __addressArrayUtility;
	}

	/// @inheritdoc IV1EMPRegistry
	function eRC20_eRC20ETHValueProviderUpdate(address _eRC20, address _eRC20ETHValueProvider)
		public
		override
		authGovernance()
	{
		require(_eRC20 != address(0), "_eRC20 == address(0)");

		require(_eRC20ETHValueProvider != address(0), "_eRC20ETHValueProvider == address(0)");

		eRC20_eRC20ETHValueProvider[_eRC20] = _eRC20ETHValueProvider;
	}

	/// @inheritdoc IV1EMPRegistry
	function governanceUpdate(address __governance)
		public
		override
		authGovernance()
	{
		require(__governance != address(0), "__governance == address(0)");

		_governance = __governance;
	}

	/// @inheritdoc IV1EMPRegistry
	function v1EMPDeployerUpdate(address __v1EMPDeployer)
		public
		override
		authGovernance()
	{
		require(__v1EMPDeployer != address(0), "__v1EMPDeployer == address(0)");

		require(_v1EMPUtility != address(0), "_v1EMPUtility == address(0)");

		require(_v1EMPDeployer == address(0), "_v1EMPDeployer != address(0)");

		_v1EMPDeployer = __v1EMPDeployer;
	}

	/// @inheritdoc IV1EMPRegistry
	function v1EMPRegister(address _v1EMP)
		public
		override
	{
		require(_v1EMPDeployer == msg.sender, "_v1EMPDeployer != msg.sender");

		v1EMPIdTracker++;

		v1EMP_v1EMPId[_v1EMP] = v1EMPIdTracker;
		v1EMPId_v1EMP[v1EMPIdTracker] = _v1EMP;
	}

	/// @inheritdoc IV1EMPRegistry
	function v1EMPStrategyDeployerUpdate(address __v1EMPStrategyDeployer)
		public
		override
		authGovernance()
	{
		require(__v1EMPStrategyDeployer != address(0), "__v1EMPStrategyDeployer == address(0)");

		require(_v1EMPStrategyDeployer == address(0), "_v1EMPStrategyDeployer != address(0)");

		_v1EMPStrategyDeployer = __v1EMPStrategyDeployer;
	}

	/// @inheritdoc IV1EMPRegistry
	function v1EMPStrategyRegister(address _v1EMPStrategy)
		public
		override
	{
		require(_v1EMPStrategyDeployer == msg.sender, "_v1EMPStrategyDeployer != msg.sender");

		v1EMPStrategyIdTracker++;

		v1EMPStrategy_v1EMPStrategyId[_v1EMPStrategy] = v1EMPStrategyIdTracker;
		v1EMPStrategyId_v1EMPStrategy[v1EMPStrategyIdTracker] = _v1EMPStrategy;
	}

	/// @inheritdoc IV1EMPRegistry
	function v1EMPStrategyUtilityUpdate(address __v1EMPStrategyUtility)
		public
		override
		authGovernance()
	{
		require(__v1EMPStrategyUtility != address(0), "__v1EMPStrategyUtility == address(0)");

		require(_addressArrayUtility != address(0), "_addressArrayUtility == address(0)");

		require(_v1EMPStrategyUtility == address(0), "_v1EMPStrategyUtility != address(0)");

		_v1EMPStrategyUtility = __v1EMPStrategyUtility;
	}

	/// @inheritdoc IV1EMPRegistry
	function v1EMPUtilityUpdate(address __v1EMPUtility)
		public
		override
		authGovernance()
	{
		require(__v1EMPUtility != address(0), "__v1EMPUtility == address(0)");

		require(_addressArrayUtility != address(0), "_addressArrayUtility == address(0)");

		require(_v1EMPUtility == address(0), "_v1EMPUtility != address(0)");

		_v1EMPUtility = __v1EMPUtility;
	}
}
