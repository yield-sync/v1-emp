// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IYieldSyncV1EMPStrategyInteractor } from "../interface/IYieldSyncV1EMPStrategyInteractor.sol";
import { IERC20 } from "../interface/IYieldSyncV1EMPStrategy.sol";


/**
* @notice THIS IS A DANGEROUS CONTRACT MEANT ONLY FOR TESTING
* This contract lacks authorization and all functions can be called from anyone. Balances on this smart contract are not
* safe.
* The purpose of this contract is strictly for testing.
*/
contract StrategyInteractorDummy is
	IYieldSyncV1EMPStrategyInteractor
{
	/**
	* @dev This function is supposed to remain in this contract because their is no standard way of determining the balance
	* of a wallet's position. Every protocol has its own unique way of keeping track of balance.
	* For example an LP tokens could be utilized or an internal mapping integar.
	*/
	/// @inheritdoc IYieldSyncV1EMPStrategyInteractor
	function utilizedERC20TotalAmount(address __utilizedERC20)
		public
		view
		override
		returns (uint256 utilizedERC20TotalAmount_)
	{
		utilizedERC20TotalAmount_ = IERC20(__utilizedERC20).balanceOf(address(this));
	}

	/// @inheritdoc IYieldSyncV1EMPStrategyInteractor
	function utilizedERC20Deposit(address _from, address __utilizedERC20, uint256 _utilizedERC20Amount)
		public
		override
	{
		IERC20(__utilizedERC20).transferFrom(_from, address(this), _utilizedERC20Amount);
	}

	/// @inheritdoc IYieldSyncV1EMPStrategyInteractor
	function utilizedERC20Withdraw(address _to, address __utilizedERC20, uint256 _utilizedERC20Amount)
		public
		override
	{
		IERC20(__utilizedERC20).transfer(_to, _utilizedERC20Amount);
	}
}
