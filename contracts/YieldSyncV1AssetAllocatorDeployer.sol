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


	address public immutable YieldSyncGovernance;

	uint256 public fee;
	uint256 public yieldSyncAssetAllocatorIdTracker;


	constructor (address _YieldSyncGovernance)
	{
		fee = 0;
		yieldSyncAssetAllocatorIdTracker = 0;

		YieldSyncGovernance = _YieldSyncGovernance;
	}


	function deployYieldSyncV1AssetAllocator(string memory _name, bool _onlyPrioritizedStrategy, string memory _symbol)
		public
		payable
		returns (address yieldSyncV1AssetAllocator_)
	{
		require(msg.value >= fee, "!msg.value");

		YieldSyncV1AssetAllocator yieldSyncV1AssetAllocator = new YieldSyncV1AssetAllocator(
			msg.sender,
			_onlyPrioritizedStrategy,
			_name,
			_symbol
		);

		return address(yieldSyncV1AssetAllocator);
	}
}
