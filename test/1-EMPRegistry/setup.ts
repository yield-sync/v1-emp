import { Contract, VoidSigner } from "ethers";

import setup, { SetUpContracts } from "../setup";
import { deployContract } from "../../util/UtilEMP";


export type SetUpContracts1 = SetUpContracts & {
	registry: Contract;
};


const { ethers } = require("hardhat");


export default async (): Promise<SetUpContracts1> => {
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
	}: SetUpContracts = await setup();

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
