import { Contract, VoidSigner } from "ethers";

import { deployContract } from "../util/UtilEMP";


export type SetUpContracts = {
	owner: VoidSigner,
	manager: VoidSigner,
	treasury: VoidSigner,
	badActor: VoidSigner,
	mockERC20A: Contract,
	mockERC20B: Contract,
	mockERC20C: Contract,
	mockERC20D: Contract,
	governance: Contract,
	addressArrayUtility: Contract,
}

const { ethers } = require("hardhat");


export default async (): Promise<SetUpContracts> => {
	const [owner, manager, treasury, badActor,]: VoidSigner[] = await ethers.getSigners();

	const mockERC20A: Contract = await deployContract("MockERC20", ["Mock A", "A", 18]);

	const mockERC20B: Contract = await deployContract("MockERC20", ["Mock B", "B", 18]);

	const mockERC20C: Contract = await deployContract("MockERC20", ["Mock C", "C", 6]);

	const mockERC20D: Contract = await deployContract("MockERC20", ["Mock D", "D", 18]);

	const governance: Contract = await deployContract("YieldSyncGovernance");

	const addressArrayUtility: Contract = await deployContract("AddressArrayUtility");

	await governance.payToUpdate(treasury.address);

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
	};
};
