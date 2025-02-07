const { ethers } = require("hardhat");


export const D_18 = ethers.utils.parseUnits('1', 18);

export const ERROR = {
	REGISTRY: {
		ARRAY_UTILITY_NOT_SET:
			"_addressArrayUtility == address(0)"
		,
		ARRAY_UTILITY_IS_ADDRESS_ZERO:
			"__addressArrayUtility == address(0)"
		,
		EMP_UTILITY_NOT_SET:
			"_v1EMPUtility == address(0)"
		,
		NOT_EMP_DEPLOYER:
			"_v1EMPDeployer != msg.sender"
		,
		NOT_STRATEGY_DEPLOYER:
			"_v1EMPStrategyDeployer != msg.sender"
		,
		EMP_STRATEGY_DEPLOYER_IS_ADDRESS_ZERO:
			"__v1EMPStrategyDeployer == address(0)"
		,
		EMP_DEPLOYER_IS_ADDRESS_ZERO:
			"__v1EMPDeployer == address(0)"
		,
		EMP_UTILITY_IS_ADDRESS_ZERO:
			"__v1EMPUtility == address(0)"
		,
		ERC20_ADDRESS_ZERO:
			"_eRC20 == address(0)"
		,
		ETH_VALUE_PROVIDER_ADDRESS_ZERO:
			"_eRC20ETHValueProvider == address(0)"
		,
		GOVERNANCE_IS_ADDRESS_ZERO:
			"__governance == address(0)"
		,
		STRATEGY_UTILITY_IS_ADDRESS_ZERO:
			"__v1EMPStrategyUtility == address(0)"
		,
		EMP_DEPLOYER_ALREADY_SET:
			"_v1EMPDeployer != address(0)"
		,
		EMP_STRATEGY_DEPLOYER_ALREADY_SET:
			"_v1EMPStrategyDeployer != address(0)"
		,
	},
	EMP: {
		DEPOSIT_NOT_OPEN:
			"!utilizedERC20DepositOpen"
		,
		FEE_RATE_GOVERNANCE_GREATER_THAN_100_PERCENT:
			"!_feeRateGovernance"
		,
		FEE_RATE_MANAGER_GREATER_THAN_100_PERCENT:
			"!_feeRateManager"
		,
		INVALID_BALANCE:
			"balanceOf(msg.sender) < _eRC20Amount"
		,
		INVALID_UTILIZED_ERC20_AMOUNT_LENGTH:
			"utilizedV1EMPStrategy.length != _v1EMPStrategyUtilizedERC20Amount.length"
		,
		INVALID_UTILIZED_STRATEGY_ALLOCATION:
			"utilizedERC20AmountAllocationActual != iV1EMP.utilizedV1EMPStrategy_allocation(utilizedV1EMPStrategy[i])"
		,
		INVALID_STRATEGY_ERC20_AMOUNTS_LENGTH:
			"_v1EMPStrategyERC20Amount.length != _utilizedV1EMPStrategy.length"
		,
		WITHDRAW_NOT_OPEN:
			"!utilizedERC20WithdrawOpen"
		,
		UTILIZED_ERC20_NOT_AVAILABLE:
			"!utilizedERC20Available"
		,
		UTILIZED_ERC20_TRANSFERS_OPEN:
			"utilizedERC20TransfersOpen || utilizedERC20WithdrawOpen"
		,
	},
	EMP_UTILITY: {
		ADDRESS_NOT_EMP:
			"_I_V1_EMP_REGISTRY.v1EMP_v1EMPId(_v1EMP) == 0"
		,
		INVALID_ALLOCATION:
			"!utilizedERC20AllocationActual"
		,
		UTILIZED_V1_EMP_STRATEGY_INVALID_ALLOCATION:
			"utilizedV1EMPStrategyAllocationTotal != _I_V1_EMP_REGISTRY.ONE_HUNDRED_PERCENT()"
		,
		INVALID_V1_EMP_STRATEGY:
			"_I_V1_EMP_REGISTRY.v1EMPStrategy_v1EMPStrategyId(_v1EMPStrategy[i]) == 0"
		,
		INVALID_UTILIZED_ERC20_LENGTH:
			"_utilizedERC20Amount.length != _v1EMP_utilizedERC20[_v1EMP].length"
		,
		INVALID_STRATEGY_LENTH:
			"_v1EMPStrategy.length != _allocation.length"
		,
	},
	STRATEGY: {
		DEPOSIT_NOT_OPEN:
			"!utilizedERC20DepositOpen"
		,
		ERC20_HANDLER_NOT_SET:
			"!(address(iERC20Handler) != address(0))"
		,
		INVALID_ALLOCATION:
			"!(utilizedERC20AllocationActual)"
		,
		INVALID_BALANCE:
			"!(eMP_shares[msg.sender] >= _shares)"
		,
		INVALID_ERC20_ALLOCATION_TOTAL:
			"!(utilizedERC20AllocationTotal == _I_V1_EMP_REGISTRY.ONE_HUNDRED_PERCENT())"
		,
		INVALID_UTILIZED_ERC20:
			"!(_utilizedERC20[i] != address(0))"
		,
		INVALID_UTILIZED_ERC20_AMOUNT:
			"!(iV1EMPStrategy.utilizedERC20_utilizationERC20(utilizedERC20[i]).allocation == utilizedERC20AmountAllocationActual)"
		,
		INVALID_PARAMS_DEPOSIT_LENGTH:
			"!(utilizedERC20.length == _utilizedERC20Amount.length)"
		,
		INVALID_PARAMS_UPDATE_LENGTHS:
			"!(_utilizedERC20.length == _utilizationERC20.length)"
		,
		INVALID_PARAMS_UPDATE_CONTAINS_DUPLICATES:
			"!(IAddressArrayUtility(_I_V1_EMP_REGISTRY.addressArrayUtility()).isUnique(_utilizedERC20))"
		,
		INVALID_ERC20_HANDLER:
			"!_iERC20Handler"
		,
		UTILIZED_ERC20_AMOUNT_NOT_ZERO:
			"!(_utilizedERC20Amount[i] == 0)"
		,
		WITHDRAW_NOT_OPEN:
			"!utilizedERC20WithdrawOpen"
		,
		ERC20_NO_ETH_VALUE_PROVIDER_AVAILABLE:
			"!(_I_V1_EMP_REGISTRY.eRC20_eRC20ETHValueProvider(_utilizedERC20[i]) != address(0))"
		,
	},
	STRATEGY_UTILITY: {
		ADDRESS_NOT_STRATEGY:
			"!(_I_V1_EMP_REGISTRY.v1EMPStrategy_v1EMPStrategyId(_v1EMPStrategy) > 0)"
		,
	},
	NOT_COMPUTED:
		"!computed"
	,
	NOT_AUTHORIZED:
		"!authorized"
	,
}

export const PERCENT = {
	HUNDRED: ethers.utils.parseUnits('1', 18),
	FIFTY: ethers.utils.parseUnits('.5', 18),
	FORTY: ethers.utils.parseUnits('.4', 18),
	TEN: ethers.utils.parseUnits('.1', 18),
	TWENTY_FIVE: ethers.utils.parseUnits('.25', 18),
	SEVENTY_FIVE: ethers.utils.parseUnits('.75', 18),
	ZERO: ethers.utils.parseUnits('0', 18),
}
