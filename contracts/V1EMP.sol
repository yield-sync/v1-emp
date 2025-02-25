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


	/// @inheritdoc IV1EMP
	address public override manager;

	address[] internal _utilizedV1EMPStrategy;

	/// @inheritdoc IV1EMP
	bool public override utilizedERC20DepositOpen;
	/// @inheritdoc IV1EMP
	bool public override utilizedERC20WithdrawFull;
	/// @inheritdoc IV1EMP
	bool public override utilizedERC20WithdrawOpen;

	/// @inheritdoc IV1EMP
	uint256 public override feeRateGovernance;
	/// @inheritdoc IV1EMP
	uint256 public override feeRateManager;

	IV1EMPRegistry internal immutable _I_V1_EMP_REGISTRY;

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
	}


	modifier authGovernanceOrManager()
	{
		_authGovernanceOrManager();

		_;
	}

	modifier executeUtilizedV1EMPStrategySync()
	{
		utilizedV1EMPStrategySync();

		_;
	}

	modifier requireUtilizedERC20DepositOpen()
	{
		_requireUtilizedERC20DepositOpen();

		_;
	}


	/// @notice internal


	function _authGovernanceOrManager()
		internal
		view
	{
		require(
			msg.sender == manager || IAccessControl(_I_V1_EMP_REGISTRY.governance()).hasRole(bytes32(0), msg.sender),
			"!authorized"
		);
	}

	function _requireUtilizedERC20DepositOpen()
		internal
		view
	{
		require(utilizedERC20DepositOpen, "!utilizedERC20DepositOpen");
	}

	function _utilizedV1EMPStrategyWithdraw(uint256[] memory _v1EMPStrategyERC20Amount)
		internal
		executeUtilizedV1EMPStrategySync()
	{
		require(
			_v1EMPStrategyERC20Amount.length == _utilizedV1EMPStrategy.length,
			"!_v1EMPStrategyERC20Amount"
		);

		for (uint256 i = 0; i < _utilizedV1EMPStrategy.length; i++)
		{
			if (_v1EMPStrategyERC20Amount[i] != 0)
			{
				IV1EMPStrategy(_utilizedV1EMPStrategy[i]).utilizedERC20Withdraw(_v1EMPStrategyERC20Amount[i]);
			}
		}
	}

	function _I_V1_EMP_UTILITY()
		internal
		view
		returns (IV1EMPUtility)
	{
		return IV1EMPUtility(_I_V1_EMP_REGISTRY.v1EMPUtility());
	}


	/// @notice view


	/// @inheritdoc IV1EMP
	function utilizedERC20TotalBalance()
		public
		view
		override
		returns (uint256[] memory utilizedERC20TotalAmount_)
	{
		address[] memory _utilizedERC20 = _I_V1_EMP_UTILITY().v1EMP_utilizedERC20(address(this));

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
		require(feeRateGovernance.add(_feeRateManager) <= _I_V1_EMP_UTILITY().percentOneHundred(), "!_feeRateManager");

		feeRateManager = _feeRateManager;
	}

	/// @inheritdoc IV1EMP
	function feeRateGovernanceUpdate(uint256 _feeRateGovernance)
		public
		override
	{
		require(IAccessControl(_I_V1_EMP_REGISTRY.governance()).hasRole(bytes32(0), msg.sender), "!authorized");

		require(_feeRateGovernance.add(feeRateManager) <= _I_V1_EMP_UTILITY().percentOneHundred(), "!_feeRateGovernance");

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
		requireUtilizedERC20DepositOpen()
		executeUtilizedV1EMPStrategySync()
	{
		(
			bool valid,
			uint256 utilizedERC20AmountTotalETHValue,
			string memory message
		) = _I_V1_EMP_UTILITY().utilizedERC20AmountValid(
			address(this),
			_utilizedERC20Amount
		);

		require(valid, message);

		address[] memory _utilizedERC20 = _I_V1_EMP_UTILITY().v1EMP_utilizedERC20(address(this));

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			IERC20(_utilizedERC20[i]).transferFrom(msg.sender, address(this), _utilizedERC20Amount[i]);
		}

		uint256 percentOneHundred = _I_V1_EMP_UTILITY().percentOneHundred();

		uint256 mintAmountManager = utilizedERC20AmountTotalETHValue.mul(feeRateManager).div(percentOneHundred);

		uint256 mintAmountGovernancePayTo = utilizedERC20AmountTotalETHValue.mul(feeRateGovernance).div(percentOneHundred);

		_mint(manager, mintAmountManager);

		_mint(_I_V1_EMP_REGISTRY.governancePayTo(), mintAmountGovernancePayTo);

		_mint(msg.sender, utilizedERC20AmountTotalETHValue.sub(mintAmountManager).sub(mintAmountGovernancePayTo));
	}

	/// @inheritdoc IV1EMP
	function utilizedERC20DepositOpenUpdate(bool _utilizedERC20DepositOpen)
		public
		override
		authGovernanceOrManager()
	{
		utilizedERC20DepositOpen = _utilizedERC20DepositOpen;
	}

	/// @inheritdoc IV1EMP
	function utilizedERC20Withdraw(uint256 _eRC20Amount)
		public
		override
		nonReentrant()
		executeUtilizedV1EMPStrategySync()
	{
		require(utilizedERC20WithdrawOpen, "!utilizedERC20WithdrawOpen");

		require(balanceOf(msg.sender) >= _eRC20Amount, "!_eRC20Amount");

		address[] memory _utilizedERC20 = _I_V1_EMP_UTILITY().v1EMP_utilizedERC20(address(this));

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

		address[] memory utilizedERC20 = _I_V1_EMP_UTILITY().v1EMP_utilizedERC20(address(this));

		if (!utilizedERC20Available)
		{
			require(utilizedERC20WithdrawFull, "!utilizedERC20WithdrawFull");

			uint256[] memory v1EMPStrategyERC20Amount = new uint256[](_utilizedV1EMPStrategy.length);

			for (uint256 i = 0; i < _utilizedV1EMPStrategy.length; i++)
			{
				uint256 percentOneHundred = _I_V1_EMP_UTILITY().percentOneHundred();

				uint256 _eRC20AmountPercentOfTotalSupply = _eRC20Amount.mul(percentOneHundred).div(totalSupply());

				v1EMPStrategyERC20Amount[i] = _eRC20AmountPercentOfTotalSupply.mul(
					IV1EMPStrategy(_utilizedV1EMPStrategy[i]).eMP_shares(address(this))
				).div(
					percentOneHundred
				);
			}

			_utilizedV1EMPStrategyWithdraw(v1EMPStrategyERC20Amount);
		}

		for (uint256 i = 0; i < utilizedERC20.length; i++)
		{
			IERC20(utilizedERC20[i]).transfer(
				msg.sender,
				_I_V1_EMP_UTILITY().optimizedTransferAmount(address(this), utilizedERC20[i], transferAmount[i])
			);
		}

		_burn(msg.sender, _eRC20Amount);
	}

	/// @inheritdoc IV1EMP
	function utilizedERC20WithdrawFullUpdate(bool _utilizedERC20WithdrawFull)
		public
		override
		authGovernanceOrManager()
	{
		utilizedERC20WithdrawFull = _utilizedERC20WithdrawFull;
	}

	/// @inheritdoc IV1EMP
	function utilizedERC20WithdrawOpenUpdate(bool _utilizedERC20WithdrawOpen)
		public
		override
		authGovernanceOrManager()
	{
		utilizedERC20WithdrawOpen = _utilizedERC20WithdrawOpen;
	}

	/// @inheritdoc IV1EMP
	function utilizedV1EMPStrategyDeposit(uint256[][] memory _v1EMPStrategyUtilizedERC20Amount)
		public
		override
		requireUtilizedERC20DepositOpen()
	{
		(bool valid, string memory message) = _I_V1_EMP_UTILITY().v1EMPStrategyUtilizedERC20AmountValid(
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
			"utilizedERC20DepositOpen || utilizedERC20WithdrawOpen"
		);

		(bool valid, string memory message) = _I_V1_EMP_UTILITY().utilizedV1EMPStrategyValid(
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

		utilizedV1EMPStrategySync();
	}

	/// @inheritdoc IV1EMP
	function utilizedV1EMPStrategySync()
		public
		override
	{
		_I_V1_EMP_UTILITY().utilizedV1EMPStrategySync();

		address[] memory utilizedERC20 = _I_V1_EMP_UTILITY().v1EMP_utilizedERC20(address(this));

		for (uint256 i = 0; i < _utilizedV1EMPStrategy.length; i++)
		{
			for (uint256 ii = 0; ii < utilizedERC20.length; ii++)
			{
				address eRC20Handler = address(IV1EMPStrategy(_utilizedV1EMPStrategy[i]).iERC20Handler());

				if (eRC20Handler == address(0))
				{
					continue;
				}

				if (IERC20(utilizedERC20[ii]).allowance(address(this), eRC20Handler) != type(uint256).max)
				{
					IERC20(utilizedERC20[ii]).approve(eRC20Handler, type(uint256).max);
				}
			}
		}
	}

	/// @inheritdoc IV1EMP
	function utilizedV1EMPStrategyWithdraw(uint256[] memory _v1EMPStrategyERC20Amount)
		public
		override
		authGovernanceOrManager()
		nonReentrant()
	{
		_utilizedV1EMPStrategyWithdraw(_v1EMPStrategyERC20Amount);
	}
}
