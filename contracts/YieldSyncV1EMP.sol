// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IAccessControlEnumerable } from "@openzeppelin/contracts/access/IAccessControlEnumerable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import { IYieldSyncV1EMP, IYieldSyncV1EMPRegistry, UtilizedYieldSyncV1EMPStrategy } from "./interface/IYieldSyncV1EMP.sol";
import { IYieldSyncV1EMPStrategy } from "./interface/IYieldSyncV1EMPStrategy.sol";


using SafeERC20 for ERC20;


contract YieldSyncV1EMP is
	ReentrancyGuard,
	ERC20,
	IYieldSyncV1EMP
{
	address public override manager;

	bool public override utilizedYieldSyncV1EMPStrategyDepositOpen;
	bool public override utilizedYieldSyncV1EMPStrategyWithdrawOpen;

	uint256 public constant override INITIAL_MINT_RATE = 100;
	uint256 public constant override ONE_HUNDRED_PERCENT = 1e18;

	uint256 public override feeRateManager;
	uint256 public override feeRateYieldSyncGovernance;

	IYieldSyncV1EMPRegistry public override immutable I_YIELD_SYNC_V1_EMP_REGISTRY;

	UtilizedYieldSyncV1EMPStrategy[] internal _utilizedYieldSyncV1EMPStrategy;


	receive ()
		external
		payable
	{}


	fallback ()
		external
		payable
	{}


	constructor (address _manager, address _yieldSyncV1EMPRegistry, string memory _name, string memory _symbol)
		ERC20(_name, _symbol)
	{
		utilizedYieldSyncV1EMPStrategyDepositOpen = false;
		utilizedYieldSyncV1EMPStrategyWithdrawOpen = false;

		manager = _manager;

		feeRateManager = 0;
		feeRateYieldSyncGovernance = 0;

		I_YIELD_SYNC_V1_EMP_REGISTRY = IYieldSyncV1EMPRegistry(_yieldSyncV1EMPRegistry);
	}


	modifier authYieldSyncGovernance()
	{
		require(
			IAccessControlEnumerable(I_YIELD_SYNC_V1_EMP_REGISTRY.YIELD_SYNC_GOVERNANCE()).hasRole(bytes32(0), msg.sender),
			"!auth"
		);

		_;
	}

	modifier authYieldSyncGovernanceOrManager()
	{
		require(
			IAccessControlEnumerable(I_YIELD_SYNC_V1_EMP_REGISTRY.YIELD_SYNC_GOVERNANCE()).hasRole(
				bytes32(0),
				msg.sender
			) || msg.sender == manager,
			"!authorized"
		);

		_;
	}

	modifier utilizedYieldSyncV1EMPStrategyTransferClosed()
	{
		require(
			!utilizedYieldSyncV1EMPStrategyDepositOpen && !utilizedYieldSyncV1EMPStrategyWithdrawOpen,
			"!(!utilizedYieldSyncV1EMPStrategyDepositOpen && !utilizedYieldSyncV1EMPStrategyWithdrawOpen)"
		);

		_;
	}


	/// @notice view


	/// @inheritdoc IYieldSyncV1EMP
	function utilizedYieldSyncV1EMPStrategy()
		external
		view
		override
		returns (UtilizedYieldSyncV1EMPStrategy[] memory)
	{
		return _utilizedYieldSyncV1EMPStrategy;
	}


	/// @notice mutative


	/// @inheritdoc IYieldSyncV1EMP
	function managerUpdate(address _manager)
		public
		override
		authYieldSyncGovernanceOrManager()
	{
		manager = _manager;
	}

	/// @inheritdoc IYieldSyncV1EMP
	function utilizedYieldSyncV1EMPStrategyDeposit(uint256[][] memory _utilizedYieldSyncV1EMPStrategyERC20Amount)
		public
		override
		nonReentrant()
	{
		require(utilizedYieldSyncV1EMPStrategyDepositOpen, "!utilizedYieldSyncV1EMPStrategyDepositOpen");

		require(
			_utilizedYieldSyncV1EMPStrategy.length == _utilizedYieldSyncV1EMPStrategyERC20Amount.length,
			"!(_utilizedYieldSyncV1EMPStrategy.length == _utilizedYieldSyncV1EMPStrategyERC20Amount.length)"
		);

		uint256 _utilizedERC20ETHValueTotal = 0;

		uint256[] memory _utilizedERC20ETHValue = new uint256[](_utilizedYieldSyncV1EMPStrategy.length);

		for (uint256 i = 0; i < _utilizedYieldSyncV1EMPStrategy.length; i++)
		{
			uint256 _utilizedERC20AmountETHValue = IYieldSyncV1EMPStrategy(
				_utilizedYieldSyncV1EMPStrategy[i].yieldSyncV1EMPStrategy
			).utilizedERC20AmountETHValue(
				_utilizedYieldSyncV1EMPStrategyERC20Amount[i]
			);

			_utilizedERC20ETHValue[i] = _utilizedERC20AmountETHValue;

			_utilizedERC20ETHValueTotal += _utilizedERC20AmountETHValue;
		}

		for (uint256 i = 0; i < _utilizedYieldSyncV1EMPStrategy.length; i++)
		{
			(bool computed, uint256 utilizedERC20AmountAllocationActual) = SafeMath.tryDiv(
				SafeMath.mul(_utilizedERC20ETHValue[i], 1e18),
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
				msg.sender,
				_utilizedYieldSyncV1EMPStrategyERC20Amount[i]
			);
		}

		_mint(msg.sender, _utilizedERC20ETHValueTotal);
	}

	/// @inheritdoc IYieldSyncV1EMP
	function utilizedYieldSyncV1EMPStrategyDepositOpenToggle()
		public
		override
		authYieldSyncGovernanceOrManager()
	{
		utilizedYieldSyncV1EMPStrategyDepositOpen = !utilizedYieldSyncV1EMPStrategyDepositOpen;
	}

	/// @inheritdoc IYieldSyncV1EMP
	function utilizedYieldSyncV1EMPStrategyUpdate(UtilizedYieldSyncV1EMPStrategy[] memory __utilizedYieldSyncV1EMPStrategy)
		public
		override
		authYieldSyncGovernanceOrManager()
		utilizedYieldSyncV1EMPStrategyTransferClosed()
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

	/// @inheritdoc IYieldSyncV1EMP
	function utilizedYieldSyncV1EMPStrategyWithdrawOpenToggle()
		public
		override
		authYieldSyncGovernanceOrManager()
	{
		utilizedYieldSyncV1EMPStrategyWithdrawOpen = !utilizedYieldSyncV1EMPStrategyWithdrawOpen;
	}

	/// @inheritdoc IYieldSyncV1EMP
	function utilizedYieldSyncV1EMPStrategyWithdraw(uint256 _ERC20Amount)
		public
		override
	{
		require(utilizedYieldSyncV1EMPStrategyWithdrawOpen, "!utilizedYieldSyncV1EMPStrategyWithdrawOpen");

		require(balanceOf(msg.sender) >= _ERC20Amount, "!(balanceOf(msg.sender) >= _ERC20Amount)");

		for (uint256 i = 0; i < _utilizedYieldSyncV1EMPStrategy.length; i++)
		{
			(bool computed, uint256 utilizedyieldSyncV1EMPStrategyPerToken) = SafeMath.tryDiv(
				SafeMath.mul(ERC20(_utilizedYieldSyncV1EMPStrategy[i].yieldSyncV1EMPStrategy).balanceOf(address(this)), 1e18),
				totalSupply()
			);

			require(computed, "!computed");

			IYieldSyncV1EMPStrategy(_utilizedYieldSyncV1EMPStrategy[i].yieldSyncV1EMPStrategy).utilizedERC20Withdraw(
				msg.sender,
				SafeMath.div(SafeMath.mul(utilizedyieldSyncV1EMPStrategyPerToken, _ERC20Amount), 1e18)
			);
		}

		_burn(msg.sender, _ERC20Amount);
	}
}
