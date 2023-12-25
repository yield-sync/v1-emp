// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { YieldSyncV1EMP } from "./YieldSyncV1EMP.sol";
import { IYieldSyncV1EMPDeployer } from "./interface/IYieldSyncV1EMPDeployer.sol";


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


	constructor (address _YieldSyncGovernance)
	{
		fee = 0;
		yieldSyncAssetAllocatorIdTracker = 0;

		YieldSyncGovernance = _YieldSyncGovernance;
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

		return address(yieldSyncV1EMP);
	}
}
