export const ERROR = {
	DEPOSIT_NOT_OPEN: "!utilizedERC20DepositOpen",
	ETH_FEED_NOT_SET: "address(iYieldSyncV1EMPETHValueFeed) == address(0)",
	NOT_COMPUTED: "!computed",
	NOT_EMP: "iYieldSyncV1EMPRegistry.yieldSyncV1EMP_yieldSyncV1EMPId(msg.sender) == 0",
	NOT_MANAGER: "manager != msg.sender",
	INVALID_ALLOCATION: "_utilizedERC20AllocationTotal != ONE_HUNDRED_PERCENT",
	INVALID_AMOUNT_LENGTH: "_utilizedERC20.length != _utilizedERC20Amount.length",
	INVALID_BALANCE: "balanceOf(msg.sender) < _tokenAmount",
	INVALID_PURPOSE_LENGTH: "__utilizedERC20.length != _purpose.length",
	INVALID_UTILIZEDERC20AMOUNT: "!utilizedERC20AmountValid",
	STRATEGY_NOT_SET: "address(iYieldSyncV1EMPStrategyInteractor) == address(0)",
	WITHDRAW_NOT_OPEN: "!utilizedERC20WithdrawOpen",
}
