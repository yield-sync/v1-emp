import { Contract } from "ethers";

import { deployContract } from "../../util/UtilEMP";
import stageContracts, { StageContracts2 } from "../2-EMPStrategyUtility/stage-contracts-2";


const { ethers } = require("hardhat");


export type StageContracts3 = StageContracts2 & {
	eMPUtility: Contract,
};


export default async (): Promise<StageContracts3> => {
	const {
		owner,
		manager,
		treasury,
		badActor,
		eRC20A,
		eRC20B,
		eRC20C,
		eRC20D,
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
		eRC20A,
		eRC20B,
		eRC20C,
		eRC20D,
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
