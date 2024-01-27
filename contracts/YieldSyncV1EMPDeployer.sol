// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


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


	address public immutable YieldSyncGovernance;

	uint256 public fee;
	uint256 public yieldSyncAssetAllocatorIdTracker;

	IYieldSyncV1EMPRegistry public immutable yieldSyncV1EMPRegistry;


	constructor (address _YieldSyncGovernance, address _yieldSyncV1EMPRegistry)
	{
		fee = 0;
		yieldSyncAssetAllocatorIdTracker = 0;

		YieldSyncGovernance = _YieldSyncGovernance;

		yieldSyncV1EMPRegistry = IYieldSyncV1EMPRegistry(_yieldSyncV1EMPRegistry);
	}


	function deployYieldSyncV1EMP(string memory _name, bool _onlyPrioritizedStrategy, string memory _symbol)
		public
		payable
		returns (address yieldSyncV1EMP_)
	{
		require(msg.value >= fee, "!msg.value");

		YieldSyncV1EMP yieldSyncV1EMP = new YieldSyncV1EMP(
			msg.sender,
			_onlyPrioritizedStrategy,
			_name,
			_symbol
		);

		yieldSyncV1EMPRegistry.yieldSyncV1EMPRegister(address(yieldSyncV1EMP));

		return address(yieldSyncV1EMP);
	}
}
