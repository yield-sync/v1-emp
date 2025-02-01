import { Contract, VoidSigner } from "ethers";

import { deployContract } from "../../util/UtilEMP";
import stageContracts, { StageContracts3 } from "../3-EMPUtility/stage-contracts";


export type StageContracts4 = StageContracts3 & {
	strategyDeployer: Contract;
};


export default async (): Promise<StageContracts4> => {
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
		eMPUtility,
		registry,
		strategyUtility,
	}: StageContracts3 = await stageContracts();

	const strategyDeployer: Contract = await deployContract("V1EMPStrategyDeployer", [registry.address]);

	await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);

	return {
		owner,
		manager,
		eMPUtility,
		treasury,
		badActor,
		mockERC20A,
		mockERC20B,
		mockERC20C,
		mockERC20D,
		governance,
		addressArrayUtility,
		registry,
		strategyDeployer,
		strategyUtility,
	};
};
