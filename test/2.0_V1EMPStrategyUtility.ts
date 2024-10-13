const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory, VoidSigner } from "ethers";
import { ERROR } from "../const";


describe("[2.0] V1EMPStrategyUtility.sol", async () => {
	let arrayUtility: Contract;
	let governance: Contract;
	let registry: Contract;
	let utility: Contract;

	let treasury: VoidSigner;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		[, , treasury] = await ethers.getSigners();


		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const V1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("V1EMPArrayUtility");
		const V1EMPRegistry: ContractFactory = await ethers.getContractFactory("V1EMPRegistry");
		const V1EMPStrategyUtility: ContractFactory= await ethers.getContractFactory("V1EMPStrategyUtility");


		governance = await (await YieldSyncGovernance.deploy()).deployed();

		await governance.payToUpdate(treasury.address);

		arrayUtility = await (await V1EMPArrayUtility.deploy()).deployed();

		registry = await (await V1EMPRegistry.deploy(governance.address)).deployed();

		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

		utility = await (await V1EMPStrategyUtility.deploy(registry.address)).deployed();

		// Set the Strategy Deployer
		await registry.v1EMPStrategyDeployerUpdate(utility.address);
	});


	describe("view", async () => {
		describe("function depositAmountsValid()", async () => {
			describe("Expected Failure", async () => {
				it("[modifier] Should only be able to pass a valid EMP STRATEGY address..", async () => {
					await expect(
						utility.depositAmountsValid(ethers.constants.AddressZero, [])
					).to.be.rejectedWith(
						ERROR.STRATEGY_UTILITY.ADDRESS_NOT_STRATEGY
					);
				});
			});
		});

		describe("function utilizedERC20AmountETHValue()", async () => {
			describe("Expected Failure", async () => {
				it("[modifier] Should only be able to pass a valid EMP STRATEGY address..", async () => {
					await expect(
						utility.utilizedERC20AmountETHValue(ethers.constants.AddressZero, [])
					).to.be.rejectedWith(
						ERROR.STRATEGY_UTILITY.ADDRESS_NOT_STRATEGY
					);
				});
			});
		});
	});

	describe("mutatitive", async () => {
		describe("function utilizedERC20UpdateValid()", async () => {
			describe("Expected Failure", async () => {
				it("[modifier] Should only be able to pass a valid EMP STRATEGY address..", async () => {
					await expect(
						utility.utilizedERC20UpdateValid(ethers.constants.AddressZero, [], [])
					).to.be.rejectedWith(
						ERROR.STRATEGY_UTILITY.ADDRESS_NOT_STRATEGY
					);
				});
			});
		});
	});
});
