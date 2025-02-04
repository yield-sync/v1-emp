import { Contract, Signer } from "ethers";

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
	const CONTRACTS: StageContracts2 = await stageContracts();

	let existingVoidSigners: number = 0;

	let k: keyof StageContracts2;

	for (k in CONTRACTS)
	{
		if (Signer.isSigner(CONTRACTS[k]))
		{
			existingVoidSigners++;
		}
	}

	const signers = await ethers.getSigners();

	if (signers.length < existingVoidSigners + 2)
	{
		throw new Error("Not enough signers available");
	}

	const _fakeEMPDeployer = signers[existingVoidSigners];

	const fakeEMP = signers[existingVoidSigners + 1];

	await registry.v1EMPDeployerUpdate(_fakeEMPDeployer.address);

	await registry.connect(_fakeEMPDeployer).v1EMPRegister(fakeEMP.address);

	return { fakeEMP, };
};
