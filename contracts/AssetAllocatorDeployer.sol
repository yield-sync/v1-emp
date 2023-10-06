// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


contract AssetAllocatorFactory
{
	receive ()
		external
		payable
	{}


	fallback ()
		external
		payable
	{}


	uint256 public fee;
	uint256 public YieldSyncAssetAllocatorIdTracker;


	address public immutable YieldSyncGovernance;


	constructor (address _YieldSyncGovernance)
	{
		fee = 0;
		YieldSyncAssetAllocatorIdTracker = 0;

		YieldSyncGovernance = _YieldSyncGovernance;
	}
}
