import { Contract, VoidSigner, Signer } from "ethers";

import stageContracts, { StageContracts0 } from "../stage-contracts-0";
import { deployContract } from "../../util/UtilEMP";


const { ethers } = require("hardhat");


export type StageContracts1 = StageContracts0 & {
	registry: Contract,
};


export default async (): Promise<StageContracts1> => {
	const CONTRACTS: StageContracts0 = await stageContracts();

	const registry: Contract = await deployContract("V1EMPRegistry", [CONTRACTS.governance.address]);

	return { ...CONTRACTS, registry, };
};


export async function stageSpecificSetup()
{
	const CONTRACTS: StageContracts0 = await stageContracts();

	let existingVoidSigners: number = 0;

	let k: keyof StageContracts0;

	for (k in CONTRACTS)
	{
		if (Signer.isSigner(CONTRACTS[k]))
		{
			existingVoidSigners++;
		}
	}

	const signers = await ethers.getSigners();

	if (signers.length < existingVoidSigners + 8)
	{
		throw new Error("Not enough signers available");
	}

	return {
		fakeERC20: signers[existingVoidSigners],
		fakeEthValueProvider: signers[existingVoidSigners + 1],
		fakeStrategyDeployer: signers[existingVoidSigners + 2],
		fakeStrategyUtility: signers[existingVoidSigners + 3],
		fakeEMPDeployer: signers[existingVoidSigners + 4],
		fakeEMPUtility: signers[existingVoidSigners + 5],
		fakeEMP: signers[existingVoidSigners + 6],
		fakeEMPStrategy: signers[existingVoidSigners + 7],
	};
}
