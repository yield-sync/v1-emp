// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { YieldSyncV1AssetAllocator } from "./YieldSyncV1AssetAllocator.sol";


contract YieldSyncV1AssetAllocatorDeployer
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


	function deployYieldSyncV1AssetAllocator()
		public
		payable
		returns (address deployedYieldSyncV1Vault)
	{
		require(msg.value >= fee, "!msg.value");

		YieldSyncV1AssetAllocator yieldSyncV1AssetAllocator = new YieldSyncV1AssetAllocator(
			msg.sender
		);

		return address(yieldSyncV1AssetAllocator);

	}
}
