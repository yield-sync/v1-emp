// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { IYieldSyncV1EMPStrategy } from "../interface/IYieldSyncV1EMPStrategy.sol";
import { IYieldSyncV1EMPStrategyInteractor } from "../interface/IYieldSyncV1EMPStrategyInteractor.sol";
import { IERC20, SafeERC20 } from "../interface/IYieldSyncV1EMPStrategy.sol";


using SafeERC20 for IERC20;


/**
* @notice Empty strategy interactor. This contract does not deposit tokens into a protocol.
*/
contract StrategyInteractorBlank is
	IYieldSyncV1EMPStrategyInteractor
{
	IYieldSyncV1EMPStrategy public immutable yieldSyncV1EMPStrategy;


	constructor (address _strategy)
	{
		yieldSyncV1EMPStrategy = IYieldSyncV1EMPStrategy(_strategy);
	}


	modifier onlyStrategy()
	{
		require(address(yieldSyncV1EMPStrategy) == msg.sender, "address(yieldSyncV1EMPStrategy) != msg.sender");

		_;
	}


	/// @inheritdoc IYieldSyncV1EMPStrategyInteractor
	function utilizedERC20TotalAmount(address __utilizedERC20)
		public
		view
		override
		returns (uint256 utilizedERC20TotalAmount_)
	{
		return IERC20(__utilizedERC20).balanceOf(address(this));
	}


	/// @inheritdoc IYieldSyncV1EMPStrategyInteractor
	function utilizedERC20Deposit(address _from, address __utilizedERC20, uint256 _utilizedERC20Amount)
		public
		override
		onlyStrategy()
	{
		return IERC20(__utilizedERC20).safeTransferFrom(_from, address(this), _utilizedERC20Amount);
	}

	/// @inheritdoc IYieldSyncV1EMPStrategyInteractor
	function utilizedERC20Withdraw(address _to, address __utilizedERC20, uint256 _utilizedERC20Amount)
		public
		override
		onlyStrategy()
	{
		return IERC20(__utilizedERC20).safeTransfer(_to, _utilizedERC20Amount);
	}
}
