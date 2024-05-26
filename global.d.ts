/**
* EMP Strategy
*/
type StrategyUtiliziedERC20 = string[];

type StrategyUtilization = [boolean, boolean, BigNumber][];

type StrategyUtilizedERC20Update = {
	utilizedERC20: StrategyUtiliziedERC20,
	utilization: StrategyUtilization[]
};

/**
* EMP
*/
type UtilizedEMPStrategy = {
	yieldSyncV1EMPStrategy: string,
	allocation: BigNumber
};
type UtilizedEMPStrategyUpdate = [string, BigNumber][];

type UtilizedEMPStrategyERC20Amount = BigNumber[][];
