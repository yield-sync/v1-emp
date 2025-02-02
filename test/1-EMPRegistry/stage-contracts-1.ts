import { Contract, VoidSigner } from "ethers";

import stageContracts, { StageContracts0 } from "../stage-contracts-0";
import { deployContract } from "../../util/UtilEMP";


const { ethers } = require("hardhat");


export type StageContracts1 = StageContracts0 & {
	registry: Contract,
};


export default async (): Promise<StageContracts1> => {
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
	}: StageContracts0 = await stageContracts();

	const registry: Contract = await deployContract("V1EMPRegistry", [governance.address]);

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
		registry,
	};
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
