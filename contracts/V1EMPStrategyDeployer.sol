// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IV1EMPStrategyDeployer } from "./interface/IV1EMPStrategyDeployer.sol";
import { V1EMPStrategy } from "./V1EMPStrategy.sol";
import { IV1EMPRegistry } from "./interface/IV1EMPRegistry.sol";


contract V1EMPStrategyDeployer is
	IV1EMPStrategyDeployer
{
	IV1EMPRegistry public immutable I_V1_EMP_REGISTRY;


	receive ()
		external
		payable
	{}


	fallback ()
		external
		payable
	{}


	constructor (address _v1EMPRegistry)
	{
		I_V1_EMP_REGISTRY = IV1EMPRegistry(_v1EMPRegistry);
	}


	/// @inheritdoc IV1EMPStrategyDeployer
	function deployV1EMPStrategy(string memory _name, string memory _symbol)
		public
		returns (address v1EMPStrategy_)
	{
		v1EMPStrategy_ = address(new V1EMPStrategy(msg.sender, address(I_V1_EMP_REGISTRY), _name, _symbol));

		I_V1_EMP_REGISTRY.v1EMPStrategyRegister(v1EMPStrategy_);
	}
}
