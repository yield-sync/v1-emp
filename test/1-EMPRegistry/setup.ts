import { Contract, VoidSigner } from "ethers";

import setup, { SetUpContractsStage0 } from "../setup";
import { deployContract } from "../../util/UtilEMP";


export type SetUpContractsStage1 = SetUpContractsStage0 & {
	registry: Contract;
};


const { ethers } = require("hardhat");


export default async (): Promise<SetUpContractsStage1> => {
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
	}: SetUpContractsStage0 = await setup();

	const registry: Contract = await deployContract("V1EMPRegistry", [governance.address]);

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
