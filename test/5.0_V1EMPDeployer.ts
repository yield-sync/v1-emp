const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory, VoidSigner } from "ethers";


describe("[5.0] V1EMPDeployer.sol - Setup", async () => {
	let arrayUtility: Contract;
	let empDeployer: Contract;
	let governance: Contract;
	let registry: Contract;

	let owner: VoidSigner;
	let manager: VoidSigner;
	let treasury: VoidSigner;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		/**
		* This beforeEach process does the following:
		* 1) Deploy a registry
		* 2) deploys an EMP Deployer and registers it on the registry
		*/
		[owner, manager, treasury] = await ethers.getSigners();

		const V1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("V1EMPArrayUtility");
		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const V1EMPRegistry: ContractFactory = await ethers.getContractFactory("V1EMPRegistry");
		const V1EMPDeployer: ContractFactory = await ethers.getContractFactory("V1EMPDeployer");

		arrayUtility = await (await V1EMPArrayUtility.deploy()).deployed();
		governance = await (await YieldSyncGovernance.deploy()).deployed();
		registry = await (await V1EMPRegistry.deploy(governance.address)).deployed();

		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

		empDeployer = await (await V1EMPDeployer.deploy(registry.address)).deployed();

		// Set Treasury
		await expect(governance.payToUpdate(treasury.address)).to.be.not.rejected;

		await registry.v1EMPUtilityUpdate(arrayUtility.address);

		// Set the EMP Deployer on registry
		await registry.v1EMPDeployerUpdate(empDeployer.address);
	});

	describe("Setup process", async () => {
		it("Should initialize the contract correctly", async () => {
			// Deploy an EMP
			await expect(empDeployer.deployV1EMP(false, "EMP Name", "EMP")).to.be.not.rejected;

			// Verify that a EMP Strategy has been registered
			expect(await registry.v1EMPId_v1EMP(1)).to.be.not.equal(ethers.constants.AddressZero);
		})
	});
});
