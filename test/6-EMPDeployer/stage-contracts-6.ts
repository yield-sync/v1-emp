import { Contract } from "ethers";

import { deployContract } from "../../util/UtilEMP";
import stageContracts, { StageContracts5 } from "../5-EMPStrategy/stage-contracts-5";


export type StageContracts6 = StageContracts5 & {
	eMPDeployer: Contract,
};


export default async (): Promise<StageContracts6> => {
	const {
		owner,
		manager,
		treasury,
		badActor,
		eMPUtility,
		eRC20A,
		eRC20B,
		eRC20C,
		eRC20D,
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
		eRC20A,
		eRC20B,
		eRC20C,
		eRC20D,
		owner,
		manager,
		treasury,
		badActor,
		eMPDeployer,
	};
};
