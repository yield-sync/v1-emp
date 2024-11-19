// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IAccessControl } from "@openzeppelin/contracts/access/IAccessControl.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import { IERC20, IV1EMP } from "./interface/IV1EMP.sol";
import { IV1EMPRegistry } from "./interface/IV1EMPRegistry.sol";
import { IV1EMPStrategy } from "./interface/IV1EMPStrategy.sol";
import { IV1EMPUtility } from "./interface/IV1EMPUtility.sol";


contract V1EMP is
	ReentrancyGuard,
	ERC20,
	IV1EMP
{
	using SafeMath for uint256;


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


	function _authGovernanceOrManager()
		internal
	{
		require(
			msg.sender == manager || IAccessControl(_I_V1_EMP_REGISTRY.governance()).hasRole(bytes32(0), msg.sender),
			"!authorized"
		);
	}

	modifier authGovernanceOrManager()
	{
		_authGovernanceOrManager();

		_;
	}

	function _utilizedERC20DepositOpenRequired()
		internal
		view
	{
		require(utilizedERC20DepositOpen, "!utilizedERC20DepositOpen");
	}

	modifier utilizedERC20DepositOpenRequired()
	{
		_utilizedERC20DepositOpenRequired();

		_;
	}


	/// @notice view


	// @inheritdoc IV1EMPUtility
	function utilizedERC20TotalBalance()
		public
		view
		returns (uint256[] memory utilizedERC20TotalAmount_)
	{
		address[] memory _utilizedERC20 = _I_V1_EMP_UTILITY.v1EMP_utilizedERC20(address(this));

		utilizedERC20TotalAmount_ = new uint256[](_utilizedERC20.length);

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			utilizedERC20TotalAmount_[i] += IERC20(_utilizedERC20[i]).balanceOf(address(this));

			for (uint256 ii = 0; ii < _utilizedV1EMPStrategy.length; ii++)
			{
				utilizedERC20TotalAmount_[i] += IV1EMPStrategy(_utilizedV1EMPStrategy[ii]).utilizedERC20TotalBalance(
					_utilizedERC20[i]
				);
			}
		}
	}

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
		if (feeRateGovernance.add(_feeRateManager) > _I_V1_EMP_REGISTRY.ONE_HUNDRED_PERCENT())
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
		require(IAccessControl(_I_V1_EMP_REGISTRY.governance()).hasRole(bytes32(0), msg.sender), "!authorized");

		if (_feeRateGovernance.add(feeRateManager) > _I_V1_EMP_REGISTRY.ONE_HUNDRED_PERCENT())
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
		utilizedStrategySync();

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

		uint256 mintAmountManager = utilizedERC20AmountTotalETHValue.mul(feeRateManager).div(1e18);

		uint256 mintAmountGovernancePayTo = utilizedERC20AmountTotalETHValue.mul(feeRateGovernance).div(1e18);

		_mint(manager, mintAmountManager);

		_mint(_I_V1_EMP_REGISTRY.governancePayTo(), mintAmountGovernancePayTo);

		_mint(msg.sender, utilizedERC20AmountTotalETHValue.sub(mintAmountManager).sub(mintAmountGovernancePayTo));
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
	function utilizedStrategySync()
		public
		override
	{
		_I_V1_EMP_UTILITY.utilizedStrategySync();

		address[] memory utilizedERC20 = _I_V1_EMP_UTILITY.v1EMP_utilizedERC20(address(this));

		for (uint256 i = 0; i < _utilizedV1EMPStrategy.length; i++)
		{
			for (uint256 ii = 0; ii < utilizedERC20.length; ii++)
			{
				address v1EMPStrategyInteractor = address(IV1EMPStrategy(_utilizedV1EMPStrategy[i]).iV1EMPStrategyInteractor());

				if (v1EMPStrategyInteractor == address(0))
				{
					continue;
				}

				if (IERC20(utilizedERC20[ii]).allowance(address(this), v1EMPStrategyInteractor) != type(uint256).max)
				{
					IERC20(utilizedERC20[ii]).approve(v1EMPStrategyInteractor, type(uint256).max);
				}
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

		utilizedStrategySync();

		address[] memory _utilizedERC20 = _I_V1_EMP_UTILITY.v1EMP_utilizedERC20(address(this));

		bool utilizedERC20Available = true;

		uint256[] memory transferAmount = new uint256[](_utilizedERC20.length);

		uint256[] memory utilizedERC20TotalAmount = utilizedERC20TotalBalance();

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			transferAmount[i] = utilizedERC20TotalAmount[i].mul(_eRC20Amount).div(totalSupply(), "!computed");

			if (IERC20(_utilizedERC20[i]).balanceOf(address(this)) < transferAmount[i])
			{
				utilizedERC20Available = false;
			}
		}

		address[] memory utilizedERC20 = _I_V1_EMP_UTILITY.v1EMP_utilizedERC20(address(this));

		if (!utilizedERC20Available)
		{
			if (!utilizedERC20WithdrawFull)
			{
				revert("!(utilizedERC20Available)");
			}

			uint256[] memory v1EMPStrategyERC20Amount = new uint256[](_utilizedV1EMPStrategy.length);

			uint256 _eRC20AmountPercentOfTotalSupply = _eRC20Amount.mul(1e18).div(totalSupply());

			for (uint256 i = 0; i < _utilizedV1EMPStrategy.length; i++)
			{
				v1EMPStrategyERC20Amount[i] = _eRC20AmountPercentOfTotalSupply.mul(
					IV1EMPStrategy(_utilizedV1EMPStrategy[i]).eMP_shares(address(this))
				).div(
					1e18
				);
			}

			utilizedV1EMPStrategyWithdraw(v1EMPStrategyERC20Amount);
		}

		for (uint256 i = 0; i < utilizedERC20.length; i++)
		{
			IERC20(utilizedERC20[i]).transfer(
				msg.sender,
				_I_V1_EMP_UTILITY.optimizedTransferAmount(address(this), utilizedERC20[i], transferAmount[i])
			);
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
			IV1EMPStrategy(_utilizedV1EMPStrategy[i]).utilizedERC20Deposit(_v1EMPStrategyUtilizedERC20Amount[i]);
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

		utilizedStrategySync();
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

		utilizedStrategySync();

		for (uint256 i = 0; i < _utilizedV1EMPStrategy.length; i++)
		{
			if (_v1EMPStrategyERC20Amount[i] == 0)
			{
				continue;
			}

			IV1EMPStrategy(_utilizedV1EMPStrategy[i]).utilizedERC20Withdraw(_v1EMPStrategyERC20Amount[i]);
		}
	}
}
