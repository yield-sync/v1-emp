
// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IERC20, ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { Allocation, IYieldSyncV1Strategy } from "./interface/IYieldSyncV1Strategy.sol";


contract YieldSyncV1Strategy is
	IYieldSyncV1Strategy
{
	address public immutable STRATEGY;

	address[] internal _utilizedToken;


	mapping (address token => bool utilized) internal _token_utilized;

	mapping (address token => Allocation allocation) internal _token_allocation;


	receive ()
		external
		payable
	{}


	fallback ()
		external
		payable
	{}


	constructor (address _STRATEGY)
	{
		STRATEGY = _STRATEGY;
	}


	function utilizedTokensDeposit(uint256[] memory _amount)
		public
		override
	{
		// TODO: Make non-reenterance

		require(_amount.length == _utilizedToken.length, "!_amount.length");

		for (uint256 i = 0; i < _amount.length; i++)
		{
			// Approve the STRATEGY to spend each token
			IERC20(_utilizedToken[i]).approve(STRATEGY, _amount[i]);
		}

		(bool success, ) = STRATEGY.delegatecall(
			abi.encodeWithSignature("utilizedTokensDeposit(address[], uint256[])", _utilizedToken, _amount)
		);

		require(success, "!success");
	}

	function utilizedTokensWithdraw(uint256[] memory _amount)
		public
		override
	{
		// TODO: Make non-reenterance

		require(_amount.length == _utilizedToken.length, "!_amount.length");

		for (uint256 i = 0; i < _amount.length; i++)
		{
			// Approve the STRATEGY to spend each token
			IERC20(_utilizedToken[i]).approve(STRATEGY, _amount[i]);
		}

		(bool success, ) = STRATEGY.delegatecall(
			abi.encodeWithSignature("utilizedTokensDeposit(address[], uint256[])", _utilizedToken, _amount)
		);

		require(success, "!success");
	}
}
