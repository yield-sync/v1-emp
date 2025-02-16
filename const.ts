const { ethers } = require("hardhat");


export const D_18 = ethers.utils.parseUnits("1", 18);
export const D_4 = ethers.utils.parseUnits("1", 4);

export const ERROR = {
	REGISTRY: {
		INVALID_PARAM_ARRAY_UTILITY: "!__addressArrayUtility",
		INVALID_PARAM_ERC20: "!_eRC20",
		INVALID_PARAM_ETH_VALUE_PROVIDER: "!_eRC20ETHValueProvider",
		INVALID_PARAM_GOVERNANCE: "!__governance",
		INVALID_PARAM_STRATEGY_UTILITY: "!__v1EMPStrategyUtility",
		INVALID_PARAM_PERCENT_UTILITY: "!__percentUtility",
		INVALID_PARAM_EMP_STRATEGY_DEPLOYER: "!__v1EMPStrategyDeployer",
		INVALID_PARAM_EMP_DEPLOYER: "!__v1EMPDeployer",
		INVALID_PARAM_EMP_UTILITY: "!__v1EMPUtility",
		ARRAY_UTILITY_NOT_SET: "_addressArrayUtility == address(0)",
		PERCENT_UTILITY_NOT_SET: "_percentUtility == address(0)",
		EMP_UTILITY_NOT_SET: "_v1EMPUtility == address(0)",
		NOT_EMP_DEPLOYER: "_v1EMPDeployer != msg.sender",
		NOT_STRATEGY_DEPLOYER: "_v1EMPStrategyDeployer != msg.sender",
		ERC20_PRICE_ZERO: "utilizedERC20ETHValue == 0",
		EMP_DEPLOYER_ALREADY_SET: "_v1EMPDeployer != address(0)",
		EMP_STRATEGY_DEPLOYER_ALREADY_SET: "_v1EMPStrategyDeployer != address(0)",
	},
	EMP: {
		INVALID_ERC20_AMOUNT: "!_eRC20Amount",
		INVALID_UTILIZED_ERC20_AMOUNT_LENGTH: "utilizedV1EMPStrategy.length != _v1EMPStrategyUtilizedERC20Amount.length",
		INVALID_UTILIZED_STRATEGY_ALLOCATION: "utilizedERC20AmountAllocationActual != iV1EMP.utilizedV1EMPStrategy_allocation(utilizedV1EMPStrategy[i])",
		INVALID_STRATEGY_ERC20_AMOUNTS_LENGTH: "!_v1EMPStrategyERC20Amount",
		DEPOSIT_NOT_OPEN: "!utilizedERC20DepositOpen",
		FEE_RATE_GOVERNANCE_GREATER_THAN_100_PERCENT: "!_feeRateGovernance",
		FEE_RATE_MANAGER_GREATER_THAN_100_PERCENT: "!_feeRateManager",
		WITHDRAW_NOT_OPEN: "!utilizedERC20WithdrawOpen",
		UTILIZED_ERC20_WITHDRAW_FULL_CLOSED: "!utilizedERC20WithdrawFull",
		UTILIZED_ERC20_TRANSFERS_OPEN: "utilizedERC20DepositOpen || utilizedERC20WithdrawOpen",
	},
	EMP_UTILITY: {
		INVALID_PARAM_UTILIZED_ERC20_AMOUNT: "!_utilizedERC20Amount",
		INVALID_PARAM_STRATEGY: "!_v1EMPStrategy",
		ADDRESS_NOT_EMP: "!_v1EMP",
		INVALID_ALLOCATION: "!allocation",
		UTILIZED_V1_EMP_STRATEGY_INVALID_ALLOCATION: "!_allocation",
	},
	STRATEGY: {
		INVALID_SHARES_AMOUNT: "!_shares",
		INVALID_UTILIZED_ERC20: "_utilizedERC20[i] == address(0)",
		INVALID_PARAMS_DEPOSIT_LENGTH: "!_utilizedERC20Amount",
		INVALID_PARAMS_UPDATE_LENGTHS: "_utilizedERC20.length != _utilizationERC20.length",
		INVALID_ERC20_HANDLER: "!_iERC20Handler",
		DEPOSIT_NOT_OPEN: "!utilizedERC20DepositOpen",
		ERC20_HANDLER_NOT_SET: "address(iERC20Handler) == address(0)",
		UTILIZED_ERC20_AMOUNT_NOT_ZERO: "_utilizedERC20Amount[i] != 0",
		WITHDRAW_NOT_OPEN: "!utilizedERC20WithdrawOpen",
		UTILIZED_ERC20_TRANSFERS_OPEN: "utilizedERC20DepositOpen || utilizedERC20WithdrawOpen",
	},
	STRATEGY_UTILITY: {
		INVALID_ERC20_ALLOCATION_TOTAL: "!_utilizationERC20",
		INVALID_PARAMS_UPDATE_CONTAINS_DUPLICATES: "!IAddressArrayUtility(_I_V1_EMP_REGISTRY.addressArrayUtility()).isUnique(_utilizedERC20)",
		INVALID_UTILIZED_ERC20_AMOUNT: "iV1EMPStrategy.utilizedERC20_utilizationERC20(utilizedERC20[i]).allocation != utilizedERC20AmountAllocationActual",
		ADDRESS_NOT_STRATEGY: "!_v1EMPStrategy",
		ERC20_NO_ETH_VALUE_PROVIDER_AVAILABLE: "_I_V1_EMP_REGISTRY.eRC20_eRC20ETHValueProvider(_utilizedERC20[i]) == address(0)",
	},
	NOT_COMPUTED: "!computed",
	NOT_AUTHORIZED: "!authorized",
};

export const PERCENT = {
	PERCENT_DIVISOR: ethers.utils.parseUnits("1", 4),
	HUNDRED: ethers.utils.parseUnits("1", 4),
	FIFTY: ethers.utils.parseUnits(".5", 4),
	FORTY: ethers.utils.parseUnits(".4", 4),
	TEN: ethers.utils.parseUnits(".1", 4),
	TWENTY_FIVE: ethers.utils.parseUnits(".25", 4),
	SEVENTY_FIVE: ethers.utils.parseUnits(".75", 4),
	ZERO: ethers.utils.parseUnits("0", 4),
};
