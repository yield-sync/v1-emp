
// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {
	Allocation,
	IERC20,
	IYieldSyncV1Strategy,
	IYieldSyncV1StrategyController
} from "./interface/IYieldSyncV1StrategyController.sol";


contract YieldSyncV1StrategyController is
	ERC20,
	IYieldSyncV1StrategyController,
	ReentrancyGuard
{
	address public immutable deployer;
	address[] internal _utilizedToken;

	mapping (address token => Allocation allocation) internal _token_allocation;

	IYieldSyncV1Strategy public yieldSyncV1Strategy;


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
	function eTHValuePosition(address _target)
		public
		view
		override
		returns (uint256 eTHValuePosition_)
	{
		uint256[] memory uTAPT = utilizedTokenAmountPerToken();

		require(uTAPT.length == _utilizedToken.length, "uTAPT.length != _utilizedToken.length");

		eTHValuePosition_ = 0;

		for (uint256 i = 0; i < _utilizedToken.length; i++)
		{
			eTHValuePosition_ += uTAPT[i] * yieldSyncV1Strategy.utilizedTokenETHValue(_utilizedToken[i]) * balanceOf(
				_target
			);
		}
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
		utilizedTokenAmount_ = yieldSyncV1Strategy.utilizedTokenTotalAmount(_utilizedToken);

		require(_utilizedToken.length == utilizedTokenAmount_.length , "_utilizedToken.length != utilizedTokenAmount_.length");

		for (uint256 i = 0; i < _utilizedToken.length; i++)
		{
			utilizedTokenAmount_[i] = utilizedTokenAmount_[i] / totalSupply();
		}
	}


	/// @inheritdoc IYieldSyncV1StrategyController
	function setStrategy(address _strategy)
		public
		override
	{
		require(address(yieldSyncV1Strategy) == address(0), "strategy != address(0)");
		require(msg.sender == deployer, "msg.sender != deployer");

		yieldSyncV1Strategy = IYieldSyncV1Strategy(_strategy);
	}

	/// @inheritdoc IYieldSyncV1StrategyController
	function utilizedTokenDeposit(uint256[] memory _utilizedTokenAmount)
		public
		override
		nonReentrant()
	{
		require(_utilizedTokenAmount.length == _utilizedToken.length, "_utilizedTokenAmount.length != _utilizedToken.length");

		uint256 valueBefore = eTHValuePosition(msg.sender);

		for (uint256 i = 0; i < _utilizedToken.length; i++)
		{
			IERC20(_utilizedToken[i]).approve(address(yieldSyncV1Strategy), _utilizedTokenAmount[i]);
		}

		yieldSyncV1Strategy.utilizedTokenDeposit(_utilizedToken, _utilizedTokenAmount);

		_mint(msg.sender, eTHValuePosition(msg.sender) - valueBefore);
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

		yieldSyncV1Strategy.utilizedTokenWithdraw(msg.sender, _utilizedToken, uTAPT);

		_burn(msg.sender, _tokenAmount);
	}
}
// TODO the next big thing i have to program out is the utilization of the allocation
