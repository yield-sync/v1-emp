
// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { IERC20, ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { Allocation, IYieldSyncV1StrategyHander } from "./interface/IYieldSyncV1StrategyHandler.sol";


using SafeERC20 for IERC20;


interface IStrategyHandler
{
	function utilizedTokensDeposit(address[] memory _utilizedToken, uint256[] memory _amount)
		external
	;

	function utilizedTokensWithdraw(address[] memory _utilizedToken, uint256[] memory _amount)
		external
	;
}


contract YieldSyncV1Strategy is
	ERC20,
	IYieldSyncV1Strategy,
	ReentrancyGuard
{
	address[] internal _utilizedToken;

	IStrategyHandler public immutable STRATEGY_HANDLER;


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


	constructor (address _STRATEGY_HANDLER, string memory name, string memory symbol)
		ERC20(name, symbol)
	{
		STRATEGY_HANDLER = IStrategyHandler(_STRATEGY_HANDLER);
	}


	/// @inheritdoc IYieldSyncV1Strategy
	function token_allocation(address token)
		external
		view
		override
		returns (Allocation memory)
	{
		return _token_allocation[token];
	}

	/// @inheritdoc IYieldSyncV1Strategy
	function token_utilized(address _token)
		public
		view
		override
		returns (bool utilized_)
	{
		return _token_utilized[_token];
	}


	/// @inheritdoc IYieldSyncV1Strategy
	function positionValueInWETH(address _target)
		public
		view
		override
		returns (uint256 positionValueInEth_)
	{
	}

	/// @inheritdoc IYieldSyncV1Strategy
	function utilizedToken()
		public
		view
		override
		returns (address[] memory)
	{
		return _utilizedToken;
	}

	/// @inheritdoc IYieldSyncV1Strategy
	function utilizedTokenValueInWETH(address _token)
		public
		view
		override
		returns (uint256 tokenValueInEth_)
	{
		require(_token_utilized[_token] == true, "!_token_utilized[_token]");

		return 0;
	}

	function utilizedTokensDeposit(uint256[] memory _amount)
		public
		override
		nonReentrant()
	{
		require(_amount.length == _utilizedToken.length, "!_amount.length");

		for (uint256 i = 0; i < _amount.length; i++)
		{
			IERC20(_utilizedToken[i]).approve(address(STRATEGY_HANDLER), _amount[i]);
		}

		STRATEGY_HANDLER.utilizedTokensDeposit(_utilizedToken, _amount);
	}

	function utilizedTokensWithdraw(uint256[] memory _amount)
		public
		override
		nonReentrant()
	{
		require(_amount.length == _utilizedToken.length, "!_amount.length");

		STRATEGY_HANDLER.utilizedTokensWithdraw(_utilizedToken, _amount);
	}
}
