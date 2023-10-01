pragma solidity 0.8.20;


contract VaultFactory
{
	event NewVault(address vault);


	constructor()
		public
	{}


	function createVault()
		public
		returns (address)
	{
		emit NewVault(address(0));
	}
}
