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
	const [owner, manager, treasury, badActor] = await ethers.getSigners();

	const [
		eRC20A,
		eRC20B,
		eRC20C,
		eRC20D,
		governance,
		addressArrayUtility,
	] = await Promise.all([
		deployContract("MockERC20", ["ERC A", "A", 18]),
		deployContract("MockERC20", ["ERC B", "B", 18]),
		deployContract("MockERC20", ["ERC C", "C", 6]),
		deployContract("MockERC20", ["ERC D", "D", 18]),
		deployContract("YieldSyncGovernance"),
		deployContract("AddressArrayUtility"),
	]);

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
