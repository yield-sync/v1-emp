// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IAccessControlEnumerable } from "@openzeppelin/contracts/access/IAccessControlEnumerable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { ERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import { IYieldSyncV1EMP, IYieldSyncV1EMPRegistry, UtilizationERC20 } from "./interface/IYieldSyncV1EMP.sol";
import { IYieldSyncV1EMPArrayUtility } from "./interface/IYieldSyncV1EMPArrayUtility.sol";
import { IYieldSyncV1EMPStrategy } from "./interface/IYieldSyncV1EMPStrategy.sol";
import { IYieldSyncV1EMPAmountsValidator } from "./interface/IYieldSyncV1EMPAmountsValidator.sol";


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

	IYieldSyncV1EMPArrayUtility public immutable I_YIELD_SYNC_V1_EMP_ARRAY_UTILITY;
	IYieldSyncV1EMPRegistry public override immutable I_YIELD_SYNC_V1_EMP_REGISTRY;
	IYieldSyncV1EMPAmountsValidator public immutable I_YIELD_SYNC_V1_EMP_UTILITY;


	mapping (
		address utilizedYieldSyncV1EMPStrategy => uint256 allocation
	) public override utilizedYieldSyncV1EMPStrategy_allocation;

	mapping (address utilizedERC20 => UtilizationERC20 utilizationERC20) internal _utilizedERC20_utilizationERC20;

	mapping (
		address yieldSyncV1EMPStrategy => uint256 utilizedERC20UpdateTracker
	) public yieldSyncV1EMPStrategy_utilizedERC20UpdateTracker;

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
		I_YIELD_SYNC_V1_EMP_ARRAY_UTILITY = IYieldSyncV1EMPArrayUtility(
			I_YIELD_SYNC_V1_EMP_REGISTRY.yieldSyncV1EMPArrayUtility()
		);
		I_YIELD_SYNC_V1_EMP_UTILITY = IYieldSyncV1EMPAmountsValidator(I_YIELD_SYNC_V1_EMP_REGISTRY.yieldSyncV1EMPAmountsValidator());
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
		bool updateRequired = false;

		uint256 utilizedERC20MaxLength = 0;

		// First check if update is required and add length of utilizedERC20 to max length count
		for (uint256 i = 0; i < _utilizedYieldSyncV1EMPStrategy.length; i++)
		{
			// Get the count for the utilized ERC 20 update
			uint256 utilizedERC20UpdateTracker = IYieldSyncV1EMPStrategy(
				_utilizedYieldSyncV1EMPStrategy[i]
			).utilizedERC20UpdateTracker();

			// If an update is needed..
			if (yieldSyncV1EMPStrategy_utilizedERC20UpdateTracker[_utilizedYieldSyncV1EMPStrategy[i]] != utilizedERC20UpdateTracker)
			{
				// Set updatedNeeded to true
				updateRequired = true;

				// Update local record of update tracker
				yieldSyncV1EMPStrategy_utilizedERC20UpdateTracker[_utilizedYieldSyncV1EMPStrategy[i]] = utilizedERC20UpdateTracker;
			}

			// Set max length of utilized ERC20 to the sum of all lengths of each utilized ERC20 on stratgies
			utilizedERC20MaxLength += IYieldSyncV1EMPStrategy(_utilizedYieldSyncV1EMPStrategy[i]).utilizedERC20().length;
		}

		if (!updateRequired)
		{
			return;
		}

		delete _utilizedERC20;

		// Initialize the utilizedERC20 to the max possible size it can be
		address[] memory tempUtilizedERC20 = new address[](utilizedERC20MaxLength);

		// Set the count to 0
		uint256 utilizedERC20I = 0;

		// For each EMP utilized strategy..
		for (uint256 i = 0; i < _utilizedYieldSyncV1EMPStrategy.length; i++)
		{
			// Get the utilized ERC20
			address[] memory strategyUtilizedERC20 = IYieldSyncV1EMPStrategy(_utilizedYieldSyncV1EMPStrategy[i]).utilizedERC20();

			// Add each ERC20 to the EMP UtilizedERC20
			for (uint256 ii = 0; ii < strategyUtilizedERC20.length; ii++)
			{
				tempUtilizedERC20[utilizedERC20I++] = strategyUtilizedERC20[ii];
			}
		}

		// Clean up the array
		tempUtilizedERC20 = I_YIELD_SYNC_V1_EMP_ARRAY_UTILITY.removeDuplicates(tempUtilizedERC20);
		tempUtilizedERC20 = I_YIELD_SYNC_V1_EMP_ARRAY_UTILITY.sort(tempUtilizedERC20);

		uint256 utilizedERC20AllocationTotal;

		UtilizationERC20[] memory utilizationERC20 = new UtilizationERC20[](tempUtilizedERC20.length);


		/**
		 * This is not done in the loop above because the utilizedERC20 has to be cleaned first before adding the
		 * utilizations to the values.
		 */

		// For each strategy..
		for (uint256 i = 0; i < _utilizedYieldSyncV1EMPStrategy.length; i++)
		{
			// Initialize an interface for the strategy
			IYieldSyncV1EMPStrategy iYieldSyncV1EMPStrategy = IYieldSyncV1EMPStrategy(_utilizedYieldSyncV1EMPStrategy[i]);

			// For each utilized erc20 for stategy..
			for (uint256 ii = 0; ii < tempUtilizedERC20.length; ii++)
			{
				/**
				 * The objective here is to set the utilization for each ERC20
				 */
				// Get the utilization
				UtilizationERC20 memory utilizationERC20_ = iYieldSyncV1EMPStrategy.utilizedERC20_utilizationERC20(
					tempUtilizedERC20[ii]
				);

				// If for depositing..
				if (utilizationERC20_.deposit)
				{
					utilizationERC20[ii].deposit = true;

					// Multiple the allocation for the ERC20 on the strategy with the EMP strategy allocation
					uint256 utilizationERC20Allocation = utilizationERC20_.allocation.mul(
						utilizedYieldSyncV1EMPStrategy_allocation[_utilizedYieldSyncV1EMPStrategy[i]]
					).div(
						1e18
					);

					// Add the allocation to anything that exists before
					utilizationERC20[ii].allocation += utilizationERC20Allocation; // On EMP it is queried by address not placement

					// Add to the total sum of allocation total
					utilizedERC20AllocationTotal += utilizationERC20Allocation;
				}

				// If the token is withdrawn set the withdrawn to true
				if (utilizationERC20_.withdraw)
				{
					utilizationERC20[ii].withdraw = true;
				}
			}
		}

		// Check that the total alocation is 100%
		require(utilizedERC20AllocationTotal == ONE_HUNDRED_PERCENT, "!(utilizedERC20AllocationTotal == ONE_HUNDRED_PERCENT)");

		_utilizedERC20 = tempUtilizedERC20;

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			_utilizedERC20_utilizationERC20[_utilizedERC20[i]] = utilizationERC20[i];

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
