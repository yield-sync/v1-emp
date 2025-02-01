import { Contract } from "ethers";

import { deployContract } from "../../util/UtilEMP";
import stageContracts, { StageContracts5 } from "../5-EMPStrategy/stage-contracts";


export type StageContracts6 = StageContracts5 & {
	eMPDeployer: Contract
};


export default async (): Promise<StageContracts6> => {
	const {
		owner,
		manager,
		treasury,
		badActor,
		eMPUtility,
		mockERC20A,
		mockERC20B,
		mockERC20C,
		mockERC20D,
		governance,
		addressArrayUtility,
		registry,
		strategyDeployer,
		strategyUtility,
		eTHValueProvider,
		eTHValueProviderC,
	}: StageContracts5 = await stageContracts();

	const eMPDeployer: Contract = await deployContract("V1EMPDeployer", [registry.address]);

	await registry.v1EMPDeployerUpdate(eMPDeployer.address);

	return {
		addressArrayUtility,
		governance,
		eTHValueProvider,
		eTHValueProviderC,
		eMPUtility,
		registry,
		strategyDeployer,
		strategyUtility,
		mockERC20A,
		mockERC20B,
		mockERC20C,
		mockERC20D,
		owner,
		manager,
		treasury,
		badActor,
		eMPDeployer,
	};
};
