// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IAccessControlEnumerable } from "@openzeppelin/contracts/access/IAccessControlEnumerable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { IERC20, IV1EMP } from "./interface/IV1EMP.sol";
import { IV1EMPRegistry } from "./interface/IV1EMPRegistry.sol";
import { IV1EMPStrategy } from "./interface/IV1EMPStrategy.sol";
import { IV1EMPUtility } from "./interface/IV1EMPUtility.sol";


contract V1EMP is
	ReentrancyGuard,
	ERC20,
	IV1EMP
{
	address public override manager;

	address[] internal _utilizedV1EMPStrategy;

	bool public override utilizedERC20DepositOpen;
	bool public override utilizedERC20WithdrawFull;
	bool public override utilizedERC20WithdrawOpen;

	uint256 public override feeRateGovernance;
	uint256 public override feeRateManager;

	IV1EMPRegistry internal immutable _I_V1_EMP_REGISTRY;
	IV1EMPUtility internal immutable _I_V1_EMP_UTILITY;

	mapping (address utilizedV1EMPStrategy => uint256 allocation) public override utilizedV1EMPStrategy_allocation;

	constructor (
		address _manager,
		address _v1EMPRegistry,
		bool _utilizedERC20WithdrawFull,
		string memory _name,
		string memory _symbol
	)
		ERC20(_name, _symbol)
	{
		manager = _manager;
		utilizedERC20WithdrawFull = _utilizedERC20WithdrawFull;

		_I_V1_EMP_REGISTRY = IV1EMPRegistry(_v1EMPRegistry);
		_I_V1_EMP_UTILITY = IV1EMPUtility(_I_V1_EMP_REGISTRY.v1EMPUtility());
	}


	modifier authGovernanceOrManager()
	{
		require(
			msg.sender == manager || IAccessControlEnumerable(_I_V1_EMP_REGISTRY.GOVERNANCE()).hasRole(bytes32(0), msg.sender),
			"!authorized"
		);

		_;
	}

	modifier utilizedERC20DepositOpenRequired()
	{
		require(utilizedERC20DepositOpen, "!utilizedERC20DepositOpen");

		_;
	}


	/// @notice view


	/// @inheritdoc IV1EMP
	function utilizedV1EMPStrategy()
		public
		view
		override
		returns (address[] memory)
	{
		return _utilizedV1EMPStrategy;
	}


	/// @notice mutative


	/// @inheritdoc IV1EMP
	function feeRateManagerUpdate(uint256 _feeRateManager)
		public
		authGovernanceOrManager()
	{
		if (feeRateGovernance + _feeRateManager > _I_V1_EMP_REGISTRY.ONE_HUNDRED_PERCENT())
		{
			revert("!(_feeRateManager)");
		}

		feeRateManager = _feeRateManager;
	}

	/// @inheritdoc IV1EMP
	function feeRateGovernanceUpdate(uint256 _feeRateGovernance)
		public
		override
	{
		require(IAccessControlEnumerable(_I_V1_EMP_REGISTRY.GOVERNANCE()).hasRole(bytes32(0), msg.sender), "!authorized");

		if (_feeRateGovernance + feeRateManager > _I_V1_EMP_REGISTRY.ONE_HUNDRED_PERCENT())
		{
			revert("!(_feeRateGovernance)");
		}

		feeRateGovernance = _feeRateGovernance;
	}

	/// @inheritdoc IV1EMP
	function managerUpdate(address _manager)
		public
		override
		authGovernanceOrManager()
	{
		manager = _manager;
	}

	/// @inheritdoc IV1EMP
	function utilizedERC20Deposit(uint256[] memory _utilizedERC20Amount)
		public
		override
		nonReentrant()
		utilizedERC20DepositOpenRequired()
	{
		utilizedERC20Update();

		(
			bool valid,
			uint256 utilizedERC20AmountTotalETHValue,
			string memory message
		) = _I_V1_EMP_UTILITY.utilizedERC20AmountValid(
			address(this),
			_utilizedERC20Amount
		);

		require(valid, message);

		address[] memory _utilizedERC20 = _I_V1_EMP_UTILITY.v1EMP_utilizedERC20(address(this));

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			IERC20(_utilizedERC20[i]).transferFrom(msg.sender, address(this), _utilizedERC20Amount[i]);
		}

		uint256 mintAmountManager = utilizedERC20AmountTotalETHValue * feeRateManager / 1e18;

		uint256 mintAmountGovernancePayTo = utilizedERC20AmountTotalETHValue * feeRateGovernance / 1e18;

		_mint(manager, mintAmountManager);
		_mint(_I_V1_EMP_REGISTRY.governancePayTo(), mintAmountGovernancePayTo);
		_mint(msg.sender, utilizedERC20AmountTotalETHValue - mintAmountManager - mintAmountGovernancePayTo);
	}

	/// @inheritdoc IV1EMP
	function utilizedERC20DepositOpenToggle()
		public
		override
		authGovernanceOrManager()
	{
		utilizedERC20DepositOpen = !utilizedERC20DepositOpen;
	}

	/// @inheritdoc IV1EMP
	function utilizedERC20Update()
		public
		override
	{
		_I_V1_EMP_UTILITY.utilizedERC20Update();

		address[] memory __utilizedERC20 = _I_V1_EMP_UTILITY.v1EMP_utilizedERC20(address(this));

		for (uint256 i = 0; i < _utilizedV1EMPStrategy.length; i++)
		{
			for (uint256 ii = 0; ii < __utilizedERC20.length; ii++)
			{
				IERC20(__utilizedERC20[ii]).approve(
					address(IV1EMPStrategy(_utilizedV1EMPStrategy[i]).iV1EMPStrategyInteractor()),
					type(uint256).max
				);
			}
		}
	}

	/// @inheritdoc IV1EMP
	function utilizedERC20Withdraw(uint256 _eRC20Amount)
		public
		override
		nonReentrant()
	{
		require(utilizedERC20WithdrawOpen, "!utilizedERC20WithdrawOpen");

		require(balanceOf(msg.sender) >= _eRC20Amount, "!(balanceOf(msg.sender) >= _eRC20Amount)");

		utilizedERC20Update();

		(
			bool utilizedERC20Available,
			uint256[] memory transferAmount
		) = _I_V1_EMP_UTILITY.utilizedERC20AvailableAndTransferAmount(
			address(this),
			_eRC20Amount
		);

		if (utilizedERC20Available)
		{
			for (uint256 i = 0; i < _I_V1_EMP_UTILITY.v1EMP_utilizedERC20(address(this)).length; i++)
			{
				transfer(msg.sender, transferAmount[i]);
			}
		}
		else
		{
			if (!utilizedERC20WithdrawFull)
			{
				revert("!(utilizedERC20Available)");
			}

			uint256[] memory v1EMPStrategyERC20Amount = new uint256[](_utilizedV1EMPStrategy.length);

			uint256 _eRC20AmountPercentOfTotalSupply = _eRC20Amount * 1e18 / totalSupply();

			for (uint256 i = 0; i < _utilizedV1EMPStrategy.length; i++)
			{
				v1EMPStrategyERC20Amount[i] = _eRC20AmountPercentOfTotalSupply * IV1EMPStrategy(_utilizedV1EMPStrategy[i]).eMP_equity(
					address(this)
				) / 1e18;
			}

			utilizedV1EMPStrategyWithdraw(v1EMPStrategyERC20Amount);
		}

		_burn(msg.sender, _eRC20Amount);
	}

	/// @inheritdoc IV1EMP
	function utilizedERC20WithdrawFullToggle()
		public
		override
		authGovernanceOrManager()
	{
		utilizedERC20WithdrawFull = !utilizedERC20WithdrawFull;
	}

	/// @inheritdoc IV1EMP
	function utilizedERC20WithdrawOpenToggle()
		public
		override
		authGovernanceOrManager()
	{
		utilizedERC20WithdrawOpen = !utilizedERC20WithdrawOpen;
	}

	/// @inheritdoc IV1EMP
	function utilizedV1EMPStrategyDeposit(uint256[][] memory _v1EMPStrategyUtilizedERC20Amount)
		public
		override
		utilizedERC20DepositOpenRequired()
	{
		(bool valid, string memory message) = _I_V1_EMP_UTILITY.v1EMPStrategyUtilizedERC20AmountValid(
			address(this),
			_v1EMPStrategyUtilizedERC20Amount
		);

		require(valid, message);

		for (uint256 i = 0; i < _utilizedV1EMPStrategy.length; i++)
		{
			IV1EMPStrategy(_utilizedV1EMPStrategy[i]).utilizedERC20Deposit(address(this), _v1EMPStrategyUtilizedERC20Amount[i]);
		}
	}

	/// @inheritdoc IV1EMP
	function utilizedV1EMPStrategyUpdate(address[] memory _v1EMPStrategy, uint256[] memory _allocation)
		public
		override
		authGovernanceOrManager()
	{
		require(
			!utilizedERC20DepositOpen && !utilizedERC20WithdrawOpen,
			"!(!utilizedERC20DepositOpen && !utilizedERC20WithdrawOpen)"
		);

		(bool valid, string memory message) = _I_V1_EMP_UTILITY.utilizedV1EMPStrategyValid(
			address(this),
			_v1EMPStrategy,
			_allocation
		);

		require(valid, message);

		delete _utilizedV1EMPStrategy;

		for (uint256 i = 0; i < _v1EMPStrategy.length; i++)
		{
			_utilizedV1EMPStrategy.push(_v1EMPStrategy[i]);

			utilizedV1EMPStrategy_allocation[_v1EMPStrategy[i]] = _allocation[i];
		}

		utilizedERC20Update();
	}

	/// @inheritdoc IV1EMP
	function utilizedV1EMPStrategyWithdraw(uint256[] memory _v1EMPStrategyERC20Amount)
		public
		override
		authGovernanceOrManager()
	{
		require(
			_v1EMPStrategyERC20Amount.length == _utilizedV1EMPStrategy.length,
			"!(_v1EMPStrategyERC20Amount.length == _utilizedV1EMPStrategy.length)"
		);

		utilizedERC20Update();

		for (uint256 i = 0; i < _utilizedV1EMPStrategy.length; i++)
		{
			if (_v1EMPStrategyERC20Amount[i] > 0)
			{
				IV1EMPStrategy(_utilizedV1EMPStrategy[i]).utilizedERC20Withdraw(_v1EMPStrategyERC20Amount[i]);
			}
		}
	}
}
