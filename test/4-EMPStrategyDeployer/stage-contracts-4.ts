import { Contract } from "ethers";

import { deployContract } from "../../util/UtilEMP";
import stageContracts, { StageContracts3 } from "../3-EMPUtility/stage-contracts-3";


export type StageContracts4 = StageContracts3 & {
	strategyDeployer: Contract,
};


export default async (): Promise<StageContracts4> => {
	const CONTRACTS: StageContracts3 = await stageContracts();

	const strategyDeployer: Contract = await deployContract("V1EMPStrategyDeployer", [CONTRACTS.registry.address]);

	await CONTRACTS.registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);

	return { ...CONTRACTS, strategyDeployer, };
};
