import { Contract } from "ethers";

import { deployContract } from "../../util/UtilEMP";
import stageContracts, { StageContracts1 } from "../1-EMPRegistry/stage-contracts-1";


export type StageContracts2 = StageContracts1 & {
	strategyUtility: Contract,
};


export default async (): Promise<StageContracts2> => {
	const CONTRACTS: StageContracts1 = await stageContracts();

	const strategyUtility: Contract = await deployContract("V1EMPStrategyUtility", [CONTRACTS.registry.address]);

	await CONTRACTS.registry.addressArrayUtilityUpdate(CONTRACTS.addressArrayUtility.address);

	await CONTRACTS.registry.v1EMPStrategyUtilityUpdate(strategyUtility.address);

	return { ...CONTRACTS, strategyUtility, };
};
