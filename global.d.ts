/**
* EMP Strategy
*/
type StrategyUtilizedERC20 = [string, boolean, boolean, BigNumber][]

/**
* EMP
*/
type UtilizedEMPStrategy = {
	yieldSyncV1EMPStrategy: string,
	allocation: BigNumber
};
type UtilizedEMPStrategyUpdate = [string, BigNumber][];

type UtilizedEMPStrategyERC20Amount = BigNumber[][];
