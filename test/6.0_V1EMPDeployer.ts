const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, VoidSigner } from "ethers";

import { deployContract } from "../util/UtilEMP";


describe("[6.0] V1EMPDeployer.sol - Setup", async () => {
	let arrayUtility: Contract;
	let empDeployer: Contract;
	let governance: Contract;
	let registry: Contract;

	let badActor: VoidSigner;
	let owner: VoidSigner;
	let manager: VoidSigner;
	let treasury: VoidSigner;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		[owner, manager, treasury, badActor] = await ethers.getSigners();

		governance = await deployContract("@yield-sync/governance/contracts/YieldSyncGovernance.sol:YieldSyncGovernance");
		arrayUtility = await deployContract("V1EMPArrayUtility");
		registry = await deployContract("V1EMPRegistry", [governance.address]);
		empDeployer = await deployContract("V1EMPDeployer", [registry.address]);

		await governance.payToUpdate(treasury.address);
		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);
		await registry.v1EMPUtilityUpdate(arrayUtility.address);
		await registry.v1EMPDeployerUpdate(empDeployer.address);
	});

	describe("function deployV1EMPOpenUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			// Deploy an EMP
			await expect(empDeployer.connect(badActor).deployV1EMPOpenUpdate(true)).to.be.rejectedWith(
				"!authorized"
			);
		});

		it("Should update deployV1EMPOpen..", async () => {
			expect(await empDeployer.deployV1EMPOpen()).to.be.equal(false);

			await expect(empDeployer.deployV1EMPOpenUpdate(true)).to.be.not.rejected;

			expect(await empDeployer.deployV1EMPOpen()).to.be.equal(true);
		});
	});

	describe("function deployV1EMP()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			await expect(empDeployer.connect(badActor).deployV1EMP(false, "EMP Name", "EMP")).to.be.rejectedWith(
				"!authorized"
			);
		});

		it("Should initialize the contract correctly", async () => {
			// Deploy an EMP
			await expect(empDeployer.deployV1EMP(false, "EMP Name", "EMP")).to.be.not.rejected;

			// Verify that a EMP Strategy has been registered
			expect(await registry.v1EMPId_v1EMP(1)).to.be.not.equal(ethers.constants.AddressZero);
		})

		it("Should allow anyone to deploy EMP if open..", async () => {
			await empDeployer.deployV1EMPOpenUpdate(true);

			await expect(empDeployer.connect(badActor).deployV1EMP(false, "EMP Name", "EMP")).to.be.not.rejected;

			expect(await registry.v1EMPId_v1EMP(1)).to.be.not.equal(ethers.constants.AddressZero);
		});
	});
});
