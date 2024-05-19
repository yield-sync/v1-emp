const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

import { ERROR } from "../const";


describe("[0.0] YieldSyncV1EMPRegistry.sol - Setup", async () => {
	let yieldSyncUtilityV1Array: Contract;
	let yieldSyncGovernance: Contract;
	let yieldSyncV1EMPRegistry: Contract;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		const [OWNER, MANAGER, TREASURY] = await ethers.getSigners();

		const YieldSyncUtilityV1Array: ContractFactory = await ethers.getContractFactory("YieldSyncUtilityV1Array");
		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");

		yieldSyncUtilityV1Array = await (await YieldSyncUtilityV1Array.deploy()).deployed();
		yieldSyncGovernance = await (await YieldSyncGovernance.deploy()).deployed();
		yieldSyncV1EMPRegistry = await (await YieldSyncV1EMPRegistry.deploy(yieldSyncGovernance.address, yieldSyncUtilityV1Array.address)).deployed();

		// Set Treasury
		await expect(yieldSyncGovernance.payToUpdate(TREASURY.address)).to.not.be.reverted;
	});

	describe("function yieldSyncV1EMPDeployerUpdate()", async () => {
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () => {
				const [, ADDR_1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPRegistry.connect(ADDR_1).yieldSyncV1EMPDeployerUpdate(ADDR_1.address)
				).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
			}
		);
	});
});
