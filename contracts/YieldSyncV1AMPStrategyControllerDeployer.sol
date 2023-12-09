// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { YieldSyncV1AMPStrategyController } from "./YieldSyncV1AMPStrategyController.sol";


contract YieldSyncV1AMPStrategyControllerDeployer
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


	function deployYieldSyncV1AMPStrategyController(string memory _name, string memory _symbol)
		public
		payable
		returns (address yieldSyncV1AMPStrategyController_)
	{
		require(msg.value >= fee, "!msg.value");

		yieldSyncStrategyHandlerIdTracker++;

		YieldSyncV1AMPStrategyController yieldSyncV1AMPStrategyController = new YieldSyncV1AMPStrategyController(
			msg.sender,
			_name,
			_symbol
		);

		return address(yieldSyncV1AMPStrategyController);
	}
}
