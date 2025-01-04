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

/**
* Deploy EMP
*/
type DeployEMP = {
	name: string,
	ticker: string,
	utilizedEMPStrategyUpdate: UtilizedEMPStrategyUpdate,
	utilizedEMPStrategyAllocationUpdate: UtilizedEMPStrategyAllocationUpdate
};

/**
* Deploy Strategy
*/
type DeployStrategy = {
	strategyUtilizedERC20: string[],
	strategyUtilization: [boolean, boolean, BigNumber][],
	strategyInteractor?: string
	useSimpleStrategyInteractor?: true;
};

type TestEMP = {
	contract: Contract,
	UtilEMPTransfer: UtilEMPTransfer
};

type TestStrategy = {
	contract: Contract,
	UtilStrategyTransfer: UtilStrategyTransfer
};
