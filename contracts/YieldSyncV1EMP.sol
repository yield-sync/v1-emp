// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IAccessControlEnumerable } from "@openzeppelin/contracts/access/IAccessControlEnumerable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { ERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import { IYieldSyncV1EMP, IYieldSyncV1EMPRegistry, UtilizationERC20 } from "./interface/IYieldSyncV1EMP.sol";
import { IYieldSyncV1EMPStrategy } from "./interface/IYieldSyncV1EMPStrategy.sol";
import { IYieldSyncV1EMPUtility } from "./interface/IYieldSyncV1EMPUtility.sol";


contract YieldSyncV1EMP is
	ReentrancyGuard,
	ERC20,
	IYieldSyncV1EMP
{
	using SafeMath for uint256;

	address public override manager;

	address[] internal _utilizedERC20;
	address[] internal _utilizedYieldSyncV1EMPStrategy;

	bool public override utilizedERC20DepositOpen;
	bool public override utilizedERC20WithdrawOpen;

	uint256 public constant override INITIAL_MINT_RATE = 100;
	uint256 public constant override ONE_HUNDRED_PERCENT = 1e18;

	uint256 public override feeRateManager;
	uint256 public override feeRateYieldSyncGovernance;

	IYieldSyncV1EMPRegistry public override immutable I_YIELD_SYNC_V1_EMP_REGISTRY;
	IYieldSyncV1EMPUtility public immutable I_YIELD_SYNC_V1_EMP_UTILITY;


	mapping (
		address utilizedYieldSyncV1EMPStrategy => uint256 allocation
	) public override utilizedYieldSyncV1EMPStrategy_allocation;

	mapping (address utilizedERC20 => UtilizationERC20 utilizationERC20) internal _utilizedERC20_utilizationERC20;


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
		utilizedERC20DepositOpen = false;
		utilizedERC20WithdrawOpen = false;

		manager = _manager;

		feeRateManager = 0;
		feeRateYieldSyncGovernance = 0;

		I_YIELD_SYNC_V1_EMP_REGISTRY = IYieldSyncV1EMPRegistry(_yieldSyncV1EMPRegistry);
		I_YIELD_SYNC_V1_EMP_UTILITY = IYieldSyncV1EMPUtility(I_YIELD_SYNC_V1_EMP_REGISTRY.yieldSyncV1EMPUtility());
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

	modifier utilizedERC20DepositOpenRequired()
	{
		require(utilizedERC20DepositOpen, "!utilizedERC20DepositOpen");

		_;
	}

	modifier utilizedYieldSyncV1EMPStrategyTransferClosed()
	{
		require(
			!utilizedERC20DepositOpen && !utilizedERC20WithdrawOpen,
			"!(!utilizedERC20DepositOpen && !utilizedERC20WithdrawOpen)"
		);

		_;
	}

	modifier utilizedERC20UpdateBefore()
	{
		utilizedERC20Update();

		_;
	}


	/// @notice view


	/// @inheritdoc IYieldSyncV1EMP
	function utilizedERC20()
		public
		view
		override
		returns (address[] memory)
	{
		return _utilizedERC20;
	}

	/// @inheritdoc IYieldSyncV1EMP
	function utilizedYieldSyncV1EMPStrategy()
		public
		view
		override
		returns (address[] memory)
	{
		return _utilizedYieldSyncV1EMPStrategy;
	}

	/// @inheritdoc IYieldSyncV1EMP
	function utilizedERC20_utilizationERC20(address __utilizedERC20)
		public
		view
		override
		returns (UtilizationERC20 memory)
	{
		return _utilizedERC20_utilizationERC20[__utilizedERC20];
	}


	/// @notice mutative


	/// @inheritdoc IYieldSyncV1EMP
	function feeRateManagerUpdate(uint256 _feeRateManager)
		public
		authYieldSyncGovernanceOrManager()
	{
		require(_feeRateManager <= ONE_HUNDRED_PERCENT, "!(_feeRateManager <= ONE_HUNDRED_PERCENT)");

		feeRateManager = _feeRateManager;
	}

	/// @inheritdoc IYieldSyncV1EMP
	function feeRateYieldSyncGovernanceUpdate(uint256 _feeRateYieldSyncGovernance)
		public
		override
	{
		require(
			IAccessControlEnumerable(I_YIELD_SYNC_V1_EMP_REGISTRY.YIELD_SYNC_GOVERNANCE()).hasRole(bytes32(0), msg.sender),
			"!authorized"
		);

		require(_feeRateYieldSyncGovernance <= ONE_HUNDRED_PERCENT, "!(_feeRateYieldSyncGovernance <= ONE_HUNDRED_PERCENT)");

		feeRateYieldSyncGovernance = _feeRateYieldSyncGovernance;
	}

	/// @inheritdoc IYieldSyncV1EMP
	function managerUpdate(address _manager)
		public
		override
		authYieldSyncGovernanceOrManager()
	{
		manager = _manager;
	}

	/// @inheritdoc IYieldSyncV1EMP
	function utilizedERC20Deposit(uint256[] memory _utilizedERC20Amount)
		public
		override
		nonReentrant()
		utilizedERC20DepositOpenRequired()
		utilizedERC20UpdateBefore()
	{
		(bool valid, uint256 utilizedERC20AmountTotalETHValue) = I_YIELD_SYNC_V1_EMP_UTILITY.utilizedERC20AmountValid(
			_utilizedERC20Amount
		);

		require(valid, "!valid");


		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			IERC20(_utilizedERC20[i]).transferFrom(msg.sender, address(this), _utilizedERC20Amount[i]);
		}

		uint256 mintAmountManager = utilizedERC20AmountTotalETHValue.mul(feeRateManager).div(ONE_HUNDRED_PERCENT);

		uint256 mintAmountYieldSyncGovernancePayTo = utilizedERC20AmountTotalETHValue.mul(feeRateYieldSyncGovernance).div(
			ONE_HUNDRED_PERCENT
		);

		_mint(manager, mintAmountManager);
		_mint(I_YIELD_SYNC_V1_EMP_REGISTRY.yieldSyncGovernancePayTo(), mintAmountYieldSyncGovernancePayTo);
		_mint(msg.sender, utilizedERC20AmountTotalETHValue - mintAmountManager - mintAmountYieldSyncGovernancePayTo);
	}

	/// @inheritdoc IYieldSyncV1EMP
	function utilizedERC20DepositOpenToggle()
		public
		override
		authYieldSyncGovernanceOrManager()
	{
		utilizedERC20DepositOpen = !utilizedERC20DepositOpen;
	}

	/// @inheritdoc IYieldSyncV1EMP
	function utilizedERC20TotalAmount()
		public
		view
		returns (uint256[] memory utilizedERC20TotalAmount_)
	{
		utilizedERC20TotalAmount_ = new uint256[](_utilizedERC20.length);

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			utilizedERC20TotalAmount_[i] += IERC20(_utilizedERC20[i]).balanceOf(address(this));

			for (uint256 ii = 0; ii < _utilizedYieldSyncV1EMPStrategy.length; ii++)
			{
				utilizedERC20TotalAmount_[i] += IYieldSyncV1EMPStrategy(
					_utilizedYieldSyncV1EMPStrategy[ii]
				).iYieldSyncV1EMPStrategyInteractor().utilizedERC20TotalAmount(
					_utilizedERC20[i]
				);
			}
		}
	}

	/// @inheritdoc IYieldSyncV1EMP
	function utilizedERC20Update()
		public
		override
	{
		(
			bool updateRequired,
			address[] memory __utilizedERC20,
			UtilizationERC20[] memory  utilizationERC20_
		) = I_YIELD_SYNC_V1_EMP_UTILITY.utilizedERC20Generator();

		if (updateRequired)
		{
			delete _utilizedERC20;

			_utilizedERC20 = __utilizedERC20;

			for (uint256 i = 0; i < _utilizedERC20.length; i++)
			{
				_utilizedERC20_utilizationERC20[_utilizedERC20[i]] = utilizationERC20_[i];

				for (uint256 ii = 0; ii < _utilizedYieldSyncV1EMPStrategy.length; ii++)
				{
					IERC20(_utilizedERC20[i]).approve(
						address(
							IYieldSyncV1EMPStrategy(_utilizedYieldSyncV1EMPStrategy[ii]).iYieldSyncV1EMPStrategyInteractor()
						),
						type(uint256).max
					);
				}
			}
		}
	}

	/// @inheritdoc IYieldSyncV1EMP
	function utilizedERC20Withdraw(uint256 _eRC20Amount)
		public
		override
		utilizedERC20UpdateBefore()
	{
		require(utilizedERC20WithdrawOpen, "!utilizedERC20WithdrawOpen");

		require(balanceOf(msg.sender) >= _eRC20Amount, "!(balanceOf(msg.sender) >= _eRC20Amount)");

		uint256[] memory _utilizedERC20TotalAmount = utilizedERC20TotalAmount();

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			uint256 transferAmount = _utilizedERC20TotalAmount[i].mul(1e18).div(totalSupply(), "!computed").mul(_eRC20Amount).div(
				1e18
			);

			require(
				IERC20(_utilizedERC20[i]).balanceOf(address(this)) >= transferAmount,
				"IERC20(_utilizedERC20[i]).balanceOf(address(this)) >= transferAmount"
			);

			transfer(msg.sender, transferAmount);
		}

		_burn(msg.sender, _eRC20Amount);
	}

	/// @inheritdoc IYieldSyncV1EMP
	function utilizedERC20WithdrawOpenToggle()
		public
		override
		authYieldSyncGovernanceOrManager()
	{
		utilizedERC20WithdrawOpen = !utilizedERC20WithdrawOpen;
	}

	/// @inheritdoc IYieldSyncV1EMP
	function utilizedYieldSyncV1EMPStrategyDeposit(uint256[][] memory _yieldSyncV1EMPStrategyUtilizedERC20Amount)
		public
		override
		nonReentrant()
		utilizedERC20DepositOpenRequired()
	{
		require(
			I_YIELD_SYNC_V1_EMP_UTILITY.yieldSyncV1EMPStrategyUtilizedERC20AmountValid(_yieldSyncV1EMPStrategyUtilizedERC20Amount),
			"!I_YIELD_SYNC_V1_EMP_UTILITY.yieldSyncV1EMPStrategyUtilizedERC20AmountValid(_yieldSyncV1EMPStrategyUtilizedERC20Amount)"
		);

		for (uint256 i = 0; i < _utilizedYieldSyncV1EMPStrategy.length; i++)
		{
			IYieldSyncV1EMPStrategy(_utilizedYieldSyncV1EMPStrategy[i]).utilizedERC20Deposit(
				address(this),
				_yieldSyncV1EMPStrategyUtilizedERC20Amount[i]
			);
		}
	}

	/// @inheritdoc IYieldSyncV1EMP
	function utilizedYieldSyncV1EMPStrategyUpdate(address[] memory _yieldSyncV1EMPStrategy, uint256[] memory _allocation)
		public
		override
		authYieldSyncGovernanceOrManager()
		utilizedYieldSyncV1EMPStrategyTransferClosed()
	{
		require(_yieldSyncV1EMPStrategy.length == _allocation.length, "!(_yieldSyncV1EMPStrategy.length == _allocation.length)");

		uint256 utilizedYieldSyncV1EMPStrategyAllocationTotal;

		for (uint256 i = 0; i < _allocation.length; i++)
		{
			utilizedYieldSyncV1EMPStrategyAllocationTotal += _allocation[i];
		}

		require(
			utilizedYieldSyncV1EMPStrategyAllocationTotal == ONE_HUNDRED_PERCENT,
			"!(utilizedYieldSyncV1EMPStrategyAllocationTotal == ONE_HUNDRED_PERCENT)"
		);

		delete _utilizedYieldSyncV1EMPStrategy;

		for (uint256 i = 0; i < _yieldSyncV1EMPStrategy.length; i++)
		{
			_utilizedYieldSyncV1EMPStrategy.push(_yieldSyncV1EMPStrategy[i]);

			utilizedYieldSyncV1EMPStrategy_allocation[_yieldSyncV1EMPStrategy[i]] = _allocation[i];
		}

		utilizedERC20Update();
	}

	/// @inheritdoc IYieldSyncV1EMP
	function utilizedYieldSyncV1EMPStrategyWithdraw(uint256[] memory _yieldSyncV1EMPStrategyERC20Amount)
		public
		override
		authYieldSyncGovernanceOrManager()
		utilizedERC20UpdateBefore()
	{
		require(
			_yieldSyncV1EMPStrategyERC20Amount.length == _utilizedYieldSyncV1EMPStrategy.length,
			"!(_yieldSyncV1EMPStrategyERC20Amount.length == _utilizedYieldSyncV1EMPStrategy.length)"
		);

		for (uint256 i = 0; i < _utilizedYieldSyncV1EMPStrategy.length; i++)
		{
			IYieldSyncV1EMPStrategy(_utilizedYieldSyncV1EMPStrategy[i]).utilizedERC20Withdraw(_yieldSyncV1EMPStrategyERC20Amount[i]);
		}
	}
}
