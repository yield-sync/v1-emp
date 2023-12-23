// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract MockERC206 is ERC20
{
	constructor ()
		ERC20("MockERC206", "MOCKERC206")
	{
		_mint(msg.sender, 100_000_000);
	}

	function decimals()
		public
		view
		virtual
		override
		returns (uint8)
	{
		return 6;
    }
}
