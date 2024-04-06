const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

import { ERROR } from "../common";


describe("[0.1] YieldSyncV1EMPStrategyDeployer.sol - Setup", async () =>
{
	let yieldSyncV1EMPRegistry: Contract;
	let yieldSyncV1EMPStrategyDeployer: Contract;

	beforeEach("[beforeEach] Set up contracts..", async () =>
	{
		/**
		* This beforeEach process does the following:
		* 1) Deploy a registry
		* 2) deploys an EMP Strategy Deployer and registers it on the registry
		*/
		const [OWNER] = await ethers.getSigners();

		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");
		const YieldSyncV1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategyDeployer");

		yieldSyncV1EMPRegistry = await (await YieldSyncV1EMPRegistry.deploy()).deployed();

		yieldSyncV1EMPStrategyDeployer = await (
			await YieldSyncV1EMPStrategyDeployer.deploy(OWNER.address, yieldSyncV1EMPRegistry.address)
		).deployed();

		await expect(
			yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyDeployerUpdate(yieldSyncV1EMPStrategyDeployer.address)
		).to.be.not.reverted;
	});

	describe("function yieldSyncV1EMPDeployerUpdate()", async () =>
	{
		it(
			"[auth] Should be able to deploy a strategy..",
			async () =>
			{
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
