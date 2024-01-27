// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IAccessControlEnumerable } from "@openzeppelin/contracts/access/IAccessControlEnumerable.sol";

import { IYieldSyncV1EMPStrategyDeployer } from "./interface/IYieldSyncV1EMPStrategyDeployer.sol";
import { YieldSyncV1EMPStrategy } from "./YieldSyncV1EMPStrategy.sol";
import { IYieldSyncV1EMPRegistry } from "./interface/IYieldSyncV1EMPRegistry.sol";


contract YieldSyncV1EMPStrategyDeployer is
	IYieldSyncV1EMPStrategyDeployer
{
	receive ()
		external
		payable
	{}


	fallback ()
		external
		payable
	{}


	address public immutable YieldSyncGovernance;

	uint256 public fee;

	IYieldSyncV1EMPRegistry public immutable iYieldSyncV1EMPRegistry;


	modifier contractYieldSyncGovernance(bytes32 _role)
	{
		require(IAccessControlEnumerable(YieldSyncGovernance).hasRole(_role, msg.sender), "!auth");

		_;
	}


	constructor (address _iYieldSyncV1EMPRegistry, address _YieldSyncGovernance)
	{
		fee = 0;

		YieldSyncGovernance = _YieldSyncGovernance;

		iYieldSyncV1EMPRegistry = IYieldSyncV1EMPRegistry(_iYieldSyncV1EMPRegistry);
	}


	function deployYieldSyncV1EMPStrategy(string memory _name, string memory _symbol)
		public
		payable
		returns (address yieldSyncV1EMPStrategy_)
	{
		require(msg.value >= fee, "!msg.value");

		yieldSyncV1EMPStrategy_ = address(
			new YieldSyncV1EMPStrategy(
				address(this),
				address(iYieldSyncV1EMPRegistry),
				msg.sender,
				_name,
				_symbol
			)
		);

		iYieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyRegister(yieldSyncV1EMPStrategy_);
	}

	function feeUpdate(uint256 _fee)
		public
		contractYieldSyncGovernance(bytes32(0))
	{
		fee = _fee;
	}
}
