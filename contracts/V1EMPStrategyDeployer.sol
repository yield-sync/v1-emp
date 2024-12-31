// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IV1EMPStrategyDeployer } from "./interface/IV1EMPStrategyDeployer.sol";
import { V1EMPStrategy } from "./V1EMPStrategy.sol";
import { IV1EMPRegistry } from "./interface/IV1EMPRegistry.sol";

import { IAccessControl } from "@openzeppelin/contracts/access/IAccessControl.sol";


contract V1EMPStrategyDeployer is
	IV1EMPStrategyDeployer
{
	/// @inheritdoc IV1EMPStrategyDeployer
	bool public override deployV1EMPStrategyOpen;

	IV1EMPRegistry internal immutable _I_V1_EMP_REGISTRY;


	constructor (address _v1EMPRegistry)
	{
		_I_V1_EMP_REGISTRY = IV1EMPRegistry(_v1EMPRegistry);
	}


	/// @inheritdoc IV1EMPStrategyDeployer
	function deployV1EMPStrategy()
		public
		returns (address v1EMPStrategy_)
	{
		require(
			deployV1EMPStrategyOpen || IAccessControl(_I_V1_EMP_REGISTRY.governance()).hasRole(bytes32(0), msg.sender),
			"!authorized"
		);

		v1EMPStrategy_ = address(new V1EMPStrategy(msg.sender, address(_I_V1_EMP_REGISTRY)));

		_I_V1_EMP_REGISTRY.v1EMPStrategyRegister(v1EMPStrategy_);
	}

	/// @inheritdoc IV1EMPStrategyDeployer
	function deployV1EMPStrategyOpenUpdate(bool _deployV1EMPStrategyOpen)
		public
		override
	{
		require(IAccessControl(_I_V1_EMP_REGISTRY.governance()).hasRole(bytes32(0), msg.sender), "!authorized");

		deployV1EMPStrategyOpen = _deployV1EMPStrategyOpen;
	}
}
