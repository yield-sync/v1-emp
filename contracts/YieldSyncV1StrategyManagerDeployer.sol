// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { YieldSyncV1StrategyManager } from "./YieldSyncV1StrategyManager.sol";


contract YieldSyncV1StrategyManagerDeployer
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


	constructor (address _YieldSyncGovernance)
	{
		fee = 0;
		yieldSyncStrategyHandlerIdTracker = 0;

		YieldSyncGovernance = _YieldSyncGovernance;
	}


	function deployYieldSyncV1StrategyManager(string memory _name, string memory _symbol)
		public
		payable
		returns (address yieldSyncV1StrategyManager_)
	{
		require(msg.value >= fee, "!msg.value");

		yieldSyncStrategyHandlerIdTracker++;

		YieldSyncV1StrategyManager yieldSyncV1StrategyManager = new YieldSyncV1StrategyManager(
			msg.sender,
			_name,
			_symbol
		);

		return address(yieldSyncV1StrategyManager);
	}
}
