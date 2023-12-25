
// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import {
	IERC20,
	IYieldSyncV1EMPStrategyInteractor,
	IYieldSyncV1EMPStrategy,
	SafeERC20
} from "./interface/IYieldSyncV1EMPStrategy.sol";


using SafeERC20 for IERC20;


contract YieldSyncV1EMPStrategy is
	ERC20,
	IYieldSyncV1EMPStrategy,
	ReentrancyGuard
{
	address public immutable manager;

	address[] internal _utilizedERC20;

	bool public override utilizedERC20DepositOpen;
	bool public override utilizedERC20WithdrawOpen;

	uint256 constant public override ONE_HUNDRED_PERCENT = 1e18;

	mapping (address utilizedERC20 => uint256 allocation) internal _utilizedERC20_allocation;

	IYieldSyncV1EMPStrategyInteractor public override yieldSyncV1EMPStrategyInteractor;


	receive ()
		external
		payable
	{}


	fallback ()
		external
		payable
	{}


	constructor (address _manager, string memory _name, string memory _symbol)
		ERC20(_name, _symbol)
	{
		utilizedERC20DepositOpen = false;
		utilizedERC20WithdrawOpen = false;

		manager = _manager;
	}


	modifier authManager()
	{
		require(manager == msg.sender, "manager != msg.sender");

		_;
	}

	modifier setYieldSyncV1EMPStrategyInteractor()
	{
		require(
			address(yieldSyncV1EMPStrategyInteractor) != address(0),
			"address(yieldSyncV1EMPStrategyInteractor) == address(0)"
		);

		_;
	}


	//// @notice view


	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20()
		public
		view
		override
		returns (address[] memory)
	{
		return _utilizedERC20;
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20_allocation(address __utilizedERC20)
		public
		view
		override
		returns (uint256 _allocation)
	{
		return _utilizedERC20_allocation[__utilizedERC20];
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function balanceOfETHValue(address _target)
		public
		view
		override
		setYieldSyncV1EMPStrategyInteractor()
		returns (uint256 balanceOfETHValue_)
	{
		uint256[] memory uTAPB = utilizedERC20AmountPerBurn();

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			balanceOfETHValue_ += SafeMath.mul(
				uTAPB[i],
				balanceOf(_target) * yieldSyncV1EMPStrategyInteractor.utilizedERC20ETHValue(_utilizedERC20[i])
			);
		}
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20AmountValid(uint256[] memory _utilizedERC20Amount)
		public
		view
		setYieldSyncV1EMPStrategyInteractor()
		returns (bool utilizedERC20AmountValid_)
	{
		utilizedERC20AmountValid_ = true;

		uint256 utilizedERC20AmountTotalETHValue;

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			utilizedERC20AmountTotalETHValue += SafeMath.div(
				SafeMath.mul(
					SafeMath.mul(_utilizedERC20Amount[i], 10 ** (18 - ERC20(_utilizedERC20[i]).decimals())),
					yieldSyncV1EMPStrategyInteractor.utilizedERC20ETHValue(_utilizedERC20[i])
				),
				1e18
			);
		}

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			(bool computed, uint256 amountAllocationActual) = SafeMath.tryDiv(
				SafeMath.mul(
					SafeMath.div(
						SafeMath.mul(
							_utilizedERC20Amount[i],
							yieldSyncV1EMPStrategyInteractor.utilizedERC20ETHValue(_utilizedERC20[i])
						),
						10 ** ERC20(_utilizedERC20[i]).decimals()
					),
					1e18
				),
				utilizedERC20AmountTotalETHValue
			);

			require(computed, "!computed");

			if (_utilizedERC20_allocation[_utilizedERC20[i]] != amountAllocationActual)
			{
				utilizedERC20AmountValid_ = false;

				break;
			}
		}
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20AmountPerBurn()
		public
		view
		override
		setYieldSyncV1EMPStrategyInteractor()
		returns (uint256[] memory utilizedERC20Amount_)
	{
		utilizedERC20Amount_ = yieldSyncV1EMPStrategyInteractor.utilizedERC20TotalAmount(_utilizedERC20);

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			(, uint256 utilizedERC20Amount) = SafeMath.tryDiv(SafeMath.mul(utilizedERC20Amount_[i], 1e18), totalSupply());

			utilizedERC20Amount_[i] = utilizedERC20Amount;
		}
	}


	/// @notice mutative


	/// @inheritdoc IYieldSyncV1EMPStrategy
	function initializeStrategy(
		address _strategy,
		address[] memory __utilizedERC20,
		uint256[] memory __utilizedERC20Allocation
	)
		public
		override
		authManager()
	{
		require(
			address(yieldSyncV1EMPStrategyInteractor) == address(0),
			"address(yieldSyncV1EMPStrategyInteractor) != address(0)"
		);

		_utilizedERC20 = __utilizedERC20;

		utilizedERC20AllocationUpdate(__utilizedERC20Allocation);

		yieldSyncV1EMPStrategyInteractor = IYieldSyncV1EMPStrategyInteractor(_strategy);
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20AllocationUpdate(uint256[] memory _utilizedERC20Allocation)
		public
		override
		authManager()
	{
		uint256 _utilizedERC20AllocationTotal;

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			_utilizedERC20AllocationTotal += _utilizedERC20Allocation[i];
		}

		require(_utilizedERC20AllocationTotal == ONE_HUNDRED_PERCENT, "_utilizedERC20AllocationTotal != ONE_HUNDRED_PERCENT");

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			_utilizedERC20_allocation[_utilizedERC20[i]] = _utilizedERC20Allocation[i];
		}
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20Deposit(uint256[] memory _utilizedERC20Amount)
		public
		override
		nonReentrant()
		setYieldSyncV1EMPStrategyInteractor()
	{
		require(utilizedERC20DepositOpen, "!utilizedERC20DepositOpen");

		require(utilizedERC20AmountValid(_utilizedERC20Amount), "!utilizedERC20AmountValid(_utilizedERC20Amount)");

		yieldSyncV1EMPStrategyInteractor.utilizedERC20Deposit(msg.sender, _utilizedERC20, _utilizedERC20Amount);

		uint256 utilizedERC20AmountTotalETHValue;

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			utilizedERC20AmountTotalETHValue += SafeMath.div(
				SafeMath.mul(
					_utilizedERC20Amount[i] * 10 ** (18 - ERC20(_utilizedERC20[i]).decimals()),
					yieldSyncV1EMPStrategyInteractor.utilizedERC20ETHValue(_utilizedERC20[i])
				),
				1e18
			);
		}

		_mint(msg.sender, utilizedERC20AmountTotalETHValue);
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20DepositOpenToggle()
		public
		override
		authManager()
		setYieldSyncV1EMPStrategyInteractor()
	{
		utilizedERC20DepositOpen = !utilizedERC20DepositOpen;
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20Withdraw(uint256 _tokenAmount)
		public
		override
		nonReentrant()
		setYieldSyncV1EMPStrategyInteractor()
	{
		require(utilizedERC20WithdrawOpen, "!utilizedERC20WithdrawOpen");

		require(balanceOf(msg.sender) >= _tokenAmount, "!_tokenAmount");

		uint256[] memory uTAPB = utilizedERC20AmountPerBurn();

		for (uint256 i = 0; i < _utilizedERC20.length; i++)
		{
			uTAPB[i] = SafeMath.div(uTAPB[i] * _tokenAmount, 1e18);
		}

		yieldSyncV1EMPStrategyInteractor.utilizedERC20Withdraw(msg.sender, _utilizedERC20, uTAPB);

		_burn(msg.sender, _tokenAmount);
	}

	/// @inheritdoc IYieldSyncV1EMPStrategy
	function utilizedERC20WithdrawOpenToggle()
		public
		override
		authManager()
		setYieldSyncV1EMPStrategyInteractor()
	{
		utilizedERC20WithdrawOpen = !utilizedERC20WithdrawOpen;
	}
}
