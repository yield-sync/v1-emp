// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import { IYieldSyncV1EMP, IYieldSyncV1EMPStrategy, UtilizedYieldSyncV1EMPStrategy } from "./interface/IYieldSyncV1EMP.sol";


using SafeERC20 for ERC20;


contract YieldSyncV1EMP is
	ERC20,
	IYieldSyncV1EMP
{
	address public override manager;

	uint256 public constant override INITIAL_MINT_RATE = 100;
	uint256 public constant override ONE_HUNDRED_PERCENT = 1e18;

	UtilizedYieldSyncV1EMPStrategy[] internal _utilizedYieldSyncV1EMPStrategy;


	constructor (address _manager, string memory _name, string memory _symbol)
		ERC20(_name, _symbol)
	{
		manager = _manager;
	}


	modifier authManager()
	{
		require(msg.sender == manager, "!(manager == msg.sender)");

		_;
	}


	/// @inheritdoc IYieldSyncV1EMP
	function utilizedYieldSyncV1EMPStrategy()
		external
		view
		returns (UtilizedYieldSyncV1EMPStrategy[] memory)
	{
		return _utilizedYieldSyncV1EMPStrategy;
	}


	function depositTokens(uint256[][] memory _utilizedERC20Amount)
		public
	{
		uint256 _utilizedERC20ETHValueTotal = 0;

		uint256[] memory _utilizedERC20ETHValue = new uint256[](_utilizedYieldSyncV1EMPStrategy.length);

		for (uint256 i = 0; i < _utilizedYieldSyncV1EMPStrategy.length; i++)
		{
			uint256 _utilizedERC20AmountETHValue = IYieldSyncV1EMPStrategy(
				_utilizedYieldSyncV1EMPStrategy[i].yieldSyncV1EMPStrategy
			).utilizedERC20AmountETHValue(
				_utilizedERC20Amount[i]
			);

			_utilizedERC20ETHValue[i] = _utilizedERC20AmountETHValue;

			_utilizedERC20ETHValueTotal += _utilizedERC20AmountETHValue;
		}

		for (uint256 i = 0; i < _utilizedYieldSyncV1EMPStrategy.length; i++)
		{
			(bool computed, uint256 utilizedERC20AmountAllocationActual) = SafeMath.tryDiv(
				_utilizedERC20ETHValue[i],
				_utilizedERC20ETHValueTotal
			);

			require(computed, "!computed");

			require(
				_utilizedYieldSyncV1EMPStrategy[i].allocation == utilizedERC20AmountAllocationActual,
				"!(_utilizedYieldSyncV1EMPStrategy[i].allocation == utilizedERC20AmountAllocationActual)"
			);
		}

		for (uint256 i = 0; i < _utilizedYieldSyncV1EMPStrategy.length; i++)
		{
			IYieldSyncV1EMPStrategy(_utilizedYieldSyncV1EMPStrategy[i].yieldSyncV1EMPStrategy).utilizedERC20Deposit(
				_utilizedERC20Amount[i]
			);
		}

		_mint(msg.sender, _utilizedERC20ETHValueTotal);

	}

	function utilizedYieldSyncV1EMPStrategyUpdate(UtilizedYieldSyncV1EMPStrategy[] memory __utilizedYieldSyncV1EMPStrategy)
		public
		authManager()
	{
		uint256 utilizedYieldSyncV1EMPStrategyAllocationTotal;

		for (uint256 i = 0; i < __utilizedYieldSyncV1EMPStrategy.length; i++)
		{
			utilizedYieldSyncV1EMPStrategyAllocationTotal += __utilizedYieldSyncV1EMPStrategy[i].allocation;
		}

		require(
			utilizedYieldSyncV1EMPStrategyAllocationTotal == ONE_HUNDRED_PERCENT,
			"!(utilizedYieldSyncV1EMPStrategyAllocationTotal == ONE_HUNDRED_PERCENT)"
		);

		delete _utilizedYieldSyncV1EMPStrategy;

		for (uint256 i = 0; i < __utilizedYieldSyncV1EMPStrategy.length; i++)
		{
			_utilizedYieldSyncV1EMPStrategy.push(__utilizedYieldSyncV1EMPStrategy[i]);
		}
	}

	function withdrawTokens(uint256 [] memory _ERC20Amount)
		public
	{
		for (uint256 i = 0; i < _utilizedYieldSyncV1EMPStrategy.length; i++)
		{
			IYieldSyncV1EMPStrategy(_utilizedYieldSyncV1EMPStrategy[i].yieldSyncV1EMPStrategy).utilizedERC20Withdraw(
				_ERC20Amount[i]
			);
		}

		// Withdraw the tokens to the user
	}
}
