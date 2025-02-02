import { Contract, VoidSigner } from "ethers";

import { deployContract } from "../util/UtilEMP";


export type StageContracts0 = {
	owner: VoidSigner,
	manager: VoidSigner,
	treasury: VoidSigner,
	badActor: VoidSigner,
	eRC20A: Contract,
	eRC20B: Contract,
	eRC20C: Contract,
	eRC20D: Contract,
	governance: Contract,
	addressArrayUtility: Contract,
};


const { ethers } = require("hardhat");


export default async (): Promise<StageContracts0> => {
	const [owner, manager, treasury, badActor,]: VoidSigner[] = await ethers.getSigners();

	const eRC20A: Contract = await deployContract("MockERC20", ["ERC A", "A", 18]);

	const eRC20B: Contract = await deployContract("MockERC20", ["ERC B", "B", 18]);

	const eRC20C: Contract = await deployContract("MockERC20", ["ERC C", "C", 6]);

	const eRC20D: Contract = await deployContract("MockERC20", ["ERC D", "D", 18]);

	const governance: Contract = await deployContract("YieldSyncGovernance");

	const addressArrayUtility: Contract = await deployContract("AddressArrayUtility");

	await governance.payToUpdate(treasury.address);

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
	};
};
