const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";

import { ERROR, PERCENT } from "../common";


describe("[4.0] YieldSyncV1EMP.sol - Setup", async () =>
{
	let eTHValueFeedDummy: Contract;
	let yieldSyncV1EMP: Contract;
	let yieldSyncV1EMPDeployer: Contract;
	let yieldSyncV1EMPRegistry: Contract;
	let yieldSyncV1EMPStrategy: Contract;
	let yieldSyncV1EMPStrategy2: Contract;
	let yieldSyncV1EMPStrategyDeployer: Contract;


	beforeEach("[beforeEach] Set up contracts..", async () =>
	{
		/**
		* This beforeEach process does the following:
		* 1) Deploy a registry
		* 2) Deploys an EMP Deployer and registers it on the registry
		* 3) Attach the deployed emp to a local variable
		* 4) Deploy a strategy
		* 5) Attach the deployed EMP Strategy to a local variable
		*/
		const [OWNER] = await ethers.getSigners();

		const YieldSyncV1EMP: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMP");
		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");
		const YieldSyncV1EMPDeployer: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPDeployer");
		const YieldSyncV1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategyDeployer");

		yieldSyncV1EMPRegistry = await (await YieldSyncV1EMPRegistry.deploy()).deployed();
		yieldSyncV1EMPDeployer = await (
			await YieldSyncV1EMPDeployer.deploy(OWNER.address, yieldSyncV1EMPRegistry.address)
		).deployed();
		yieldSyncV1EMPStrategyDeployer = await (
			await YieldSyncV1EMPStrategyDeployer.deploy(OWNER.address, yieldSyncV1EMPRegistry.address)
		).deployed();

		// Set the EMP Deployer on registry
		await expect(yieldSyncV1EMPRegistry.yieldSyncV1EMPDeployerUpdate(yieldSyncV1EMPDeployer.address)).to.not.be.reverted;

		// Set the EMP Strategy Deployer on registry
		await expect(
			yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyDeployerUpdate(yieldSyncV1EMPStrategyDeployer.address)
		).to.not.be.reverted;

		// Deploy an EMP
		await expect(yieldSyncV1EMPDeployer.deployYieldSyncV1EMP("EMP Name", "EMP")).to.be.not.reverted;

		// Verify that a EMP has been registered
		expect(await yieldSyncV1EMPRegistry.yieldSyncV1EMPId_yieldSyncV1EMP(1)).to.be.not.equal(
			ethers.constants.AddressZero
		);

		// Deploy an EMP Strategy
		await expect(
			yieldSyncV1EMPStrategyDeployer.deployYieldSyncV1EMPStrategy("EMP Strategy Name", "EMPS")
		).to.be.not.reverted;

		// Verify that a EMP Strategy has been registered
		expect(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(1)).to.be.not.equal(
			ethers.constants.AddressZero
		);

		// Attach the deployed YieldSyncV1EMP address
		yieldSyncV1EMP = await YieldSyncV1EMP.attach(
			String(await yieldSyncV1EMPRegistry.yieldSyncV1EMPId_yieldSyncV1EMP(1))
		);

		// Deploy an EMP Strategy
		await expect(
			yieldSyncV1EMPStrategyDeployer.deployYieldSyncV1EMPStrategy("EMP Strategy Name 2", "EMPS2")
		).to.be.not.reverted;

		// Attach the deployed YieldSyncV1EMPStrategy address
		yieldSyncV1EMPStrategy = await YieldSyncV1EMP.attach(
			String(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(1))
		);

		// Attach the deployed YieldSyncV1EMPStrategy address
		yieldSyncV1EMPStrategy2 = await YieldSyncV1EMP.attach(
			String(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(2))
		);
	});

	describe("function utilizedYieldSyncV1EMPStrategyUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			const UtilizedYieldSyncV1EMPStrategy: [string, string][] = [];

			await expect(
				yieldSyncV1EMP.connect(ADDR_1).utilizedYieldSyncV1EMPStrategyUpdate(UtilizedYieldSyncV1EMPStrategy)
			).to.be.rejectedWith(ERROR.NOT_MANAGER);
		});

		it("Should NOT allow strategies that add up to more than 100% to EMP..", async () => {
			const UtilizedYieldSyncV1EMPStrategy: [string, string][] = [
				[yieldSyncV1EMPStrategy.address, PERCENT.HUNDRED],
				[yieldSyncV1EMPStrategy2.address, PERCENT.FIFTY],
			];

			await expect(
				yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedYieldSyncV1EMPStrategy)
			).to.be.rejectedWith(ERROR.INVALID_ALLOCATION_STRATEGY);
		});

		it("Should allow attaching Strategy to EMP..", async () => {
			const UtilizedYieldSyncV1EMPStrategy: [string, string][] = [
				[yieldSyncV1EMPStrategy.address, PERCENT.HUNDRED]
			];

			await expect(
				yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedYieldSyncV1EMPStrategy)
			).to.be.not.rejected;

			const strategies: UtilizedYieldSyncV1EMPStrategy[] = await yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategy();

			expect(strategies.length).to.be.equal(UtilizedYieldSyncV1EMPStrategy.length);

			expect(strategies[0].yieldSyncV1EMPStrategy).to.be.equal(yieldSyncV1EMPStrategy.address);
			expect(strategies[0].allocation).to.be.equal(PERCENT.HUNDRED);
		});

		it("Should allow attaching multiple Strategies to EMP..", async () => {
			const UtilizedYieldSyncV1EMPStrategy: [string, string][] = [
				[yieldSyncV1EMPStrategy.address, PERCENT.FIFTY],
				[yieldSyncV1EMPStrategy2.address, PERCENT.FIFTY],
			];

			await expect(
				yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedYieldSyncV1EMPStrategy)
			).to.be.not.rejected;

			const strategies: UtilizedYieldSyncV1EMPStrategy[] = await yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategy();

			expect(strategies.length).to.be.equal(UtilizedYieldSyncV1EMPStrategy.length);

			for (let i = 0; i < strategies.length; i++)
			{
				expect(strategies[i].yieldSyncV1EMPStrategy).to.be.equal(UtilizedYieldSyncV1EMPStrategy[i][0]);
				expect(strategies[i].allocation).to.be.equal(UtilizedYieldSyncV1EMPStrategy[i][1]);
			}
		});
	});
});
