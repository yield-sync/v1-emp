const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, VoidSigner } from "ethers";
import { ERROR } from "../const";
import { deployContract } from "../util/UtilEMP";


describe("[3.0] V1EMPUtility.sol", async () => {
	let addressArrayUtility: Contract;
	let governance: Contract;
	let registry: Contract;
	let utility: Contract;

	let treasury: VoidSigner;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		[, , treasury] = await ethers.getSigners();

		governance = await deployContract("YieldSyncGovernance");
		addressArrayUtility = await deployContract("AddressArrayUtility");
		registry = await deployContract("V1EMPRegistry", [governance.address]);
		utility = await deployContract("V1EMPUtility", [registry.address]);

		await governance.payToUpdate(treasury.address);
		await registry.addressArrayUtilityUpdate(addressArrayUtility.address);
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
		describe("function utilizedStrategySync()", async () => {
			it("[modifier][auth] Should only be able to called by EMP..", async () => {
				await expect(utility.utilizedStrategySync()).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
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
