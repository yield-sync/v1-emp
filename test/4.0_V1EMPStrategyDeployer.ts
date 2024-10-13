const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory, VoidSigner } from "ethers";


describe("[4.0] V1EMPStrategyDeployer.sol", async () => {
	let arrayUtility: Contract;
	let governance: Contract;
	let registry: Contract;
	let strategyDeployer: Contract;

	let treasury: VoidSigner;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		[, , treasury] = await ethers.getSigners();


		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const V1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("V1EMPArrayUtility");
		const V1EMPRegistry: ContractFactory = await ethers.getContractFactory("V1EMPRegistry");
		const V1EMPStrategyDeployer: ContractFactory= await ethers.getContractFactory("V1EMPStrategyDeployer");


		governance = await (await YieldSyncGovernance.deploy()).deployed();

		await governance.payToUpdate(treasury.address);

		arrayUtility = await (await V1EMPArrayUtility.deploy()).deployed();

		registry = await (await V1EMPRegistry.deploy(governance.address)).deployed();

		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

		strategyDeployer = await (await V1EMPStrategyDeployer.deploy(registry.address)).deployed();

		// Set the Strategy Deployer
		await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);
	});


	describe("function deployV1EMPStrategy()", async () => {
		it("Should be able to deploy a strategy..", async () => {
			await expect(strategyDeployer.deployV1EMPStrategy()).to.be.not.rejected;

			expect(await registry.v1EMPStrategyId_v1EMPStrategy(1)).to.be.not.equal(ethers.constants.AddressZero);
		});
	});
});
