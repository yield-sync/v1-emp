const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";


describe("[6.0] YieldSyncV1EMPDeployer.sol - Setup", async () => {
	let arrayUtility: Contract;
	let empDeployer: Contract;
	let governance: Contract;
	let registry: Contract;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		/**
		* This beforeEach process does the following:
		* 1) Deploy a registry
		* 2) deploys an EMP Deployer and registers it on the registry
		*/
		const [OWNER, MANAGER, TREASURY] = await ethers.getSigners();

		const YieldSyncV1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPArrayUtility");
		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");
		const YieldSyncV1EMPDeployer: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPDeployer");

		arrayUtility = await (await YieldSyncV1EMPArrayUtility.deploy()).deployed();
		governance = await (await YieldSyncGovernance.deploy()).deployed();
		registry = await (await YieldSyncV1EMPRegistry.deploy(governance.address)).deployed();

		await registry.yieldSyncV1EMPArrayUtilityUpdate(arrayUtility.address);

		empDeployer = await (await YieldSyncV1EMPDeployer.deploy(registry.address)).deployed();

		// Set Treasury
		await expect(governance.payToUpdate(TREASURY.address)).to.be.not.rejected;

		await registry.yieldSyncV1EMPUtilityUpdate(arrayUtility.address);

		// Set the EMP Deployer on registry
		await registry.yieldSyncV1EMPDeployerUpdate(empDeployer.address);
	});

	describe("Setup process", async () => {
		it("Should initialize the contract correctly", async () => {
			// Deploy an EMP
			await expect(empDeployer.deployYieldSyncV1EMP("EMP Name", "EMP")).to.be.not.rejected;

			// Verify that a EMP Strategy has been registered
			expect(await registry.yieldSyncV1EMPId_yieldSyncV1EMP(1)).to.be.not.equal(ethers.constants.AddressZero);
		})
	});
});
