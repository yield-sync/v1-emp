// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IYieldSyncV1EMPStrategy } from "../interface/IYieldSyncV1EMPStrategy.sol";
import { IYieldSyncV1EMPStrategyInteractor } from "../interface/IYieldSyncV1EMPStrategyInteractor.sol";
import { IERC20 } from "../interface/IYieldSyncV1EMPStrategy.sol";


/**
* @notice Empty strategy interactor. This contract does not deposit tokens into a protocol.
*/
contract StrategyInteractorBlank is
	IYieldSyncV1EMPStrategyInteractor
{
	IYieldSyncV1EMPStrategy public immutable YIELD_SYNC_V1_EMP_STRATEGY;


	constructor (address _strategy)
	{
		YIELD_SYNC_V1_EMP_STRATEGY = IYieldSyncV1EMPStrategy(_strategy);
	}


	modifier onlyStrategy()
	{
		require(address(YIELD_SYNC_V1_EMP_STRATEGY) == msg.sender, "address(YIELD_SYNC_V1_EMP_STRATEGY) != msg.sender");

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
		IERC20(__utilizedERC20).transferFrom(_from, address(this), _utilizedERC20Amount);
	}

	/// @inheritdoc IYieldSyncV1EMPStrategyInteractor
	function utilizedERC20Withdraw(address _to, address __utilizedERC20, uint256 _utilizedERC20Amount)
		public
		override
		onlyStrategy()
	{
		IERC20(__utilizedERC20).transfer(_to, _utilizedERC20Amount);
	}
}
