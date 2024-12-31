// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { V1EMP } from "./V1EMP.sol";
import { IV1EMPDeployer } from "./interface/IV1EMPDeployer.sol";
import { IV1EMPRegistry } from "./interface/IV1EMPRegistry.sol";

import { IAccessControl } from "@openzeppelin/contracts/access/IAccessControl.sol";


contract V1EMPDeployer is
	IV1EMPDeployer
{
	/// @inheritdoc IV1EMPDeployer
	bool public override deployV1EMPOpen;

	IV1EMPRegistry internal immutable _I_V1_EMP_REGISTRY;


	constructor (address _v1EMPRegistry)
	{
		_I_V1_EMP_REGISTRY = IV1EMPRegistry(_v1EMPRegistry);
	}


	/// @inheritdoc IV1EMPDeployer
	function deployV1EMP(bool _utilizedERC20WithdrawFull, string memory _name, string memory _symbol)
		public
		override
		returns (address v1EMP_)
	{
		require(
			deployV1EMPOpen || IAccessControl(_I_V1_EMP_REGISTRY.governance()).hasRole(bytes32(0), msg.sender),
			"!authorized"
		);

		v1EMP_ = address(new V1EMP(msg.sender, address(_I_V1_EMP_REGISTRY), _utilizedERC20WithdrawFull, _name, _symbol));

		_I_V1_EMP_REGISTRY.v1EMPRegister(v1EMP_);
	}

	/// @inheritdoc IV1EMPDeployer
	function deployV1EMPOpenUpdate(bool _deployV1EMPOpen)
		public
		override
	{
		require(IAccessControl(_I_V1_EMP_REGISTRY.governance()).hasRole(bytes32(0), msg.sender), "!authorized");

		deployV1EMPOpen = _deployV1EMPOpen;
	}
}
