// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
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
    AggregatorV3Interface public immutable aggregatorV3Interface;
	IYieldSyncV1EMPStrategy public immutable yieldSyncV1EMPStrategy;


	constructor (address _aggregatorV3Interface, address _strategy)
	{
        aggregatorV3Interface = AggregatorV3Interface(_aggregatorV3Interface);
		yieldSyncV1EMPStrategy = IYieldSyncV1EMPStrategy(_strategy);
	}


	modifier onlyStrategy()
	{
		require(address(yieldSyncV1EMPStrategy) == msg.sender, "address(yieldSyncV1EMPStrategy) != msg.sender");

		_;
	}


	/// @inheritdoc IYieldSyncV1EMPStrategyInteractor
	function utilizedERC20ETHValue(address _utilizedERC20)
		public
		view
		override
		returns (uint256 utilizedERC20ETHValue_)
	{
		require(
			yieldSyncV1EMPStrategy.utilizedERC20_allocation(_utilizedERC20) > 0,
			"yieldSyncV1EMPStrategy.utilizedERC20_allocation(_utilizedERC20) = 0"
		);

		(, int256 price, , , ) = aggregatorV3Interface.latestRoundData();

		return uint256(price);
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
			require(
				yieldSyncV1EMPStrategy.utilizedERC20_allocation(_utilizedERC20[i]) > 0,
				"yieldSyncV1EMPStrategy.utilizedERC20_allocation(_utilizedERC20[i]) = 0"
			);

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
			IERC20(_utilizedERC20[i]).safeTransferFrom(_from, address(this), _utilizedERC20Amount[i]);
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
