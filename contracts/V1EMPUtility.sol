// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IV1EMPArrayUtility } from "./interface/IV1EMPArrayUtility.sol";
import {
	IV1EMP,
	IV1EMPAmountsValidator,
	IV1EMPRegistry,
	UtilizationERC20
} from "./interface/IV1EMP.sol";
import { IV1EMPStrategy } from "./interface/IV1EMPStrategy.sol";


/// TODO Merge this contract with
contract V1EMPUtility
{
	address[] internal _uniqueAddresses;

	bool public duplicateFound;

	/// TODO: This needs to be moved. Refer to it from the EMP or move it to the registry
	uint256 public constant ONE_HUNDRED_PERCENT = 1e18;

	IV1EMPAmountsValidator public immutable I_V1_EMP_AMOUNTS_VALIDATOR;
	IV1EMPArrayUtility public immutable I_V1_EMP_ARRAY_UTILITY;
	IV1EMPRegistry public immutable I_V1_EMP_REGISTRY;


	mapping(address => bool) public seen;

	mapping (
		address v1EMP => mapping(address v1EMPStrategy => uint256 utilizedERC20UpdateTracker)
	) public v1EMP_v1EMPStrategy_utilizedERC20UpdateTracker;


	constructor (address _v1EMPRegistry)
	{
		duplicateFound = false;

		I_V1_EMP_REGISTRY = IV1EMPRegistry(_v1EMPRegistry);
		I_V1_EMP_ARRAY_UTILITY = IV1EMPArrayUtility(I_V1_EMP_REGISTRY.v1EMPArrayUtility());
		I_V1_EMP_AMOUNTS_VALIDATOR = IV1EMPAmountsValidator(I_V1_EMP_REGISTRY.v1EMPAmountsValidator());
	}


	modifier authEMP()
	{
		require(I_V1_EMP_REGISTRY.v1EMP_v1EMPId(msg.sender) > 0, "!authorized");

		_;
	}


	function utilizedERC20Update(address[] memory _utilizedV1EMPStrategy)
		public
		authEMP()
		returns (bool updated_required_, address[] memory utilizedERC20_, UtilizationERC20[] memory utilizationERC20_)
	{
		updated_required_ = false;

		uint256 utilizedERC20MaxLength = 0;

		for (uint256 i = 0; i < _utilizedV1EMPStrategy.length; i++)
		{
			uint256 utilizedERC20UpdateTracker = IV1EMPStrategy(_utilizedV1EMPStrategy[i]).utilizedERC20UpdateTracker();

			if (v1EMP_v1EMPStrategy_utilizedERC20UpdateTracker[msg.sender][_utilizedV1EMPStrategy[i]] != utilizedERC20UpdateTracker)
			{
				updated_required_ = true;

				v1EMP_v1EMPStrategy_utilizedERC20UpdateTracker[msg.sender][_utilizedV1EMPStrategy[i]] = utilizedERC20UpdateTracker;
			}

			utilizedERC20MaxLength += IV1EMPStrategy(_utilizedV1EMPStrategy[i]).utilizedERC20().length;
		}

		if (!updated_required_)
		{
			return (updated_required_, utilizedERC20_, utilizationERC20_);
		}

		address[] memory tempUtilizedERC20 = new address[](utilizedERC20MaxLength);

		uint256 utilizedERC20I = 0;

		for (uint256 i = 0; i < _utilizedV1EMPStrategy.length; i++)
		{
			address[] memory strategyUtilizedERC20 = IV1EMPStrategy(_utilizedV1EMPStrategy[i]).utilizedERC20();

			for (uint256 ii = 0; ii < strategyUtilizedERC20.length; ii++)
			{
				tempUtilizedERC20[utilizedERC20I++] = strategyUtilizedERC20[ii];
			}
		}

		tempUtilizedERC20 = I_V1_EMP_ARRAY_UTILITY.removeDuplicates(tempUtilizedERC20);
		tempUtilizedERC20 = I_V1_EMP_ARRAY_UTILITY.sort(tempUtilizedERC20);

		uint256 utilizedERC20AllocationTotal;

		utilizationERC20_ = new UtilizationERC20[](tempUtilizedERC20.length);

		for (uint256 i = 0; i < _utilizedV1EMPStrategy.length; i++)
		{
			IV1EMPStrategy iV1EMPStrategy = IV1EMPStrategy(_utilizedV1EMPStrategy[i]);

			for (uint256 ii = 0; ii < tempUtilizedERC20.length; ii++)
			{
				UtilizationERC20 memory utilizationERC20 = iV1EMPStrategy.utilizedERC20_utilizationERC20(tempUtilizedERC20[ii]);

				if (utilizationERC20.deposit)
				{
					utilizationERC20_[ii].deposit = true;

					uint256 utilizationERC20Allocation = utilizationERC20.allocation * IV1EMP(
						msg.sender
					).utilizedV1EMPStrategy_allocation(
						_utilizedV1EMPStrategy[i]
					) / 1e18;

					utilizationERC20_[ii].allocation += utilizationERC20Allocation;

					utilizedERC20AllocationTotal += utilizationERC20Allocation;
				}

				if (utilizationERC20.withdraw)
				{
					utilizationERC20_[ii].withdraw = true;
				}
			}
		}

		require(utilizedERC20AllocationTotal == ONE_HUNDRED_PERCENT, "!(utilizedERC20AllocationTotal == ONE_HUNDRED_PERCENT)");

		return (updated_required_, utilizedERC20_, utilizationERC20_);
	}
}
