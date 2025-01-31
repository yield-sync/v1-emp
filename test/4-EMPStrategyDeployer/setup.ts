import { Contract, VoidSigner } from "ethers";

import { deployContract } from "../../util/UtilEMP";
import setup, { SetUpContracts3 } from "../3-EMPUtility/setup";


export type SetUpContracts4 = SetUpContracts3 & {
	strategyDeployer: Contract;
};


export default async (): Promise<SetUpContracts4> => {
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
	}: SetUpContracts3 = await setup();

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
