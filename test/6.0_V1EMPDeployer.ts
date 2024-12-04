const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, VoidSigner } from "ethers";

import { deployContract } from "./Scripts";


describe("[6.0] V1EMPDeployer.sol - Setup", async () => {
	let arrayUtility: Contract;
	let empDeployer: Contract;
	let governance: Contract;
	let registry: Contract;

	let owner: VoidSigner;
	let manager: VoidSigner;
	let treasury: VoidSigner;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		[owner, manager, treasury] = await ethers.getSigners();

		governance = await deployContract("YieldSyncGovernance");
		arrayUtility = await deployContract("V1EMPArrayUtility");
		registry = await deployContract("V1EMPRegistry", [governance.address]);
		empDeployer = await deployContract("V1EMPDeployer", [registry.address]);

		await governance.payToUpdate(treasury.address);
		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);
		await registry.v1EMPUtilityUpdate(arrayUtility.address);
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
