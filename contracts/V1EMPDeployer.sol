// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { V1EMP } from "./V1EMP.sol";
import { IV1EMPDeployer } from "./interface/IV1EMPDeployer.sol";
import { IV1EMPRegistry } from "./interface/IV1EMPRegistry.sol";


contract V1EMPDeployer is
	IV1EMPDeployer
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


	/// @inheritdoc IV1EMPDeployer
	function deployV1EMP(string memory _name, string memory _symbol)
		public
		returns (address v1EMP_)
	{
		v1EMP_ = address(
			new V1EMP(msg.sender, address(I_V1_EMP_REGISTRY), _name, _symbol)
		);

		I_V1_EMP_REGISTRY.v1EMPRegister(v1EMP_);
	}
}
