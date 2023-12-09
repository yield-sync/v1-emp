// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { YieldSyncV1AMPAssetAllocator } from "./YieldSyncV1AMPAssetAllocator.sol";


contract YieldSyncV1AMPAssetAllocatorDeployer
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


	function deployYieldSyncV1AMPAssetAllocator(string memory _name, bool _onlyPrioritizedStrategy, string memory _symbol)
		public
		payable
		returns (address yieldSyncV1AMPAssetAllocator_)
	{
		require(msg.value >= fee, "!msg.value");

		YieldSyncV1AMPAssetAllocator yieldSyncV1AMPAssetAllocator = new YieldSyncV1AMPAssetAllocator(
			msg.sender,
			_onlyPrioritizedStrategy,
			_name,
			_symbol
		);

		return address(yieldSyncV1AMPAssetAllocator);
	}
}
