const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";


describe("[3.0] V1EMPStrategyDeployer.sol", async () => {
	let arrayUtility: Contract;
	let governance: Contract;
	let registry: Contract;
	let strategyUtility: Contract;
	let strategyDeployer: Contract;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		/**
		* This beforeEach process does the following:
		* 1) Deploy a Governance contract
		* 2) Set the treasury on the Governance contract
		* 3) Deploy an Array Utility contract
		* 4) Deploy a Registry contract
		* 5) Register the Array Utility contract on the Registry contract
		* 6) Deploy a Strategy Utility contract
		* 7) Register the Strategy Utility contract on the Registry contract
		*/
		const [, , TREASURY] = await ethers.getSigners();


		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const V1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("V1EMPArrayUtility");
		const V1EMPRegistry: ContractFactory = await ethers.getContractFactory("V1EMPRegistry");
		const V1EMPStrategyUtility: ContractFactory= await ethers.getContractFactory("V1EMPStrategyUtility");
		const V1EMPStrategyDeployer: ContractFactory= await ethers.getContractFactory("V1EMPStrategyDeployer");


		governance = await (await YieldSyncGovernance.deploy()).deployed();

		await governance.payToUpdate(TREASURY.address);

		arrayUtility = await (await V1EMPArrayUtility.deploy()).deployed();

		registry = await (await V1EMPRegistry.deploy(governance.address)).deployed();

		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

		strategyUtility = await (
			await V1EMPStrategyUtility.deploy(registry.address)
		).deployed();

		await registry.v1EMPStrategyUtilityUpdate(strategyUtility.address);

		strategyDeployer = await (
			await V1EMPStrategyDeployer.deploy(registry.address)
		).deployed();

		// Set the Strategy Deployer
		await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);
	});

	describe("function v1EMPDeployerUpdate()", async () => {
		it("Should be able to deploy a strategy..", async () => {
			await expect(
				strategyDeployer.deployV1EMPStrategy("Strategy Name", "S")
			).to.be.not.rejected;

			expect(await registry.v1EMPStrategyId_v1EMPStrategy(1)).to.be.not.equal(
				ethers.constants.AddressZero
			);
		});
	});
});
