// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IAccessControlEnumerable } from "@openzeppelin/contracts/access/IAccessControlEnumerable.sol";

import { IYieldSyncV1EMPStrategyDeployer } from "./interface/IYieldSyncV1EMPStrategyDeployer.sol";
import { YieldSyncV1EMPStrategy } from "./YieldSyncV1EMPStrategy.sol";


contract YieldSyncV1EMPStrategyDeployer is
	IYieldSyncV1EMPStrategyDeployer
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
		address yieldSyncV1EMPStrategy => uint256 yieldSyncV1EMPStrategyId
	) public yieldSyncV1EMPStrategy_YSSId;

	mapping (
		uint256 yieldSyncV1EMPStrategyId => address yieldSyncV1EMPStrategy
	) public yieldSyncV1EMPStrategyId_YSS;


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


	function deployYieldSyncV1EMPStrategy(string memory _name, string memory _symbol)
		public
		payable
		returns (address yieldSyncV1EMPStrategy_)
	{
		require(msg.value >= fee, "!msg.value");

		yieldSyncStrategyHandlerIdTracker++;

		yieldSyncV1EMPStrategy_ = address(new YieldSyncV1EMPStrategy(msg.sender, _name, _symbol));

		yieldSyncV1EMPStrategy_YSSId[yieldSyncV1EMPStrategy_] = yieldSyncStrategyHandlerIdTracker;
		yieldSyncV1EMPStrategyId_YSS[yieldSyncStrategyHandlerIdTracker] = yieldSyncV1EMPStrategy_;
	}

	function feeUpdate(uint256 _fee)
		public
		contractYieldSyncGovernance(bytes32(0))
	{
		fee = _fee;
	}
}
