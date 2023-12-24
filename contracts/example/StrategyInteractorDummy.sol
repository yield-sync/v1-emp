// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { IYieldSyncV1AMPStrategyInteractor } from "../interface/IYieldSyncV1AMPStrategyInteractor.sol";
import { IERC20, SafeERC20 } from "../interface/IYieldSyncV1AMPStrategy.sol";


using SafeERC20 for IERC20;


/**
* @notice THIS IS A DANGEROUS CONTRACT MEANT ONLY FOR TESTING
* This contract lacks authorization and all functions can be called from anyone. Balances on this smart contract are not
* safe.
* The purpose of this contract is strictly for testing.
*/
contract StrategyInteractorDummy is
	IYieldSyncV1AMPStrategyInteractor
{
	/// @inheritdoc IYieldSyncV1AMPStrategyInteractor
	function eRC20ETHValue(address _eRC20)
		public
		view
		override
		returns (uint256 eRC20ETHValue_)
	{
		// Must return decimals 18
		return 10 ** 18;
	}

	/// @inheritdoc IYieldSyncV1AMPStrategyInteractor
	function eRC20TotalAmount(address[] memory _eRC20)
		public
		view
		override
		returns (uint256[] memory eRC20TotalAmount_)
	{
		eRC20TotalAmount_ = new uint256[](_eRC20.length);

		for (uint256 i = 0; i < _eRC20.length; i++)
		{
			eRC20TotalAmount_[i] += IERC20(_eRC20[i]).balanceOf(address(this));
		}
	}


	/// @inheritdoc IYieldSyncV1AMPStrategyInteractor
	function eRC20Deposit(address _from, address[] memory _eRC20, uint256[] memory _eRC20Amount)
		public
		override
	{
		for (uint256 i = 0; i < _eRC20.length; i++)
		{
			IERC20(_eRC20[i]).safeTransferFrom(_from, address(this), _eRC20Amount[i]);
		}
	}

	/// @inheritdoc IYieldSyncV1AMPStrategyInteractor
	function eRC20Withdraw(address _to, address[] memory _eRC20, uint256[] memory _eRC20Amount)
		public
		override
	{
		for (uint256 i = 0; i < _eRC20.length; i++)
		{
			IERC20(_eRC20[i]).safeTransfer(_to, _eRC20Amount[i]);
		}
	}
}