const { ethers } = require("hardhat");


export const D_18 = ethers.utils.parseUnits('1', 18);

export const ERROR = {
	REGISTRY: {
		ARRAY_UTILITY_NOT_SET: "!(yieldSyncV1EMPArrayUtility != address(0))",
		EMP_UTILITY_NOT_SET: "!(yieldSyncV1EMPUtility != address(0))",
		EMP_STRATEGY_UTILITY_NOT_SET: "!(yieldSyncV1EMPStrategyUtility != address(0))",
		NOT_EMP_DEPLOYER: "!(yieldSyncV1EMPDeployer == msg.sender)",
		NOT_STRATEGY_DEPLOYER: "!(yieldSyncV1EMPStrategyDeployer == msg.sender)",
		ERC20_ADDRESS_ZERO: "!(_eRC20 != address(0))",
		ETH_VALUE_FEED_ADDRESS_ZERO: "!(_yieldSyncV1EMPERC20ETHValueFeed != address(0))",
	},
	EMP: {
		DEPOSIT_NOT_OPEN: "!utilizedERC20DepositOpen",
		INVALID_ALLOCATION: "!(utilizedYieldSyncV1EMPStrategyAllocationTotal == ONE_HUNDRED_PERCENT)",
		INVALID_BALANCE: "!(balanceOf(msg.sender) >= _eRC20Amount)",
		INVALID_UTILIZED_ERC20_AMOUNT_LENGTH: "!(utilizedYieldSyncV1EMPStrategy.length == _yieldSyncV1EMPStrategyUtilizedERC20Amount.length)",
		INVALID_STRATEGY_ERC20_AMOUNTS_LENGTH: "!(_yieldSyncV1EMPStrategyERC20Amount.length == _utilizedYieldSyncV1EMPStrategy.length)",
		INVALID_UTILIZED_ERC20_LENGTH: "!(_utilizedERC20Amount.length == utilizedERC20.length)",
		WITHDRAW_NOT_OPEN: "!utilizedERC20WithdrawOpen",
	},
	STRATEGY: {
		DEPOSIT_NOT_OPEN: "!utilizedERC20DepositOpen",
		INTERACTOR_NOT_SET: "!(address(iYieldSyncV1EMPStrategyInteractor) != address(0))",
		INVALID_ALLOCATION: "!(utilizedERC20AllocationTotal == ONE_HUNDRED_PERCENT)",
		INVALID_AMOUNT_LENGTH: "!(_utilizedERC20.length == _utilizedERC20Amount.length)",
		INVALID_BALANCE: "!(balanceOf(msg.sender) >= _eRC20Amount)",
		INVALID_UTILIZED_ERC20_AMOUNT: "!(_utilizedERC20_utilizationERC20[_utilizedERC20[i]].allocation == utilizedERC20AmountAllocationActual)",
		UTILIZED_ERC20_AMOUNT_NOT_ZERO: "!(_utilizedERC20Amount[i] == 0)",
		UTILIZED_ERC20_TRANSFERS_OPEN: "!(!utilizedERC20DepositOpen && !utilizedERC20WithdrawOpen)",
		WITHDRAW_NOT_OPEN: "!utilizedERC20WithdrawOpen",
		ERC20_NO_ETH_VALUE_FEED_AVAILABLE: "!(I_YIELD_SYNC_V1_EMP_REGISTRY.eRC20_yieldSyncV1EMPERC20ETHValueFeed(__utilizedERC20[i]) != address(0))",
	},
	NOT_COMPUTED: "!computed",
	NOT_AUTHORIZED: "!authorized",
}

export const PERCENT = {
	HUNDRED: ethers.utils.parseUnits('1', 18),
	FIFTY: ethers.utils.parseUnits('.5', 18),
	TWENTY_FIVE: ethers.utils.parseUnits('.25', 18),
	SEVENTY_FIVE: ethers.utils.parseUnits('.75', 18),
	ZERO: ethers.utils.parseUnits('0', 18),
}
