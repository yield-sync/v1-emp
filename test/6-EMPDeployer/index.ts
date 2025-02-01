import { expect } from "chai";
import { Contract, VoidSigner } from "ethers";

import setup, { SetUpContractsStage6 } from "./setup";
import { deployContract } from "../../util/UtilEMP";


const { ethers } = require("hardhat");


describe("[6.0] V1EMPDeployer.sol - Setup", async () => {
	let eMPDeployer: Contract;
	let registry: Contract;

	let badActor: VoidSigner;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		(
			{
				badActor,
				registry,
				eMPDeployer,
			} = await setup()
		);

	});

	describe("function deployV1EMPOpenUpdate()", async () => {
		it("[auth] Should revert if an unauthorized sender calls..", async () => {
			// Deploy an EMP
			await expect(eMPDeployer.connect(badActor).deployV1EMPOpenUpdate(true)).to.be.rejectedWith(
				"!authorized"
			);
		});

		it("Should update deployV1EMPOpen..", async () => {
			expect(await eMPDeployer.deployV1EMPOpen()).to.be.equal(false);

			await expect(eMPDeployer.deployV1EMPOpenUpdate(true)).to.be.not.rejected;

			expect(await eMPDeployer.deployV1EMPOpen()).to.be.equal(true);
		});
	});

	describe("function deployV1EMP()", async () => {
		it("[auth] Should revert if an unauthorized sender calls..", async () => {
			await expect(eMPDeployer.connect(badActor).deployV1EMP(false, "EMP Name", "EMP")).to.be.rejectedWith(
				"!authorized"
			);
		});

		it("Should initialize the contract correctly", async () => {
			// Deploy an EMP
			await expect(eMPDeployer.deployV1EMP(false, "EMP Name", "EMP")).to.be.not.rejected;

			// Verify that a EMP Strategy has been registered
			expect(await registry.v1EMPId_v1EMP(1)).to.be.not.equal(ethers.constants.AddressZero);
		})

		it("Should allow anyone to deploy EMP if open..", async () => {
			await eMPDeployer.deployV1EMPOpenUpdate(true);

			await expect(eMPDeployer.connect(badActor).deployV1EMP(false, "EMP Name", "EMP")).to.be.not.rejected;

			expect(await registry.v1EMPId_v1EMP(1)).to.be.not.equal(ethers.constants.AddressZero);
		});
	});
});
