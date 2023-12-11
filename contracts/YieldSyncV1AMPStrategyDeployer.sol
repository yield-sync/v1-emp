// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


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

		YieldSyncV1AMPStrategy yieldSyncV1AMPStrategy = new YieldSyncV1AMPStrategy(
			msg.sender,
			_name,
			_symbol
		);

		return address(yieldSyncV1AMPStrategy);
	}
}
