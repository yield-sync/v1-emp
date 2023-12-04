
// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { IYieldSyncV1Strategy } from "./interface/IYieldSyncV1Strategy.sol";
import { Allocation, IERC20, IYieldSyncV1StrategyController } from "./interface/IYieldSyncV1StrategyController.sol";


contract YieldSyncV1StrategyController is
	ERC20,
	IYieldSyncV1StrategyController,
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


	/// @inheritdoc IYieldSyncV1StrategyController
	function token_allocation(address _token)
		external
		view
		override
		returns (Allocation memory)
	{
		return _token_allocation[_token];
	}

	/// @inheritdoc IYieldSyncV1StrategyController
	function token_utilized(address _token)
		public
		view
		override
		returns (bool utilized_)
	{
		return _token_utilized[_token];
	}


	/// @inheritdoc IYieldSyncV1StrategyController
	function positionETHValue(address _target)
		public
		view
		override
		returns (uint256 positionETHValue_)
	{
		uint256[] memory uTAPT = utilizedTokenAmountPerToken();

		require(uTAPT.length == _utilizedToken.length, "uTAPT.length != _utilizedToken.length");

		uint256 pEV = 0;

		for (uint256 i = 0; i < _utilizedToken.length; i++)
		{
			pEV += uTAPT[i] * IYieldSyncV1Strategy(strategy).utilizedTokenETHValue(_utilizedToken[i]) * balanceOf(_target);
		}

		return pEV;
	}


	/// @inheritdoc IYieldSyncV1StrategyController
	function utilizedToken()
		public
		view
		override
		returns (address[] memory)
	{
		return _utilizedToken;
	}

	/// @inheritdoc IYieldSyncV1StrategyController
	function utilizedTokenAmountPerToken()
		public
		view
		override
		returns (uint256[] memory utilizedTokenAmount_)
	{
		uint256[] memory uTTA = IYieldSyncV1Strategy(strategy).utilizedTokenTotalAmount(_utilizedToken);

		require(_utilizedToken.length == uTTA.length , "_utilizedToken.length != uTTA.length");

		for (uint256 i = 0; i < _utilizedToken.length; i++)
		{
			uTTA[i] = uTTA[i] / totalSupply();
		}

		return uTTA;
	}


	/// @inheritdoc IYieldSyncV1StrategyController
	function setStrategy(address _strategy)
		public
		override
	{
		require(strategy == address(0), "strategy != address(0)");
		require(msg.sender == deployer, "msg.sender != deployer");

		strategy = _strategy;
	}

	/// @inheritdoc IYieldSyncV1StrategyController
	function utilizedTokenDeposit(uint256[] memory _utilizedTokenAmount)
		public
		override
		nonReentrant()
	{
		require(_utilizedTokenAmount.length == _utilizedToken.length, "!_amount.length");

		uint256 valueBefore = positionETHValue(msg.sender);

		for (uint256 i = 0; i < _utilizedToken.length; i++)
		{
			IERC20(_utilizedToken[i]).approve(strategy, _utilizedTokenAmount[i]);
		}

		IYieldSyncV1Strategy(strategy).utilizedTokenDeposit(_utilizedToken, _utilizedTokenAmount);

		_mint(msg.sender, positionETHValue(msg.sender) - valueBefore);
	}

	/// @inheritdoc IYieldSyncV1StrategyController
	function utilizedTokenWithdraw(uint256 _tokenAmount)
		public
		override
		nonReentrant()
	{
		require(balanceOf(msg.sender) >= _tokenAmount, "!_tokenAmount");

		uint256[] memory uTAPT = utilizedTokenAmountPerToken();

		require(uTAPT.length == _utilizedToken.length, "uTAPT.length != _utilizedToken.length");

		for (uint256 i = 0; i < _utilizedToken.length; i++)
		{
			uTAPT[i] += uTAPT[i] * _tokenAmount;
		}

		IYieldSyncV1Strategy(strategy).utilizedTokenWithdraw(msg.sender, _utilizedToken, uTAPT);

		_burn(msg.sender, _tokenAmount);
	}
}
