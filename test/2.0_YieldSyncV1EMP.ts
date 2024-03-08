const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

import { ERROR } from "../common";


describe("[2.0] YieldSyncV1EMP.sol - Setup", async () =>
{
	let eTHValueFeedDummy: Contract;
	let yieldSyncV1EMP: Contract;
	let yieldSyncV1EMPRegistry: Contract;
	let yieldSyncV1EMPStrategyDeployer: Contract;


	beforeEach("[beforeEach] Set up contracts..", async () =>
	{
		const [OWNER] = await ethers.getSigners();

		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const YieldSyncV1EMP: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMP");
		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");
		const YieldSyncV1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategyDeployer");

		eTHValueFeedDummy = await (await ETHValueFeedDummy.deploy()).deployed();
		yieldSyncV1EMPRegistry = await (await YieldSyncV1EMPRegistry.deploy()).deployed();
		yieldSyncV1EMPStrategyDeployer = await (
			await YieldSyncV1EMPStrategyDeployer.deploy(yieldSyncV1EMPRegistry.address, OWNER.address)
		).deployed();

		// Mock owner being an EMP Deployer
		await expect(
			yieldSyncV1EMPRegistry.yieldSyncV1EMPDeployerUpdate(OWNER.address)
		).to.not.be.reverted;

		// Mock owner being an EMP
		await expect(
			yieldSyncV1EMPRegistry.yieldSyncV1EMPRegister(OWNER.address)
		).to.not.be.reverted;

		// Set EMP Strategy Deployer on registry
		await expect(
			yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyDeployerUpdate(yieldSyncV1EMPStrategyDeployer.address)
		).to.not.be.reverted;

		await expect(
			yieldSyncV1EMPStrategyDeployer.deployYieldSyncV1EMPStrategy("Strategy", "S")
		).to.be.not.reverted;

		expect(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(0)).to.be.not.equal(
			ethers.constants.AddressZero
		);
	});
});
