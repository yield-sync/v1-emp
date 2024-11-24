// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import { IV1EMPRegistry } from "./interface/IV1EMPRegistry.sol";
import { IV1EMPStrategyUtility } from "./interface/IV1EMPStrategyUtility.sol";
import { IV1EMPStrategy, IV1EMPStrategyInteractor, UtilizationERC20 } from "./interface/IV1EMPStrategy.sol";


contract V1EMPStrategy is
	ReentrancyGuard,
	IV1EMPStrategy
{
	using SafeMath for uint256;


	address public override manager;

	address[] internal _utilizedERC20;

	bool public override utilizedERC20DepositOpen;
	bool public override utilizedERC20WithdrawOpen;

	uint256 public override sharesTotal;
	uint256 public override utilizedERC20UpdateTracker;

	IV1EMPRegistry internal immutable _I_V1_EMP_REGISTRY;
	IV1EMPStrategyUtility internal immutable _I_V1_EMP_STRATEGY_UTILITY;

	IV1EMPStrategyInteractor public override iV1EMPStrategyInteractor;

	mapping (address utilizedERC20 => UtilizationERC20 utilizationERC20) internal _utilizedERC20_utilizationERC20;

	/// @inheritdoc IV1EMPStrategy
	function utilizedERC20_utilizationERC20(address __utilizedERC20)
		public
		view
		override
		returns (UtilizationERC20 memory)
	{
		return _utilizedERC20_utilizationERC20[__utilizedERC20];
	}

	mapping (address eMP => uint256 shares) public override eMP_shares;


	constructor (address _manager, address _v1EMPRegistry)
	{
		utilizedERC20DepositOpen = false;
		utilizedERC20WithdrawOpen = false;

		manager = _manager;

		utilizedERC20UpdateTracker = 0;

		_I_V1_EMP_REGISTRY = IV1EMPRegistry(_v1EMPRegistry);
		_I_V1_EMP_STRATEGY_UTILITY = IV1EMPStrategyUtility(_I_V1_EMP_REGISTRY.v1EMPStrategyUtility());
	}


	function _authEMP()
		internal
		view
	{
		require(_I_V1_EMP_REGISTRY.v1EMP_v1EMPId(msg.sender) > 0, "!authorized");
	}

	modifier authEMP()
	{
		_authEMP();

		_;
	}

	function _authManager()
		internal
		view
	{
		require(manager == msg.sender, "!authorized");
	}

	modifier authManager()
	{
		_authManager();

		_;
	}

	function _initialized()
		internal
		view
	{
		require(address(iV1EMPStrategyInteractor) != address(0), "!(address(iV1EMPStrategyInteractor) != address(0))");
	}

	modifier initialized()
	{
		_initialized();

		_;
	}

	function _utilizedERC20TransferClosed()
		internal
		view
	{
		require(
			!utilizedERC20DepositOpen && !utilizedERC20WithdrawOpen,
			"!(!utilizedERC20DepositOpen && !utilizedERC20WithdrawOpen)"
		);
	}

	modifier utilizedERC20TransferClosed()
	{
		_utilizedERC20TransferClosed();

		_;
	}


	/// @notice view


	/// @inheritdoc IV1EMPStrategy
	function utilizedERC20()
		public
		view
		override
		returns (address[] memory utilizedERC20_)
	{
		return _utilizedERC20;
	}

	/// @inheritdoc IV1EMPStrategy
	function utilizedERC20AmountETHValue(uint256[] memory _utilizedERC20Amount)
		public
		view
		override
		returns (uint256 utilizedERC20AmountETHValueTotal_, uint256[] memory utilizedERC20AmountETHValue_)
	{
		(
			utilizedERC20AmountETHValueTotal_,
			utilizedERC20AmountETHValue_
		) = _I_V1_EMP_STRATEGY_UTILITY.utilizedERC20AmountETHValue(
			address(this),
			_utilizedERC20Amount
		);
	}

	/// @inheritdoc IV1EMPStrategy
	function utilizedERC20TotalBalance(address __utilizedERC20)
		public
		view
		override
		returns (uint256 utilizedERC20TotalAmount_)
	{
		require(address(iV1EMPStrategyInteractor) != address(0), "!(address(iV1EMPStrategyInteractor) != address(0))");

		return iV1EMPStrategyInteractor.utilizedERC20TotalBalance(__utilizedERC20);
	}


	/// @notice mutative


	/// @inheritdoc IV1EMPStrategy
	function iV1EMPStrategyInteractorUpdate(address _iStrategyInteractor)
		public
		override
		authManager()
		utilizedERC20TransferClosed()
	{
		require(_iStrategyInteractor != address(0), "!_iStrategyInteractor");

		iV1EMPStrategyInteractor = IV1EMPStrategyInteractor(_iStrategyInteractor);
	}

	/// @inheritdoc IV1EMPStrategy
	function managerUpdate(address _manager)
		public
		override
		authManager()
	{
		require(_manager != address(0), "!_manager");

		manager = _manager;
	}

	/// @inheritdoc IV1EMPStrategy
	function utilizedERC20Update(address[] memory __utilizedERC20, UtilizationERC20[] memory _utilizationERC20)
		public
		override
		authManager()
		utilizedERC20TransferClosed()
	{
		(bool valid, string memory message) = _I_V1_EMP_STRATEGY_UTILITY.utilizedERC20UpdateValid(
			address(this),
			__utilizedERC20,
			_utilizationERC20
		);

		require(valid, message);

		delete _utilizedERC20;

		_utilizedERC20 = __utilizedERC20;

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			_utilizedERC20_utilizationERC20[_utilizedERC20[i]] = _utilizationERC20[i];
		}

		_utilizedERC20 = _I_V1_EMP_STRATEGY_UTILITY.utilizedERC20Sort(_utilizedERC20);

		utilizedERC20UpdateTracker++;
	}

	/// @inheritdoc IV1EMPStrategy
	function utilizedERC20Deposit(uint256[] memory _utilizedERC20Amount)
		public
		override
		authEMP()
		nonReentrant()
		initialized()
	{
		require(utilizedERC20DepositOpen, "!utilizedERC20DepositOpen");

		(
			bool valid,
			string memory message,
			uint256 utilizedERC20AmountETHValueTotal
		) = _I_V1_EMP_STRATEGY_UTILITY.depositAmountsValid(
			address(this),
			_utilizedERC20Amount
		);

		require(valid, message);

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			iV1EMPStrategyInteractor.utilizedERC20Deposit(msg.sender, _utilizedERC20[i], _utilizedERC20Amount[i]);
		}

		sharesTotal += utilizedERC20AmountETHValueTotal;

		eMP_shares[msg.sender] += utilizedERC20AmountETHValueTotal;
	}

	/// @inheritdoc IV1EMPStrategy
	function utilizedERC20DepositOpenUpdate(bool _utilizedERC20DepositOpen)
		public
		override
		authManager()
		initialized()
	{
		utilizedERC20DepositOpen = _utilizedERC20DepositOpen;
	}

	/// @inheritdoc IV1EMPStrategy
	function utilizedERC20Withdraw(uint256 _shares)
		public
		override
		authEMP()
		nonReentrant()
		initialized()
	{
		require(utilizedERC20WithdrawOpen, "!utilizedERC20WithdrawOpen");

		require(eMP_shares[msg.sender] >= _shares, "!(eMP_shares[msg.sender] >= _shares)");

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			if (_utilizedERC20_utilizationERC20[_utilizedERC20[i]].withdraw)
			{
				uint256 utilizedERC20AmountPerShare = iV1EMPStrategyInteractor.utilizedERC20TotalBalance(_utilizedERC20[i]).mul(
					1e18
				).div(
					sharesTotal,
					"!computed"
				);

				iV1EMPStrategyInteractor.utilizedERC20Withdraw(
					msg.sender,
					_utilizedERC20[i],
					utilizedERC20AmountPerShare.mul(_shares).div(1e18)
				);
			}
		}

		sharesTotal -= _shares;

		eMP_shares[msg.sender] -= _shares;
	}

	/// @inheritdoc IV1EMPStrategy
	function utilizedERC20WithdrawOpenUpdate(bool _utilizedERC20WithdrawOpe)
		public
		override
		authManager()
		initialized()
	{
		utilizedERC20WithdrawOpen = _utilizedERC20WithdrawOpe;
	}
}
