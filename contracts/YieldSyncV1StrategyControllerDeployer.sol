// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { YieldSyncV1StrategyController } from "./YieldSyncV1StrategyController.sol";


contract YieldSyncV1StrategyControllerDeployer
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


	function deployYieldSyncV1StrategyController(string memory _name, string memory _symbol)
		public
		payable
		returns (address yieldSyncV1StrategyController_)
	{
		require(msg.value >= fee, "!msg.value");

		yieldSyncStrategyHandlerIdTracker++;

		YieldSyncV1StrategyController yieldSyncV1StrategyController = new YieldSyncV1StrategyController(
			msg.sender,
			_name,
			_symbol
		);

		return address(yieldSyncV1StrategyController);
	}
}