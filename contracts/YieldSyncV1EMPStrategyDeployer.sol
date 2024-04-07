// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


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


	address public immutable YIELD_SYNC_GOVERNANCE;

	uint256 public fee;

	IYieldSyncV1EMPRegistry public immutable I_YIELD_SYNC_V1_EMP_REGISTRY;


	modifier contractYIELD_SYNC_GOVERNANCE(bytes32 _role)
	{
		require(IAccessControlEnumerable(YIELD_SYNC_GOVERNANCE).hasRole(_role, msg.sender), "!auth");

		_;
	}


	constructor (address _YIELD_SYNC_GOVERNANCE, address _yieldSyncV1EMPRegistry)
	{
		fee = 0;

		YIELD_SYNC_GOVERNANCE = _YIELD_SYNC_GOVERNANCE;

		I_YIELD_SYNC_V1_EMP_REGISTRY = IYieldSyncV1EMPRegistry(_yieldSyncV1EMPRegistry);
	}


	/// @inheritdoc IYieldSyncV1EMPStrategyDeployer
	function deployYieldSyncV1EMPStrategy(string memory _name, string memory _symbol)
		public
		payable
		returns (address yieldSyncV1EMPStrategy_)
	{
		require(msg.value >= fee, "!msg.value");

		yieldSyncV1EMPStrategy_ = address(
			new YieldSyncV1EMPStrategy(msg.sender, address(I_YIELD_SYNC_V1_EMP_REGISTRY), _name, _symbol)
		);

		I_YIELD_SYNC_V1_EMP_REGISTRY.yieldSyncV1EMPStrategyRegister(yieldSyncV1EMPStrategy_);
	}

	/// @inheritdoc IYieldSyncV1EMPStrategyDeployer
	function feeUpdate(uint256 _fee)
		public
		contractYIELD_SYNC_GOVERNANCE(bytes32(0))
	{
		fee = _fee;
	}
}
