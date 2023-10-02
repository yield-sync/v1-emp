// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { AssetAllocator } from "./AssetAllocator.sol";
import { IAssetAllocatorDeployer } from "./interface/IAssetAllocatorDeployer.sol";


contract AssetAllocatorDeployer is
	IAssetAllocatorDeployer
{
	address public immutable YieldSyncGovernance;


	constructor (address _YieldSyncGovernance)
	{
		YieldSyncGovernance = _YieldSyncGovernance;
	}


	function AssetAllocatorDeploy()
		public
		returns (address deployedAssetAllocator)
	{
		AssetAllocator assetAllocator = new AssetAllocator();

		emit AssetAllocatorDeployed(address(assetAllocator));

		return address(assetAllocator);
	}
}
