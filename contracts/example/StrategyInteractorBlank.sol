// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IV1EMPStrategy } from "../interface/IV1EMPStrategy.sol";
import { IV1EMPStrategyInteractor } from "../interface/IV1EMPStrategyInteractor.sol";
import { IERC20 } from "../interface/IV1EMPStrategy.sol";


/**
* @notice Empty strategy interactor. This contract does not deposit tokens into a protocol.
*/
contract StrategyInteractorBlank is
	IV1EMPStrategyInteractor
{
	IV1EMPStrategy public immutable V1_EMP_STRATEGY;


	constructor (address _strategy)
	{
		V1_EMP_STRATEGY = IV1EMPStrategy(_strategy);
	}


	modifier onlyStrategy()
	{
		require(address(V1_EMP_STRATEGY) == msg.sender, "address(V1_EMP_STRATEGY) != msg.sender");

		_;
	}


	/// @inheritdoc IV1EMPStrategyInteractor
	function utilizedERC20TotalAmount(address __utilizedERC20)
		public
		view
		override
		returns (uint256 utilizedERC20TotalAmount_)
	{
		return IERC20(__utilizedERC20).balanceOf(address(this));
	}


	/// @inheritdoc IV1EMPStrategyInteractor
	function utilizedERC20Deposit(address _from, address __utilizedERC20, uint256 _utilizedERC20Amount)
		public
		override
		onlyStrategy()
	{
		IERC20(__utilizedERC20).transferFrom(_from, address(this), _utilizedERC20Amount);
	}

	/// @inheritdoc IV1EMPStrategyInteractor
	function utilizedERC20Withdraw(address _to, address __utilizedERC20, uint256 _utilizedERC20Amount)
		public
		override
		onlyStrategy()
	{
		IERC20(__utilizedERC20).transfer(_to, _utilizedERC20Amount);
	}
}
