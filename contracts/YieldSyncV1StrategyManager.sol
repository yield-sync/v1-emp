
// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {
	Allocation,
	IERC20,
	IYieldSyncV1Strategy,
	IYieldSyncV1StrategyManager
} from "./interface/IYieldSyncV1StrategyManager.sol";


contract YieldSyncV1StrategyManager is
	ERC20,
	IYieldSyncV1StrategyManager,
	ReentrancyGuard
{
	address public immutable deployer;
	address public override strategy;
	address[] internal _utilizedToken;

	mapping (address token => bool utilized) internal _token_utilized;

	mapping (address token => Allocation allocation) internal _token_allocation;


	receive ()
		external
		payable
	{}


	fallback ()
		external
		payable
	{}


	constructor (address _deployer, string memory _name, string memory _symbol)
		ERC20(_name, _symbol)
	{
		deployer = _deployer;
	}


	/// @inheritdoc IYieldSyncV1StrategyManager
	function token_allocation(address _token)
		external
		view
		override
		returns (Allocation memory)
	{
		return _token_allocation[_token];
	}

	/// @inheritdoc IYieldSyncV1StrategyManager
	function token_utilized(address _token)
		public
		view
		override
		returns (bool utilized_)
	{
		return _token_utilized[_token];
	}


	/// @inheritdoc IYieldSyncV1StrategyManager
	function positionETHValue(address _target)
		public
		view
		override
		returns (uint256 positionETHValue_)
	{
		return IYieldSyncV1Strategy(strategy).positionETHValue(_utilizedToken, _target);
	}

	function setStrategy(address _strategy)
		public
	{
		require(strategy == address(0), "strategy != address(0)");
		require(msg.sender == deployer, "!deployer");

		strategy = _strategy;
	}

	/// @inheritdoc IYieldSyncV1StrategyManager
	function utilizedToken()
		public
		view
		override
		returns (address[] memory)
	{
		return _utilizedToken;
	}

	/// @inheritdoc IYieldSyncV1StrategyManager
	function utilizedTokenETHValue(address _token)
		public
		view
		override
		returns (uint256 tokenETHValue_)
	{
		require(_token_utilized[_token] == true, "!_token_utilized[_token]");

		return IYieldSyncV1Strategy(strategy).utilizedTokenETHValue(_token);
	}

	/// @inheritdoc IYieldSyncV1StrategyManager
	function utilizedTokensDeposit(uint256[] memory _amount)
		public
		override
		nonReentrant()
	{
		require(_amount.length == _utilizedToken.length, "!_amount.length");

		uint256 valueBefore = positionETHValue(msg.sender);

		for (uint256 i = 0; i < _amount.length; i++)
		{
			IERC20(_utilizedToken[i]).approve(strategy, _amount[i]);
		}

		IYieldSyncV1Strategy(strategy).utilizedTokensDeposit(_utilizedToken, _amount);

		// Mint the tokens accordingly
		_mint(msg.sender, positionETHValue(msg.sender) - valueBefore);
	}

	/// @inheritdoc IYieldSyncV1StrategyManager
	function utilizedTokensWithdraw(uint256[] memory _amount)
		public
		override
		nonReentrant()
	{
		require(_amount.length == _utilizedToken.length, "!_amount.length");

		IYieldSyncV1Strategy(strategy).utilizedTokensWithdraw(_utilizedToken, _amount);
	}
}
