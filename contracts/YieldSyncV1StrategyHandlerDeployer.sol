// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { YieldSyncV1StrategyHandler } from "./YieldSyncV1StrategyHandler.sol";


contract YieldSyncV1StrategyHandlerDeployer
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


	function deployYieldSyncV1StrategyHandler(address _STRATEGY, string memory _name, string memory _symbol)
		public
		payable
		returns (address yieldSyncV1StrategyHandler_)
	{
		require(msg.value >= fee, "!msg.value");

		yieldSyncStrategyHandlerIdTracker++;

		YieldSyncV1StrategyHandler yieldSyncV1StrategyHandler = new YieldSyncV1StrategyHandler(
			_STRATEGY,
			_name,
			_symbol
		);

		return address(yieldSyncV1StrategyHandler);
	}
}
