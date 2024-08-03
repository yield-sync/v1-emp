const { ethers } = require("hardhat");


export const D_18 = ethers.utils.parseUnits('1', 18);

export const ERROR = {
	REGISTRY: {
		ARRAY_UTILITY_NOT_SET:
			"!(v1EMPArrayUtility != address(0))"
		,
		EMP_UTILITY_NOT_SET:
			"!(v1EMPAmountsValidator != address(0))"
		,
		EMP_STRATEGY_UTILITY_NOT_SET:
			"!(v1EMPStrategyUtility != address(0))"
		,
		NOT_EMP_DEPLOYER:
			"!(v1EMPDeployer == msg.sender)"
		,
		NOT_STRATEGY_DEPLOYER:
			"!(v1EMPStrategyDeployer == msg.sender)"
		,
		ERC20_ADDRESS_ZERO:
			"!(_eRC20 != address(0))"
		,
		ETH_VALUE_FEED_ADDRESS_ZERO:
			"!(_v1EMPERC20ETHValueFeed != address(0))"
		,
	},
	EMP: {
		DEPOSIT_NOT_OPEN:
			"!utilizedERC20DepositOpen"
		,
		FEE_RATE_GOVERNANCE_GREATER_THAN_100_PERCENT:
			"!(_feeRateGovernance <= ONE_HUNDRED_PERCENT)"
		,
		FEE_RATE_MANAGER_GREATER_THAN_100_PERCENT:
			"!(_feeRateManager <= ONE_HUNDRED_PERCENT)"
		,
		INVALID_STRATEGY_ALLOCATION_TOTAL:
			"!(utilizedV1EMPStrategyAllocationTotal == ONE_HUNDRED_PERCENT)"
		,
		INVALID_BALANCE:
			"!(balanceOf(msg.sender) >= _eRC20Amount)"
		,
		INVALID_UTILIZED_ERC20_AMOUNT_LENGTH:
			"!(utilizedV1EMPStrategy.length == _v1EMPStrategyUtilizedERC20Amount.length)"
		,
		INVALID_STRATEGY_ERC20_AMOUNTS_LENGTH:
			"!(_v1EMPStrategyERC20Amount.length == _utilizedV1EMPStrategy.length)"
		,
		INVALID_UTILIZED_ERC20_LENGTH:
			"!(_utilizedERC20Amount.length == _utilizedERC20.length)"
		,
		INVALID_STRATEGY_UTILIZED_ERC20_AMOUNT_LENGTH:
			"!(_v1EMPStrategyUtilizedERC20Amount.length == _utilizedV1EMPStrategy.length)"
		,
		WITHDRAW_NOT_OPEN:
			"!utilizedERC20WithdrawOpen"
		,
		AMOUNTS_VALIDATOR_FAILURE:
			"!I_V1_EMP_AMOUNTS_VALIDATOR.v1EMPStrategyUtilizedERC20AmountValid(_v1EMPStrategyUtilizedERC20Amount)"
		,
		INVALID:
			"!valid"
		,
		UTILIZED_ERC20_NOT_AVAILABLE:
			"!(utilizedERC20Available)"
		,
	},
	STRATEGY: {
		DEPOSIT_NOT_OPEN:
			"!utilizedERC20DepositOpen"
		,
		INTERACTOR_NOT_SET:
			"!(address(iV1EMPStrategyInteractor) != address(0))"
		,
		INVALID_ERC20_ALLOCATION_TOTAL:
			"!(utilizedERC20AllocationTotal == ONE_HUNDRED_PERCENT)"
		,
		INVALID_BALANCE:
			"!(balanceOf(msg.sender) >= _eRC20Amount)"
		,
		INVALID_UTILIZED_ERC20_AMOUNT:
			"!(_utilizedERC20_utilizationERC20[_utilizedERC20[i]].allocation == utilizedERC20AmountAllocationActual)"
		,
		INVAILD_PARAMS_DEPOSIT_LENGTH:
			"!(_utilizedERC20.length == _utilizedERC20Amount.length)"
		,
		INVALID_PARAMS_UPDATE_LENGTHS:
			"!(__utilizedERC20.length == _utilizationERC20.length)"
		,
		INVALID_PARAMS_UPDATE_CONTAINS_DUPLCIATES:
			"I_V1_EMP_ARRAY_UTILITY.containsDuplicates(__utilizedERC20)"
		,
		UTILIZED_ERC20_AMOUNT_NOT_ZERO:
			"!(_utilizedERC20Amount[i] == 0)"
		,
		UTILIZED_ERC20_TRANSFERS_OPEN:
			"!(!utilizedERC20DepositOpen && !utilizedERC20WithdrawOpen)"
		,
		WITHDRAW_NOT_OPEN:
			"!utilizedERC20WithdrawOpen"
		,
		ERC20_NO_ETH_VALUE_FEED_AVAILABLE:
			"!(I_V1_EMP_REGISTRY.eRC20_v1EMPERC20ETHValueFeed(__utilizedERC20[i]) != address(0))"
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
	TWENTY_FIVE: ethers.utils.parseUnits('.25', 18),
	SEVENTY_FIVE: ethers.utils.parseUnits('.75', 18),
	ZERO: ethers.utils.parseUnits('0', 18),
}
