const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";


describe("[2.0] V1EMPStrategyUtility.sol", async () => {
	let arrayUtility: Contract;
	let governance: Contract;
	let registry: Contract;
	let strategyUtility: Contract;


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


		governance = await (await YieldSyncGovernance.deploy()).deployed();

		await governance.payToUpdate(TREASURY.address);

		arrayUtility = await (await V1EMPArrayUtility.deploy()).deployed();

		registry = await (await V1EMPRegistry.deploy(governance.address)).deployed();

		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

		strategyUtility = await (
			await V1EMPStrategyUtility.deploy(registry.address)
		).deployed();

		await registry.v1EMPStrategyUtilityUpdate(strategyUtility.address);
	});


	describe("function sort()", async () => {
		it(
			"Should sort an unordered array..",
			async () => {
				const [ADDR_1, ADDR_2] = await ethers.getSigners();

				const ADDR_1_IN_BASE_10 = parseInt(ADDR_1.address, 16)
				const ADDR_2_IN_BASE_10 = parseInt(ADDR_2.address, 16)

				// Simple
				let result = await arrayUtility.sort(
					[ADDR_1.address, ADDR_1.address, ethers.constants.AddressZero]
				);

				expect(result[0]).to.be.equal(ethers.constants.AddressZero);
				expect(result[1]).to.be.equal(ADDR_1.address);
				expect(result[2]).to.be.equal(ADDR_1.address);

				// With multiple addresses
				let result2 = await arrayUtility.sort(
					[ADDR_2.address, ADDR_1.address, ethers.constants.AddressZero]
				);

				expect(result2[0]).to.be.equal(ethers.constants.AddressZero);

				if (ADDR_1_IN_BASE_10 > ADDR_2_IN_BASE_10)
				{
					expect(result2[1]).to.be.equal(ADDR_2.address);
					expect(result2[2]).to.be.equal(ADDR_1.address);
				}
				else
				{
					expect(result2[1]).to.be.equal(ADDR_1.address);
					expect(result2[2]).to.be.equal(ADDR_2.address);
				}
			}
		);
	});
});
