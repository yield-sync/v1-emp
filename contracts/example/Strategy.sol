// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract Strategy is
	ERC20
{
	address[] internal _utilizedToken;


	constructor (string memory name, string memory symbol)
		ERC20(name, symbol)
	{}


	function utilizedToken()
		public
		view
		returns (address[] memory)
	{
		return _utilizedToken;
	}


	function allocate()
		public
	{}

	function deallocate()
		public
	{}
}
