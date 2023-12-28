// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { IYieldSyncV1EMPStrategy, Purpose } from "../interface/IYieldSyncV1EMPStrategy.sol";
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
	function utilizedERC20TotalAmount(address[] memory _utilizedERC20)
		public
		view
		override
		returns (uint256[] memory utilizedERC20TotalAmount_)
	{
		utilizedERC20TotalAmount_ = new uint256[](_utilizedERC20.length);

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			Purpose memory purpose = yieldSyncV1EMPStrategy.utilizedERC20_purpose(_utilizedERC20[i]);

			require(purpose.deposit || purpose.withdraw, "!purpose.deposit && !purpose.withdraw");

			utilizedERC20TotalAmount_[i] += IERC20(_utilizedERC20[i]).balanceOf(address(this));
		}
	}


	/// @inheritdoc IYieldSyncV1EMPStrategyInteractor
	function utilizedERC20Deposit(address _from, address[] memory _utilizedERC20, uint256[] memory _utilizedERC20Amount)
		public
		override
		onlyStrategy()
	{
		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			if (yieldSyncV1EMPStrategy.utilizedERC20_purpose(_utilizedERC20[i]).deposit)
			{
				IERC20(_utilizedERC20[i]).safeTransferFrom(_from, address(this), _utilizedERC20Amount[i]);
			}
		}
	}

	/// @inheritdoc IYieldSyncV1EMPStrategyInteractor
	function utilizedERC20Withdraw(address _to, address[] memory _utilizedERC20, uint256[] memory _utilizedERC20Amount)
		public
		override
		onlyStrategy()
	{
		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			IERC20(_utilizedERC20[i]).safeTransfer(_to, _utilizedERC20Amount[i]);
		}
	}
}
