// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { IYieldSyncV1AMPStrategy } from "../interface/IYieldSyncV1AMPStrategy.sol";
import { IYieldSyncV1AMPStrategyInteractor } from "../interface/IYieldSyncV1AMPStrategyInteractor.sol";
import { IERC20, SafeERC20 } from "../interface/IYieldSyncV1AMPStrategy.sol";


using SafeERC20 for IERC20;


/**
* @notice Empty strategy interactor. This contract does not deposit tokens into any protocol
*/
contract StrategyInteractorBlank is
	IYieldSyncV1AMPStrategyInteractor
{
	IYieldSyncV1AMPStrategy public immutable yieldSyncV1AMPStrategy;


	constructor (address _strategy)
	{
		yieldSyncV1AMPStrategy = IYieldSyncV1AMPStrategy(_strategy);
	}


	modifier onlyStrategy()
	{
		require(address(yieldSyncV1AMPStrategy) == msg.sender, "address(yieldSyncV1AMPStrategy) != msg.sender");

		_;
	}


	/// @inheritdoc IYieldSyncV1AMPStrategyInteractor
	function eRC20ETHValue(address _eRC20)
		public
		view
		override
		returns (uint256 eRC20ETHValue_)
	{
		require(
			yieldSyncV1AMPStrategy.utilizedERC20_allocation(_eRC20) > 0,
			"yieldSyncV1AMPStrategy.utilizedERC20_allocation(_eRC20) = 0"
		);

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
			require(
				yieldSyncV1AMPStrategy.utilizedERC20_allocation(_eRC20[i]) > 0,
				"yieldSyncV1AMPStrategy.utilizedERC20_allocation(_eRC20[i]) = 0"
			);

			eRC20TotalAmount_[i] += IERC20(_eRC20[i]).balanceOf(address(this));
		}
	}


	/// @inheritdoc IYieldSyncV1AMPStrategyInteractor
	function eRC20Deposit(address _from, address[] memory _eRC20, uint256[] memory _eRC20Amount)
		public
		override
		onlyStrategy()
	{
		for (uint256 i = 0; i < _eRC20.length; i++)
		{
			require(
				yieldSyncV1AMPStrategy.utilizedERC20_allocation(_eRC20[i]) > 0,
				"yieldSyncV1AMPStrategy.utilizedERC20_allocation(_eRC20[i]) = 0"
			);

			IERC20(_eRC20[i]).safeTransferFrom(_from, address(this), _eRC20Amount[i]);
		}
	}

	/// @inheritdoc IYieldSyncV1AMPStrategyInteractor
	function eRC20Withdraw(address _to, address[] memory _eRC20, uint256[] memory _eRC20Amount)
		public
		override
		onlyStrategy()
	{
		for (uint256 i = 0; i < _eRC20.length; i++)
		{
			require(
				yieldSyncV1AMPStrategy.utilizedERC20_allocation(_eRC20[i]) > 0,
				"yieldSyncV1AMPStrategy.utilizedERC20_allocation(_eRC20[i]) = 0"
			);

			IERC20(_eRC20[i]).safeTransfer(_to, _eRC20Amount[i]);
		}
	}
}
