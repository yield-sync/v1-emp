const { ethers } = require("hardhat");


export const D_18 = ethers.utils.parseUnits('1', 18);

export const ERROR = {
	DEPOSIT_NOT_OPEN: "!utilizedERC20DepositOpen",
	ETH_FEED_NOT_SET: "!(address(iYieldSyncV1EMPETHValueFeed) != address(0))",
	NOT_COMPUTED: "!computed",
	NOT_AUTHORIZED: "!authorized",
	INVALID_ALLOCATION: "!(utilizedERC20AllocationTotal == ONE_HUNDRED_PERCENT)",
	INVALID_ALLOCATION_STRATEGY: "!(utilizedYieldSyncV1EMPStrategyAllocationTotal == ONE_HUNDRED_PERCENT)",
	INVALID_AMOUNT_LENGTH: "!(_utilizedERC20.length == _utilizedERC20Amount.length)",
	INVALID_BALANCE: "!(balanceOf(msg.sender) >= _ERC20Amount)",
	INVALID_PURPOSE_LENGTH: "__utilizedERC20.length != _purpose.length",
	INVALID_UTILIZED_ERC20_AMOUNT: "!(_utilizedERC20_utilization[_utilizedERC20[i]].allocation == utilizedERC20AmountAllocationActual)",
	INVALID_UTILIZED_ERC20_AMOUNT_EMP: "!(_utilizedYieldSyncV1EMPStrategy.length == _utilizedYieldSyncV1EMPStrategyERC20Amount.length)",
	INVALID_UTILIZED_ERC20_AMOUNT_DEPOSIT_FALSE_AND_NON_ZERO_DEPOSIT: "!(_utilizedERC20Amount[i] == 0)",
	STRATEGY_NOT_SET: "!(address(iYieldSyncV1EMPStrategyInteractor) != address(0))",
	UTILIZED_ERC20_TRANSFERS_OPEN: "!(!utilizedERC20DepositOpen && !utilizedERC20WithdrawOpen)",
	UTILIZED_YIELD_SYNC_V1_EMP_STRATEGY_DEPOSIT_NOT_OPEN: "!utilizedYieldSyncV1EMPStrategyDepositOpen",
	UTILIZED_YIELD_SYNC_V1_EMP_STRATEGY_WITHDRAW_NOT_OPEN: "!utilizedYieldSyncV1EMPStrategyWithdrawOpen",
	UTILIZED_YIELD_SYNC_V1_EMP_STRATEGY_INVAID_DEPOSIT_AMOUNT: "!(_utilizedYieldSyncV1EMPStrategy[i].allocation == utilizedERC20AmountAllocationActual)",
	WITHDRAW_NOT_OPEN: "!utilizedERC20WithdrawOpen",
}

export const PERCENT = {
	HUNDRED: ethers.utils.parseUnits('1', 18),
	FIFTY: ethers.utils.parseUnits('.5', 18),
	TWENTY_FIVE: ethers.utils.parseUnits('.25', 18),
	SEVENTY_FIVE: ethers.utils.parseUnits('.75', 18),
	ZERO: ethers.utils.parseUnits('0', 18),
}
