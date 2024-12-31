// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IV1EMPStrategyDeployer } from "./interface/IV1EMPStrategyDeployer.sol";
import { V1EMPStrategy } from "./V1EMPStrategy.sol";
import { IV1EMPRegistry } from "./interface/IV1EMPRegistry.sol";


contract V1EMPStrategyDeployer is
	IV1EMPStrategyDeployer
{
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
		v1EMPStrategy_ = address(new V1EMPStrategy(msg.sender, address(_I_V1_EMP_REGISTRY)));

		_I_V1_EMP_REGISTRY.v1EMPStrategyRegister(v1EMPStrategy_);
	}
}
