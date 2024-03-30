// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import { IYieldSyncV1EMP, IYieldSyncV1EMPStrategy, UtilizedStrategy } from "./interface/IYieldSyncV1EMP.sol";


using SafeERC20 for ERC20;


contract YieldSyncV1EMP is
	ERC20,
	IYieldSyncV1EMP
{
	address public override manager;

	uint256 public constant override INITIAL_MINT_RATE = 100;
	uint256 public constant override ONE_HUNDRED_PERCENT = 1e18;

	UtilizedStrategy[] internal _utilizedStrategy;


	constructor (address _manager, string memory _name, string memory _symbol)
		ERC20(_name, _symbol)
	{
		manager = _manager;
	}


	modifier accessManager()
	{
		require(msg.sender == manager, "!(msg.sender == manager)");

		_;
	}


	/// @inheritdoc IYieldSyncV1EMP
	function utilizedStrategy()
		external
		view
		override
		returns (UtilizedStrategy[] memory utilizedStrategy_)
	{
		return _utilizedStrategy;
	}


	function depositTokens(uint256[][] memory _utilizedERC20Amount)
		public
	{
		uint256 _utilizedERC20ETHValueTotal = 0;

		uint256[] memory _utilizedERC20ETHValue = new uint256[](_utilizedStrategy.length);

		for (uint256 i = 0; i < _utilizedStrategy.length; i++)
		{
			uint256 _utilizedERC20AmountETHValue = IYieldSyncV1EMPStrategy(
				_utilizedStrategy[i].yieldSyncV1EMPStrategy
			).utilizedERC20AmountETHValue(
				_utilizedERC20Amount[i]
			);

			_utilizedERC20ETHValue[i] = _utilizedERC20AmountETHValue;

			_utilizedERC20ETHValueTotal += _utilizedERC20AmountETHValue;
		}

		for (uint256 i = 0; i < _utilizedStrategy.length; i++)
		{
			(bool computed, uint256 utilizedERC20AmountAllocationActual) = SafeMath.tryDiv(
				_utilizedERC20ETHValue[i],
				_utilizedERC20ETHValueTotal
			);

			require(computed, "!computed");

			require(
				_utilizedStrategy[i].allocation == utilizedERC20AmountAllocationActual,
				"!(_utilizedStrategy[i].allocation == utilizedERC20AmountAllocationActual)"
			);
		}

		for (uint256 i = 0; i < _utilizedStrategy.length; i++)
		{
			IYieldSyncV1EMPStrategy(_utilizedStrategy[i].yieldSyncV1EMPStrategy).utilizedERC20Deposit(
				_utilizedERC20Amount[i]
			);
		}
	}

	function strategyAllocationUpdate()
		public
		accessManager()
	{

	}
}
