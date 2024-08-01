const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory, VoidSigner } from "ethers";


describe("[5.0] V1EMPAmountsValidator.sol", async () => {
	let arrayUtility: Contract;
	let governance: Contract;
	let registry: Contract;
	let eMPUtility: Contract;

	let treasury: VoidSigner;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		[, , treasury] = await ethers.getSigners();


		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const V1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("V1EMPArrayUtility");
		const V1EMPRegistry: ContractFactory = await ethers.getContractFactory("V1EMPRegistry");
		const V1EMPAmountsValidator: ContractFactory = await ethers.getContractFactory("V1EMPAmountsValidator");


		governance = await (await YieldSyncGovernance.deploy()).deployed();
		arrayUtility = await (await V1EMPArrayUtility.deploy()).deployed();
		registry = await (await V1EMPRegistry.deploy(governance.address)).deployed();
		eMPUtility = await (await V1EMPAmountsValidator.deploy(registry.address)).deployed();


		await governance.payToUpdate(treasury.address);
		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);
	});
});
