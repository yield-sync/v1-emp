// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {
	IERC20ETHValueProvider
} from "@yield-sync/erc20-eth-value-provider/contracts/interface/IERC20ETHValueProvider.sol";
import { IAddressArrayUtility } from "@yield-sync/utility/contracts/interface/IAddressArrayUtility.sol";

import { IV1EMP } from "./interface/IV1EMP.sol";
import { IV1EMPRegistry } from "./interface/IV1EMPRegistry.sol";
import { IV1EMPStrategy } from "./interface/IV1EMPStrategy.sol";
import { IV1EMPUtility, UtilizationERC20 } from "./interface/IV1EMPUtility.sol";


contract V1EMPUtility is
	IV1EMPUtility
{
	using SafeMath for uint256;


	uint8 public constant TOLERANCE = 10;

	IV1EMPRegistry internal immutable _I_V1_EMP_REGISTRY;

	mapping (address v1EMP => address[] utilizedERC20) internal _v1EMP_utilizedERC20;

	mapping (
		address v1EMP => mapping(address utilizedERC20 => UtilizationERC20 utilizationERC20)
	) internal _v1EMP_utilizedERC20_utilizationERC20;

	mapping (
		address v1EMP => mapping(address v1EMPStrategy => uint256 utilizedERC20UpdateTracker)
	) public v1EMP_v1EMPStrategy_utilizedERC20UpdateTracker;


	constructor (address _v1EMPRegistry)
	{
		_I_V1_EMP_REGISTRY = IV1EMPRegistry(_v1EMPRegistry);
	}


	modifier existantV1EMP(address _v1EMP)
	{
		_existantV1EMP(_v1EMP);

		_;
	}


	/// @notice internal


	function _existantV1EMP(address _v1EMP)
		internal
		view
	{
		require(_I_V1_EMP_REGISTRY.v1EMP_v1EMPId(_v1EMP) > 0, "!(_I_V1_EMP_REGISTRY.v1EMP_v1EMPId(_v1EMP) > 0)");
	}


	/// @notice view


	/// @inheritdoc IV1EMPUtility
	function optimizedTransferAmount(address _v1EMP, address utilizedERC20, uint256 transferAmount)
		public
		view
		override
		existantV1EMP(_v1EMP)
		returns (uint256 optimizedTransferAmount_)
	{
		if (IERC20(utilizedERC20).balanceOf(_v1EMP) < transferAmount)
		{
			return transferAmount -= TOLERANCE;
		}

		return transferAmount;
	}

	/// @inheritdoc IV1EMPUtility
	function utilizedERC20AmountValid(address _v1EMP, uint256[] memory _utilizedERC20Amount)
		public
		view
		override
		existantV1EMP(_v1EMP)
		returns (bool valid_, uint256 utilizedERC20AmountTotalETHValue_, string memory message_)
	{
		require(
			_utilizedERC20Amount.length == _v1EMP_utilizedERC20[_v1EMP].length,
			"!(_utilizedERC20Amount.length == _v1EMP_utilizedERC20[_v1EMP].length)"
		);

		valid_ = true;

		uint256[] memory eRC20AmountETHValue = new uint256[](_v1EMP_utilizedERC20[_v1EMP].length);

		for (uint256 i = 0; i < _v1EMP_utilizedERC20[_v1EMP].length; i++)
		{
			eRC20AmountETHValue[i] = _utilizedERC20Amount[i].mul(
				IERC20ETHValueProvider(
					_I_V1_EMP_REGISTRY.eRC20_eRC20ETHValueProvider(_v1EMP_utilizedERC20[_v1EMP][i])
				).utilizedERC20ETHValue()
			).div(
				10 ** IERC20ETHValueProvider(
					_I_V1_EMP_REGISTRY.eRC20_eRC20ETHValueProvider(_v1EMP_utilizedERC20[_v1EMP][i])
				).eRC20Decimals()
			);

			utilizedERC20AmountTotalETHValue_ += eRC20AmountETHValue[i];
		}

		for (uint256 i = 0; i < _v1EMP_utilizedERC20[_v1EMP].length; i++)
		{
			uint256 utilizedERC20AllocationActual = eRC20AmountETHValue[i].mul(1e18).div(
				utilizedERC20AmountTotalETHValue_,
				"!computed"
			);

			if (
				_v1EMP_utilizedERC20_utilizationERC20[_v1EMP][
					_v1EMP_utilizedERC20[_v1EMP][i]
				].allocation != utilizedERC20AllocationActual
			)
			{
				return (false, utilizedERC20AmountTotalETHValue_, "!(utilizedERC20AllocationActual)");
			}
		}
	}

	/// @inheritdoc IV1EMPUtility
	function utilizedV1EMPStrategyValid(address _v1EMP, address[] memory _v1EMPStrategy, uint256[] memory _allocation)
		public
		view
		override
		existantV1EMP(_v1EMP)
		returns (bool valid_, string memory message_)
	{
		valid_ = true;

		if (_v1EMPStrategy.length != _allocation.length)
		{
			return (false, "_v1EMPStrategy.length != _allocation.length");
		}

		uint256 utilizedV1EMPStrategyAllocationTotal;

		for (uint256 i = 0; i < _v1EMPStrategy.length; i++)
		{
			if (_I_V1_EMP_REGISTRY.v1EMPStrategy_v1EMPStrategyId(_v1EMPStrategy[i]) == 0)
			{
				return (false, "_I_V1_EMP_REGISTRY.v1EMPStrategy_v1EMPStrategyId(_v1EMPStrategy[i]) == 0");
			}

			utilizedV1EMPStrategyAllocationTotal += _allocation[i];
		}

		if (_v1EMPStrategy.length != 0)
		{
			if (utilizedV1EMPStrategyAllocationTotal != _I_V1_EMP_REGISTRY.ONE_HUNDRED_PERCENT())
			{
				return (false, "utilizedV1EMPStrategyAllocationTotal != _I_V1_EMP_REGISTRY.ONE_HUNDRED_PERCENT()");
			}
		}
	}

	/// @inheritdoc IV1EMPUtility
	function v1EMP_utilizedERC20(address _v1EMP)
		public
		view
		override
		returns (address[] memory)
	{
		return _v1EMP_utilizedERC20[_v1EMP];
	}

	/// @inheritdoc IV1EMPUtility
	function v1EMP_utilizedERC20_utilizationERC20(address _v1EMP, address utilizedERC20)
		public
		view
		override
		returns (UtilizationERC20 memory)
	{
		return _v1EMP_utilizedERC20_utilizationERC20[_v1EMP][utilizedERC20];
	}

	/// @inheritdoc IV1EMPUtility
	function v1EMPStrategyUtilizedERC20AmountValid(address _v1EMP, uint256[][] memory _v1EMPStrategyUtilizedERC20Amount)
		public
		view
		override
		existantV1EMP(_v1EMP)
		returns (bool valid_, string memory message_)
	{
		valid_ = true;

		IV1EMP iV1EMP = IV1EMP(_v1EMP);

		address[] memory utilizedV1EMPStrategy = iV1EMP.utilizedV1EMPStrategy();

		if (utilizedV1EMPStrategy.length != _v1EMPStrategyUtilizedERC20Amount.length)
		{
			return (false, "utilizedV1EMPStrategy.length != _v1EMPStrategyUtilizedERC20Amount.length");
		}

		uint256 utilizedV1EMPStrategyERC20AmountETHValueTotal_ = 0;

		uint256[] memory utilizedV1EMPStrategyERC20AmountETHValue = new uint256[](utilizedV1EMPStrategy.length);

		for (uint256 i = 0; i < utilizedV1EMPStrategy.length; i++)
		{
			(utilizedV1EMPStrategyERC20AmountETHValue[i], ) = IV1EMPStrategy(utilizedV1EMPStrategy[i]).utilizedERC20AmountETHValue(
				_v1EMPStrategyUtilizedERC20Amount[i]
			);

			utilizedV1EMPStrategyERC20AmountETHValueTotal_ += utilizedV1EMPStrategyERC20AmountETHValue[i];
		}

		for (uint256 i = 0; i < utilizedV1EMPStrategy.length; i++)
		{
			uint256 utilizedERC20AmountAllocationActual = utilizedV1EMPStrategyERC20AmountETHValue[i].mul(1e18).div(
				utilizedV1EMPStrategyERC20AmountETHValueTotal_,
				"!computed"
			);

			if (utilizedERC20AmountAllocationActual != iV1EMP.utilizedV1EMPStrategy_allocation(utilizedV1EMPStrategy[i]))
			{
				return (
					false,
					"utilizedERC20AmountAllocationActual != iV1EMP.utilizedV1EMPStrategy_allocation(utilizedV1EMPStrategy[i])"
				);
			}
		}
	}


	/// @notice mutative


	/// @inheritdoc IV1EMPUtility
	function utilizedV1EMPStrategySync()
		public
		override
	{
		require(_I_V1_EMP_REGISTRY.v1EMP_v1EMPId(msg.sender) > 0, "!authorized");

		bool updatedRequired = false;

		IV1EMP iV1EMP = IV1EMP(msg.sender);

		address[] memory _utilizedV1EMPStrategy = iV1EMP.utilizedV1EMPStrategy();

		uint256 utilizedERC20MaxLength = 0;

		for (uint256 i = 0; i < _utilizedV1EMPStrategy.length; i++)
		{
			uint256 utilizedERC20UpdateTracker = IV1EMPStrategy(_utilizedV1EMPStrategy[i]).utilizedERC20UpdateTracker();

			if (v1EMP_v1EMPStrategy_utilizedERC20UpdateTracker[msg.sender][_utilizedV1EMPStrategy[i]] != utilizedERC20UpdateTracker)
			{
				updatedRequired = true;

				v1EMP_v1EMPStrategy_utilizedERC20UpdateTracker[msg.sender][_utilizedV1EMPStrategy[i]] = utilizedERC20UpdateTracker;
			}

			utilizedERC20MaxLength += IV1EMPStrategy(_utilizedV1EMPStrategy[i]).utilizedERC20().length;
		}

		if (!updatedRequired)
		{
			return;
		}

		address[] memory utilizedERC20 = new address[](utilizedERC20MaxLength);

		uint256 indexUtilizedERC20 = 0;

		for (uint256 i = 0; i < _utilizedV1EMPStrategy.length; i++)
		{
			address[] memory strategyUtilizedERC20 = IV1EMPStrategy(_utilizedV1EMPStrategy[i]).utilizedERC20();

			for (uint256 ii = 0; ii < strategyUtilizedERC20.length; ii++)
			{
				utilizedERC20[indexUtilizedERC20++] = strategyUtilizedERC20[ii];
			}
		}

		utilizedERC20 = IAddressArrayUtility(_I_V1_EMP_REGISTRY.addressArrayUtility()).removeDuplicates(utilizedERC20);
		utilizedERC20 = IAddressArrayUtility(_I_V1_EMP_REGISTRY.addressArrayUtility()).sort(utilizedERC20);

		uint256 utilizedERC20AllocationTotal;

		UtilizationERC20[] memory utilizationERC20 = new UtilizationERC20[](utilizedERC20.length);

		for (uint256 i = 0; i < _utilizedV1EMPStrategy.length; i++)
		{
			IV1EMPStrategy iV1EMPStrategy = IV1EMPStrategy(_utilizedV1EMPStrategy[i]);

			for (uint256 ii = 0; ii < utilizedERC20.length; ii++)
			{
				UtilizationERC20 memory uERC20 = iV1EMPStrategy.utilizedERC20_utilizationERC20(utilizedERC20[ii]);

				if (uERC20.deposit)
				{
					utilizationERC20[ii].deposit = true;

					utilizationERC20[ii].allocation += uERC20.allocation.mul(
						iV1EMP.utilizedV1EMPStrategy_allocation(_utilizedV1EMPStrategy[i])
					).div(
						1e18
					);

					utilizedERC20AllocationTotal += utilizationERC20[ii].allocation;
				}

				if (uERC20.withdraw)
				{
					utilizationERC20[ii].withdraw = true;
				}
			}
		}

		require(
			utilizedERC20AllocationTotal == _I_V1_EMP_REGISTRY.ONE_HUNDRED_PERCENT(),
			"!(utilizedERC20AllocationTotal == _I_V1_EMP_REGISTRY.ONE_HUNDRED_PERCENT())"
		);

		_v1EMP_utilizedERC20[msg.sender] = utilizedERC20;

		for (uint256 i = 0; i < _v1EMP_utilizedERC20[msg.sender].length; i++)
		{
			_v1EMP_utilizedERC20_utilizationERC20[msg.sender][_v1EMP_utilizedERC20[msg.sender][i]] = utilizationERC20[i];
		}
	}
}
