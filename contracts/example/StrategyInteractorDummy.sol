// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { IYieldSyncV1EMPStrategyInteractor } from "../interface/IYieldSyncV1EMPStrategyInteractor.sol";
import { IERC20, SafeERC20 } from "../interface/IYieldSyncV1EMPStrategy.sol";


using SafeERC20 for IERC20;


/**
* @notice THIS IS A DANGEROUS CONTRACT MEANT ONLY FOR TESTING
* This contract lacks authorization and all functions can be called from anyone. Balances on this smart contract are not
* safe.
* The purpose of this contract is strictly for testing.
*/
contract StrategyInteractorDummy is
	IYieldSyncV1EMPStrategyInteractor
{
	/// @inheritdoc IYieldSyncV1EMPStrategyInteractor
	function utilizedERC20ETHValue(address _utilizedERC20)
		public
		view
		override
		returns (uint256 utilizedERC20ETHValue_)
	{
		// Must return decimals 18
		return 10 ** 18;
	}

	/// @inheritdoc IYieldSyncV1EMPStrategyInteractor
	function utilizedERC20TotalAmount(address[] memory _utilizedERC20)
		public
		view
		override
		returns (uint256[] memory utilizedERC20TotalAmount_)
	{
		utilizedERC20TotalAmount_ = new uint256[](_utilizedERC20.length);

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			utilizedERC20TotalAmount_[i] += IERC20(_utilizedERC20[i]).balanceOf(address(this));
		}
	}


	/// @inheritdoc IYieldSyncV1EMPStrategyInteractor
	function utilizedERC20Deposit(address _from, address[] memory _utilizedERC20, uint256[] memory _utilizedERC20Amount)
		public
		override
	{
		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			IERC20(_utilizedERC20[i]).safeTransferFrom(_from, address(this), _utilizedERC20Amount[i]);
		}
	}

	/// @inheritdoc IYieldSyncV1EMPStrategyInteractor
	function utilizedERC20Withdraw(address _to, address[] memory _utilizedERC20, uint256[] memory _utilizedERC20Amount)
		public
		override
	{
		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			IERC20(_utilizedERC20[i]).safeTransfer(_to, _utilizedERC20Amount[i]);
		}
	}
}
