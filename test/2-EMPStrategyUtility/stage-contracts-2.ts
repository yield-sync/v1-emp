import { Contract, VoidSigner } from "ethers";

import { deployContract } from "../../util/UtilEMP";
import stageContracts, { StageContracts1 } from "../1-EMPRegistry/stage-contracts-1";


export type StageContracts2 = StageContracts1 & {
	strategyUtility: Contract;
};


export default async (): Promise<StageContracts2> => {
	const {
		owner,
		manager,
		treasury,
		badActor,
		mockERC20A,
		mockERC20B,
		mockERC20C,
		mockERC20D,
		governance,
		addressArrayUtility,
		registry,
	}: StageContracts1 = await stageContracts();

	await registry.addressArrayUtilityUpdate(addressArrayUtility.address);

	const strategyUtility: Contract = await deployContract("V1EMPStrategyUtility", [registry.address]);

	await registry.v1EMPStrategyUtilityUpdate(strategyUtility.address);

	return {
		owner,
		manager,
		treasury,
		badActor,
		mockERC20A,
		mockERC20B,
		mockERC20C,
		mockERC20D,
		governance,
		addressArrayUtility,
		registry,
		strategyUtility,
	};
};
