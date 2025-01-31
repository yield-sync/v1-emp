import { Contract, VoidSigner } from "ethers";

import { deployContract } from "../../util/UtilEMP";
import setup, { SetUpContracts1 } from "../1-EMPRegistry/setup";


export type SetUpContracts2 = SetUpContracts1 & {
	strategyUtility: Contract;
};


export default async (): Promise<SetUpContracts2> => {
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
	}: SetUpContracts1 = await setup();

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
