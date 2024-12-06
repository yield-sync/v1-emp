const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory, VoidSigner } from "ethers";
import { approveTokens, deployContract, deployEMP, deployStrategies } from "../util/UtilEMP";


describe("[4.0] V1EMPStrategyDeployer.sol", async () => {
	let arrayUtility: Contract;
	let governance: Contract;
	let registry: Contract;
	let strategyDeployer: Contract;

	let treasury: VoidSigner;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		[, , treasury] = await ethers.getSigners();

		governance = await deployContract("YieldSyncGovernance");
		arrayUtility = await deployContract("V1EMPArrayUtility");
		registry = await deployContract("V1EMPRegistry", [governance.address]);
		strategyDeployer = await deployContract("V1EMPStrategyDeployer", [registry.address]);

		await governance.payToUpdate(treasury.address);
		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);
		await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);
	});


	describe("function deployV1EMPStrategy()", async () => {
		it("Should be able to deploy a strategy..", async () => {
			await expect(strategyDeployer.deployV1EMPStrategy()).to.be.not.rejected;

			expect(await registry.v1EMPStrategyId_v1EMPStrategy(1)).to.be.not.equal(ethers.constants.AddressZero);
		});
	});
});
