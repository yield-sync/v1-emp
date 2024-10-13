const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory, VoidSigner } from "ethers";
import { ERROR } from "../const";


describe("[3.0] V1EMPUtility.sol", async () => {
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
		const V1EMPUtility: ContractFactory= await ethers.getContractFactory("V1EMPUtility");


		governance = await (await YieldSyncGovernance.deploy()).deployed();

		await governance.payToUpdate(treasury.address);

		arrayUtility = await (await V1EMPArrayUtility.deploy()).deployed();

		registry = await (await V1EMPRegistry.deploy(governance.address)).deployed();

		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

		utility = await (await V1EMPUtility.deploy(registry.address)).deployed();

		// Set the Strategy Deployer
		await registry.v1EMPStrategyDeployerUpdate(utility.address);
	});


	describe("view", async () => {
		describe("function utilizedERC20AmountValid()", async () => {
			it("[modifier] Should only be able to pass a valid EMP address..", async () => {
				await expect(utility.utilizedERC20AmountValid(ethers.constants.AddressZero, [])).to.be.rejectedWith(
					ERROR.EMP.ADDRESS_NOT_EMP
				);
			});
		});

		describe("function utilizedERC20AvailableAndTransferAmount()", async () => {
			it("[modifier] Should only be able to pass a valid EMP address..", async () => {
				await expect(
					utility.utilizedERC20AvailableAndTransferAmount(ethers.constants.AddressZero, 0)
				).to.be.rejectedWith(
					ERROR.EMP.ADDRESS_NOT_EMP
				);
			});
		});

		describe("function utilizedERC20TotalBalance()", async () => {
			it("[modifier] Should only be able to pass a valid EMP address..", async () => {
				await expect(utility.utilizedERC20TotalBalance(ethers.constants.AddressZero)).to.be.rejectedWith(
					ERROR.EMP.ADDRESS_NOT_EMP
				);
			});
		});

		describe("function utilizedV1EMPStrategyValid()", async () => {
			it("[modifier] Should only be able to pass a valid EMP address..", async () => {
				await expect(utility.utilizedV1EMPStrategyValid(ethers.constants.AddressZero, [], [])).to.be.rejectedWith(
					ERROR.EMP.ADDRESS_NOT_EMP
				);
			});
		});

		describe("function v1EMPStrategyUtilizedERC20AmountValid()", async () => {
			it("[modifier] Should only be able to pass a valid EMP address..", async () => {
				await expect(
					utility.v1EMPStrategyUtilizedERC20AmountValid(ethers.constants.AddressZero, [])
				).to.be.rejectedWith(
					ERROR.EMP.ADDRESS_NOT_EMP
				);
			});
		});
	});

	describe("mutatitive", async () => {
		describe("function utilizedERC20Update()", async () => {
			it("[modifier][auth] Should only be able to called by EMP..", async () => {
				await expect(utility.utilizedERC20Update()).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
			});
		});

		describe("function v1EMPStrategyUtilizedERC20AmountValid()", async () => {
			it("[modifier] Should only be able to pass a valid EMP address..", async () => {
				await expect(
					utility.v1EMPStrategyUtilizedERC20AmountValid(ethers.constants.AddressZero, [])
				).to.be.rejectedWith(
					ERROR.EMP.ADDRESS_NOT_EMP
				);
			});
		});
	});
});
