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
		yieldSyncV1EMPRegistry = await (
			await YieldSyncV1EMPRegistry.deploy(yieldSyncGovernance.address)
		).deployed();

		// Set Treasury
		await expect(yieldSyncGovernance.payToUpdate(TREASURY.address)).to.be.not.reverted;
	});

	describe("function yieldSyncV1EMPDeployerUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			await expect(
				yieldSyncV1EMPRegistry.connect(ADDR_1).yieldSyncV1EMPDeployerUpdate(ADDR_1.address)
			).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
		});

		it("Should allow authorized caller to update EMP Deployer..", async () => {
			const [OWNER] = await ethers.getSigners();

			await expect(yieldSyncV1EMPRegistry.yieldSyncV1EMPDeployerUpdate(OWNER.address)).to.be.not.rejected;

			expect(await yieldSyncV1EMPRegistry.yieldSyncV1EMPDeployer()).to.be.equal(OWNER.address);
		});
	});

	describe("function yieldSyncV1EMPRegister()", async () => {
		beforeEach(async () => {
			const [OWNER] = await ethers.getSigners();

			await yieldSyncV1EMPRegistry.yieldSyncV1EMPDeployerUpdate(OWNER.address);

			expect(await yieldSyncV1EMPRegistry.yieldSyncV1EMPDeployer()).to.be.equal(OWNER.address);
		});

		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			await expect(
				yieldSyncV1EMPRegistry.connect(ADDR_1).yieldSyncV1EMPRegister(ADDR_1.address)
			).to.be.rejectedWith("!(yieldSyncV1EMPDeployer == msg.sender)");
		});

		it("Should allow authorized caller to register an EMP..", async () => {
			const [OWNER] = await ethers.getSigners();

			await expect(yieldSyncV1EMPRegistry.yieldSyncV1EMPRegister(OWNER.address)).to.be.not.rejected;

			const yieldSyncV1EMPStrategyId = await yieldSyncV1EMPRegistry.yieldSyncV1EMP_yieldSyncV1EMPId(
				OWNER.address
			);

			expect(yieldSyncV1EMPStrategyId).to.be.greaterThan(0);

			expect(
				await yieldSyncV1EMPRegistry.yieldSyncV1EMPId_yieldSyncV1EMP(yieldSyncV1EMPStrategyId)
			).to.be.equal(OWNER.address);
		});
	});

	describe("function yieldSyncV1EMPStrategyRegister()", async () => {
		beforeEach(async () => {
			const [OWNER] = await ethers.getSigners();

			await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyDeployerUpdate(OWNER.address);

			expect(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyDeployer()).to.be.equal(OWNER.address);
		});

		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			await expect(
				yieldSyncV1EMPRegistry.connect(ADDR_1).yieldSyncV1EMPStrategyRegister(ADDR_1.address)
			).to.be.rejectedWith("!(yieldSyncV1EMPStrategyDeployer == msg.sender)");
		});

		it("Should allow authorized caller to register an EMP strategy..", async () => {
			const [OWNER] = await ethers.getSigners();

			await expect(yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyRegister(OWNER.address)).to.be.not.rejected;

			const yieldSyncV1EMPStrategyId = await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategy_yieldSyncV1EMPStrategyId(
				OWNER.address
			);

			expect(yieldSyncV1EMPStrategyId).to.be.greaterThan(0);

			expect(
				await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(yieldSyncV1EMPStrategyId)
			).to.be.equal(OWNER.address);
		});
	});
});
