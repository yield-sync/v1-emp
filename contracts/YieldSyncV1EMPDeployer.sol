// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { YieldSyncV1EMP } from "./YieldSyncV1EMP.sol";
import { IYieldSyncV1EMPDeployer } from "./interface/IYieldSyncV1EMPDeployer.sol";
import { IYieldSyncV1EMPRegistry } from "./interface/IYieldSyncV1EMPRegistry.sol";


contract YieldSyncV1EMPDeployer is
	IYieldSyncV1EMPDeployer
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
	uint256 public yieldSyncAssetAllocatorIdTracker;

	IYieldSyncV1EMPRegistry public immutable I_YIELD_SYNC_V1_EMP_REGISTRY;


	constructor (address _yieldSyncGovernance, address _yieldSyncV1EMPRegistry)
	{
		fee = 0;
		yieldSyncAssetAllocatorIdTracker = 0;

		YIELD_SYNC_GOVERNANCE = _yieldSyncGovernance;

		I_YIELD_SYNC_V1_EMP_REGISTRY = IYieldSyncV1EMPRegistry(_yieldSyncV1EMPRegistry);
	}


	function deployYieldSyncV1EMP(string memory _name, string memory _symbol)
		public
		payable
		returns (address yieldSyncV1EMP_)
	{
		require(msg.value >= fee, "!msg.value");

		address yieldSyncV1EMP = address(new YieldSyncV1EMP(msg.sender, _name, _symbol));

		I_YIELD_SYNC_V1_EMP_REGISTRY.yieldSyncV1EMPRegister(yieldSyncV1EMP);

		return yieldSyncV1EMP;
	}
}
