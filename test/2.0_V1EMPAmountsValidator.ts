const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory, VoidSigner } from "ethers";
import { ERROR } from "../const";


describe("[2.0] V1EMPAmountsValidator.sol", async () => {
	let arrayUtility: Contract;
	let governance: Contract;
	let registry: Contract;
	let amountsValidator: Contract;

	let treasury: VoidSigner;


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
		[, , treasury] = await ethers.getSigners();


		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const V1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("V1EMPArrayUtility");
		const V1EMPRegistry: ContractFactory = await ethers.getContractFactory("V1EMPRegistry");
		const V1EMPAmountsValidator: ContractFactory= await ethers.getContractFactory("V1EMPAmountsValidator");


		governance = await (await YieldSyncGovernance.deploy()).deployed();

		await governance.payToUpdate(treasury.address);

		arrayUtility = await (await V1EMPArrayUtility.deploy()).deployed();

		registry = await (await V1EMPRegistry.deploy(governance.address)).deployed();

		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

		amountsValidator = await (await V1EMPAmountsValidator.deploy(registry.address)).deployed();

		// Set the Strategy Deployer
		await registry.v1EMPStrategyDeployerUpdate(amountsValidator.address);
	});

	describe("function utilizedERC20AmountValid()", async () => {
		it("[modifier][auth] Should only be able to called by EMP..", async () => {
			await expect(amountsValidator.utilizedERC20AmountValid([])).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
		});
	});

	describe("function v1EMPStrategyUtilizedERC20AmountValid()", async () => {
		it("[modifier][auth] Should only be able to called by EMP..", async () => {
			await expect(amountsValidator.v1EMPStrategyUtilizedERC20AmountValid([])).to.be.rejectedWith(
				ERROR.NOT_AUTHORIZED
			);
		});
	});
});
