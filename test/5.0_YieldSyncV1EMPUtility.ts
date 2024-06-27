const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";


describe("[5.0] YieldSyncV1EMPUtility.sol", async () => {
	let arrayUtility: Contract;
	let governance: Contract;
	let registry: Contract;
	let eMPUtility: Contract;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		const [, , TREASURY] = await ethers.getSigners();


		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const YieldSyncV1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPArrayUtility");
		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");
		const YieldSyncV1EMPUtility: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPUtility");


		governance = await (await YieldSyncGovernance.deploy()).deployed();
		arrayUtility = await (await YieldSyncV1EMPArrayUtility.deploy()).deployed();
		registry = await (await YieldSyncV1EMPRegistry.deploy(governance.address)).deployed();
		eMPUtility = await (await YieldSyncV1EMPUtility.deploy(registry.address)).deployed();


		await governance.payToUpdate(TREASURY.address);
		await registry.yieldSyncV1EMPArrayUtilityUpdate(arrayUtility.address);
	});
});
