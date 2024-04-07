const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

import { ERROR } from "../common";


describe("[4.0] YieldSyncV1EMP.sol - Setup", async () =>
{
	let eTHValueFeedDummy: Contract;
	let yieldSyncV1EMP: Contract;
	let yieldSyncV1EMPRegistry: Contract;
	let yieldSyncV1EMPStrategyDeployer: Contract;
	let yieldSyncV1EMPDeployer: Contract;


	beforeEach("[beforeEach] Set up contracts..", async () =>
	{
		/**
		* This beforeEach process does the following:
		* 1) Deploy a registry
		* 2) deploys an EMP Deployer and registers it on the registry
		*/
		const [OWNER] = await ethers.getSigners();

		const YieldSyncV1EMP: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMP");
		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");
		const YieldSyncV1EMPDeployer: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPDeployer");

		yieldSyncV1EMPRegistry = await (await YieldSyncV1EMPRegistry.deploy()).deployed();
		yieldSyncV1EMPDeployer = await (
			await YieldSyncV1EMPDeployer.deploy(OWNER.address, yieldSyncV1EMPRegistry.address)
		).deployed();

		// Set the EMP Deployer on registry
		await expect(yieldSyncV1EMPRegistry.yieldSyncV1EMPDeployerUpdate(yieldSyncV1EMPDeployer.address)).to.not.be.reverted;

		// Deploy an EMP
		await expect(yieldSyncV1EMPDeployer.deployYieldSyncV1EMP("EMP Name", "EMP")).to.be.not.reverted;

		// Verify that a EMP Strategy has been registered
		expect(await yieldSyncV1EMPRegistry.yieldSyncV1EMPId_yieldSyncV1EMP(1)).to.be.not.equal(
			ethers.constants.AddressZero
		);

		// Attach the deployed YieldSyncV1EMPStrategy address
		yieldSyncV1EMP = await YieldSyncV1EMP.attach(
			String(await yieldSyncV1EMPRegistry.yieldSyncV1EMPId_yieldSyncV1EMP(1))
		);
	});

	describe("function utilizedYieldSyncV1EMPStrategyUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

				const UtilizedYieldSyncV1EMPStrategy: [string, string][] = []

				await expect(
					yieldSyncV1EMP.connect(ADDR_1).utilizedYieldSyncV1EMPStrategyUpdate(UtilizedYieldSyncV1EMPStrategy)
				).to.be.rejectedWith(ERROR.NOT_MANAGER);
		})
	});
});
