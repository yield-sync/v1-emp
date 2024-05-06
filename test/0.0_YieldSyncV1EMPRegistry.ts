const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

import { ERROR } from "../const";


describe("[0.0] YieldSyncV1EMPRegistry.sol - Setup", async () => {
	let mockYieldSyncGovernance: Contract;
	let yieldSyncV1EMPRegistry: Contract;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		const [OWNER, ADDR_1] = await ethers.getSigners();

		const MockYieldSyncGovernance: ContractFactory = await ethers.getContractFactory("MockYieldSyncGovernance");
		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");

		mockYieldSyncGovernance = await (await MockYieldSyncGovernance.deploy()).deployed();
		yieldSyncV1EMPRegistry = await (await YieldSyncV1EMPRegistry.deploy(mockYieldSyncGovernance.address, ADDR_1.address)).deployed();
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
