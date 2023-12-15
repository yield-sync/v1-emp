// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { YieldSyncV1AMP } from "./YieldSyncV1AMP.sol";


contract YieldSyncV1AMPDeployer
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
	uint256 public yieldSyncAssetAllocatorIdTracker;


	constructor (address _YieldSyncGovernance)
	{
		fee = 0;
		yieldSyncAssetAllocatorIdTracker = 0;

		YieldSyncGovernance = _YieldSyncGovernance;
	}


	function deployYieldSyncV1AMP(string memory _name, bool _onlyPrioritizedStrategy, string memory _symbol)
		public
		payable
		returns (address yieldSyncV1AMP_)
	{
		require(msg.value >= fee, "!msg.value");

		YieldSyncV1AMP yieldSyncV1AMP = new YieldSyncV1AMP(
			msg.sender,
			_onlyPrioritizedStrategy,
			_name,
			_symbol
		);

		return address(yieldSyncV1AMP);
	}
}
