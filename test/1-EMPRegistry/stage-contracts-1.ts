import { Contract, VoidSigner } from "ethers";

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


export async function suiteSpecificSetup()
{
	const [
		,
		,
		,
		,
		fakeERC20,
		fakeEthValueProvider,
		fakeStrategyDeployer,
		fakeStrategyUtility,
		fakeEMPDeployer,
		fakeEMPUtility,
		fakeEMP,
		fakeEMPStrategy,
	]: VoidSigner[] = await ethers.getSigners();

	return {
		fakeERC20,
		fakeEthValueProvider,
		fakeStrategyDeployer,
		fakeStrategyUtility,
		fakeEMPDeployer,
		fakeEMPUtility,
		fakeEMP,
		fakeEMPStrategy,
	};
}
