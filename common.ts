const { ethers } = require("hardhat");


export const D_18 = ethers.utils.parseUnits('1', 18);

export const ERROR = {
	DEPOSIT_NOT_OPEN: "!utilizedERC20DepositOpen",
	ETH_FEED_NOT_SET: "address(iYieldSyncV1EMPETHValueFeed) == address(0)",
	NOT_COMPUTED: "!computed",
	NOT_EMP: "iYieldSyncV1EMPRegistry.yieldSyncV1EMP_yieldSyncV1EMPId(msg.sender) == 0",
	NOT_MANAGER: "manager != msg.sender",
	INVALID_ALLOCATION: "utilizedERC20AllocationTotal != ONE_HUNDRED_PERCENT",
	INVALID_AMOUNT_LENGTH: "_utilizedERC20.length != _utilizedERC20Amount.length",
	INVALID_BALANCE: "balanceOf(msg.sender) < _tokenAmount",
	INVALID_PURPOSE_LENGTH: "__utilizedERC20.length != _purpose.length",
	INVALID_UTILIZEDERC20AMOUNT: "!utilizedERC20AmountValid(_utilizedERC20Amount)",
	STRATEGY_NOT_SET: "address(iYieldSyncV1EMPStrategyInteractor) == address(0)",
	UTILIZED_ERC20_DEPOSIT_OPEN: "utilizedERC20DepositOpen || utilizedERC20WithdrawOpen",
	WITHDRAW_NOT_OPEN: "!utilizedERC20WithdrawOpen",
}

export const PERCENT = {
	HUNDRED: ethers.utils.parseUnits('1', 18),
	FIFTY: ethers.utils.parseUnits('.5', 18),
	TWENTY_FIVE: ethers.utils.parseUnits('.25', 18),
	SEVENTY_FIVE: ethers.utils.parseUnits('.75', 18),
	ZERO: ethers.utils.parseUnits('0', 18),
}
