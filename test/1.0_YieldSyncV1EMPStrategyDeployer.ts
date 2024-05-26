const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";


describe("[1.0] YieldSyncV1EMPStrategyDeployer.sol - Setup", async () => {
	let yieldSyncUtilityV1Array: Contract;
	let yieldSyncGovernance: Contract;
	let yieldSyncV1EMPRegistry: Contract;
	let yieldSyncV1EMPStrategyDeployer: Contract;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		/**
		* This beforeEach process does the following:
		* 1) Deploy a registry
		* 2) deploys an EMP Strategy Deployer and registers it on the registry
		*/
		const [OWNER, MANAGER, TREASURY] = await ethers.getSigners();
		const YieldSyncUtilityV1Array: ContractFactory = await ethers.getContractFactory("YieldSyncUtilityV1Array");
		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");
		const YieldSyncV1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategyDeployer");

		yieldSyncUtilityV1Array = await (await YieldSyncUtilityV1Array.deploy()).deployed();
		yieldSyncGovernance = await (await YieldSyncGovernance.deploy()).deployed();

		yieldSyncV1EMPRegistry = await (
			await YieldSyncV1EMPRegistry.deploy(yieldSyncGovernance.address, yieldSyncUtilityV1Array.address)
		).deployed();

		yieldSyncV1EMPStrategyDeployer = await (
			await YieldSyncV1EMPStrategyDeployer.deploy(yieldSyncV1EMPRegistry.address)
		).deployed();

		// Set Treasury
		await expect(yieldSyncGovernance.payToUpdate(TREASURY.address)).to.not.be.reverted;

		await expect(
			yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyDeployerUpdate(yieldSyncV1EMPStrategyDeployer.address)
		).to.be.not.reverted;
	});

	describe("function yieldSyncV1EMPDeployerUpdate()", async () => {
		it(
			"[auth] Should be able to deploy a strategy..",
			async () => {
				await expect(
					yieldSyncV1EMPStrategyDeployer.deployYieldSyncV1EMPStrategy("Strategy Name", "S")
				).to.be.not.reverted;

				expect(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(1)).to.be.not.equal(
					ethers.constants.AddressZero
				);
			}
		);
	});
});
