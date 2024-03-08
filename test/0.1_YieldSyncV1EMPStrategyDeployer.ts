const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

import { ERROR } from "../common";


describe("[0.1] YieldSyncV1EMPStrategyDeployer.sol - Setup", async () =>
{
	let eTHValueFeedDummy: Contract;
	let strategyInteractorDummy: Contract;
	let yieldSyncV1EMPRegistry: Contract;
	let yieldSyncV1EMPStrategyDeployer: Contract;

	beforeEach("[beforeEach] Set up contracts..", async () =>
	{
		const [OWNER] = await ethers.getSigners();

		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");
		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");
		const YieldSyncV1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategyDeployer");

		eTHValueFeedDummy = await (await ETHValueFeedDummy.deploy()).deployed();
		strategyInteractorDummy = await (await StrategyInteractorDummy.deploy()).deployed();
		yieldSyncV1EMPRegistry = await (await YieldSyncV1EMPRegistry.deploy()).deployed();

		yieldSyncV1EMPStrategyDeployer = await (
			await YieldSyncV1EMPStrategyDeployer.deploy(yieldSyncV1EMPRegistry.address, OWNER.address)
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

				expect(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(0)).to.be.not.equal(
					ethers.constants.AddressZero
				);
			}
		);
	});
});
