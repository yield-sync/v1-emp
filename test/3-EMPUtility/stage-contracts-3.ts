import { Contract, VoidSigner } from "ethers";

import { deployContract } from "../../util/UtilEMP";
import stageContracts, { StageContracts2 } from "../2-EMPStrategyUtility/stage-contracts-2";


export type StageContracts3 = StageContracts2 & {
	eMPUtility: Contract;
};


const { ethers } = require("hardhat");


export default async (): Promise<StageContracts3> => {
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
		strategyUtility,
	}: StageContracts2 = await stageContracts();

	const eMPUtility: Contract = await deployContract("V1EMPUtility", [registry.address]);

	await registry.v1EMPUtilityUpdate(eMPUtility.address);

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
		eMPUtility,
		registry,
		strategyUtility,
	};
};


export async function suiteSpecificSetup(registry: Contract)
{
	const [, , , , _fakeEMPDeployer, fakeEMP] = await ethers.getSigners();


	await registry.v1EMPDeployerUpdate(_fakeEMPDeployer.address);

	await registry.connect(_fakeEMPDeployer).v1EMPRegister(fakeEMP.address);

	return { fakeEMP };
};
