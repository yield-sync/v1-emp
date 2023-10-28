// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { IYieldSyncV1Strategy } from "../interface/IYieldSyncV1Strategy.sol";


contract Strategy is
	IYieldSyncV1Strategy,
	ERC20
{
	address[] internal _utilizedToken;


	mapping (address token => bool utilized) internal _token_utilized;


	constructor (string memory name, string memory symbol)
		ERC20(name, symbol)
	{}


	/// @inheritdoc IYieldSyncV1Strategy
	function positionValueInEth()
		public
		view
		override
		returns (uint256 positionValueInEth_)
	{
		return balanceOf(msg.sender);
	}

	/// @inheritdoc IYieldSyncV1Strategy
	function token_utilized(address _token)
		public
		view
		override
		returns (bool utilized_)
	{
		return _token_utilized[_token];
	}

	/// @inheritdoc IYieldSyncV1Strategy
	function utilizedToken()
		public
		view
		override
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
