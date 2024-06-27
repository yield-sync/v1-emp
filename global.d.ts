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
type UtilizedEMPStrategy = string[];
type UtilizedEMPStrategyUpdate = string[];
type UtilizedEMPStrategyAllocationUpdate = BigNumber[];
type UtilizedERC20Amount = BigNumber[];
type UtilizedEMPStrategyERC20Amount = BigNumber[][];
