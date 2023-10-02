pragma solidity 0.8.20;


contract AssetAllocatorDeployer
{
	event AssetAllocatorDeployed();


	constructor()
		public
	{}


	function AssetAllocatorDeploy()
		public
		returns (address)
	{
		emit AssetAllocatorDeployed();
	}
}
