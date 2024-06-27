const { ethers } = require("hardhat");


export const D_18 = ethers.utils.parseUnits('1', 18);

export const ERROR = {
	REGISTRY: {
		ARRAY_UTILITY_NOT_SET: "!(yieldSyncV1EMPArrayUtility != address(0))",
		EMP_UTILITY_NOT_SET: "!(yieldSyncV1EMPUtility != address(0))",
		EMP_STRATEGY_UTILITY_NOT_SET: "!(yieldSyncV1EMPStrategyUtility != address(0))",
		NOT_EMP_DEPLOYER: "!(yieldSyncV1EMPDeployer == msg.sender)",
		NOT_STRATEGY_DEPLOYER: "!(yieldSyncV1EMPStrategyDeployer == msg.sender)",
	},
	EMP: {
		INVALID_UTILIZED_ERC20_LENGTH: "!(_utilizedERC20Amount.length == utilizedERC20.length)",
	},
	DEPOSIT_NOT_OPEN: "!utilizedERC20DepositOpen",
	NOT_COMPUTED: "!computed",
	NOT_AUTHORIZED: "!authorized",
	INVALID_ALLOCATION: "!(utilizedERC20AllocationTotal == ONE_HUNDRED_PERCENT)",
	INVALID_ALLOCATION_STRATEGY: "!(utilizedYieldSyncV1EMPStrategyAllocationTotal == ONE_HUNDRED_PERCENT)",
	INVALID_AMOUNT_LENGTH: "!(_utilizedERC20.length == _utilizedERC20Amount.length)",
	INVALID_BALANCE: "!(balanceOf(msg.sender) >= _ERC20Amount)",
	INVALID_PURPOSE_LENGTH: "__utilizedERC20.length != _purpose.length",
	INVALID_UTILIZED_ERC20_AMOUNT: "!(_utilizedERC20_utilizationERC20[_utilizedERC20[i]].allocation == utilizedERC20AmountAllocationActual)",
	INVALID_UTILIZED_ERC20_AMOUNT_EMP: "!(utilizedYieldSyncV1EMPStrategy.length == _yieldSyncV1EMPStrategyUtilizedERC20Amount.length)",
	INVALID_UTILIZED_ERC20_AMOUNT_DEPOSIT_FALSE_AND_NON_ZERO_DEPOSIT: "!(_utilizedERC20Amount[i] == 0)",
	STRATEGY_NOT_SET: "!(address(iYieldSyncV1EMPStrategyInteractor) != address(0))",
	UTILIZED_ERC20_TRANSFERS_OPEN: "!(!utilizedERC20DepositOpen && !utilizedERC20WithdrawOpen)",
	UTILIZED_YIELD_SYNC_V1_EMP_STRATEGY_DEPOSIT_NOT_OPEN: "!utilizedYieldSyncV1EMPStrategyDepositOpen",
	UTILIZED_YIELD_SYNC_V1_EMP_STRATEGY_WITHDRAW_NOT_OPEN: "!utilizedYieldSyncV1EMPStrategyWithdrawOpen",
	UTILIZED_YIELD_SYNC_V1_EMP_STRATEGY_INVAID_DEPOSIT_AMOUNT: "!valid",
	WITHDRAW_NOT_OPEN: "!utilizedERC20WithdrawOpen",
}

export const PERCENT = {
	HUNDRED: ethers.utils.parseUnits('1', 18),
	FIFTY: ethers.utils.parseUnits('.5', 18),
	TWENTY_FIVE: ethers.utils.parseUnits('.25', 18),
	SEVENTY_FIVE: ethers.utils.parseUnits('.75', 18),
	ZERO: ethers.utils.parseUnits('0', 18),
}
