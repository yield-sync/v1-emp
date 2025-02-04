import { Contract } from "ethers";

import { deployContract } from "../../util/UtilEMP";
import stageContracts, { StageContracts2 } from "../2-EMPStrategyUtility/stage-contracts-2";


const { ethers } = require("hardhat");


export type StageContracts3 = StageContracts2 & {
	eMPUtility: Contract,
};


export default async (): Promise<StageContracts3> => {
	const CONTRACTS: StageContracts2 = await stageContracts();

	const eMPUtility: Contract = await deployContract("V1EMPUtility", [CONTRACTS.registry.address]);
	await CONTRACTS.registry.v1EMPUtilityUpdate(eMPUtility.address);

	return { ...CONTRACTS, eMPUtility };
};


export async function stageSpecificSetup(registry: Contract)
{
	const [, , , , _fakeEMPDeployer, fakeEMP] = await ethers.getSigners();

	await registry.v1EMPDeployerUpdate(_fakeEMPDeployer.address);

	await registry.connect(_fakeEMPDeployer).v1EMPRegister(fakeEMP.address);

	return { fakeEMP };
};
