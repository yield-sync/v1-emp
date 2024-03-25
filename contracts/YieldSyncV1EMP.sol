// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import { UtilizedStrategy, IYieldSyncV1EMP } from "./interface/IYieldSyncV1EMP.sol";
import { IYieldSyncV1EMPStrategy, UtilizedERC20 } from "./interface/IYieldSyncV1EMPStrategy.sol";


using SafeERC20 for ERC20;


contract YieldSyncV1EMP is
	ERC20,
	IYieldSyncV1EMP
{
	address public override manager;

	uint256 public constant override INITIAL_MINT_RATE = 100;

	UtilizedStrategy[] internal _utilizedStrategy;


	constructor (address _manager, string memory _name, string memory _symbol)
		ERC20(_name, _symbol)
	{
		manager = _manager;
	}


	modifier accessManager()
	{
		require(msg.sender == manager, "!manager");

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


	/// @inheritdoc IYieldSyncV1EMP
	function depositTokens(uint256[] memory _utilizedERC20Amount)
		public
	{
		// Get status of if valid

		// Check that percents are correct
	}

	/// @inheritdoc IYieldSyncV1EMP
	function strategyAllocationUpdate()
		public
		accessManager()
	{

	}
}
