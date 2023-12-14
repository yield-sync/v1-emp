// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IAccessControlEnumerable } from "@openzeppelin/contracts/access/IAccessControlEnumerable.sol";

import { YieldSyncV1AMPStrategy } from "./YieldSyncV1AMPStrategy.sol";


contract YieldSyncV1AMPStrategyDeployer
{
	receive ()
		external
		payable
	{}


	fallback ()
		external
		payable
	{}


	address public immutable YieldSyncGovernance;

	uint256 public fee;
	uint256 public yieldSyncStrategyHandlerIdTracker;


	mapping (
		address yieldSyncV1AMPStrategy => uint256 yieldSyncV1AMPStrategyId
	) public yieldSyncV1AMPStrategy_yieldSyncV1AMPStrategyId;

	mapping (
		uint256 yieldSyncV1AMPStrategyId => address yieldSyncV1AMPStrategy
	) public yieldSyncV1AMPStrategyId_yieldSyncV1AMPStrategy;


	modifier contractYieldSyncGovernance(bytes32 _role)
	{
		require(IAccessControlEnumerable(YieldSyncGovernance).hasRole(_role, msg.sender), "!auth");

		_;
	}


	constructor (address _YieldSyncGovernance)
	{
		fee = 0;
		yieldSyncStrategyHandlerIdTracker = 0;

		YieldSyncGovernance = _YieldSyncGovernance;
	}


	function deployYieldSyncV1AMPStrategy(string memory _name, string memory _symbol)
		public
		payable
		returns (address yieldSyncV1AMPStrategy_)
	{
		require(msg.value >= fee, "!msg.value");

		yieldSyncStrategyHandlerIdTracker++;

		yieldSyncV1AMPStrategy_ = address(new YieldSyncV1AMPStrategy(msg.sender, _name, _symbol));

		yieldSyncV1AMPStrategy_yieldSyncV1AMPStrategyId[yieldSyncV1AMPStrategy_] = yieldSyncStrategyHandlerIdTracker;
		yieldSyncV1AMPStrategyId_yieldSyncV1AMPStrategy[yieldSyncStrategyHandlerIdTracker] = yieldSyncV1AMPStrategy_;
	}

	function feeUpdate(uint256 _fee)
		public
		contractYieldSyncGovernance(bytes32(0))
	{
		fee = _fee;
	}
}
