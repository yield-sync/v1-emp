import { expect } from "chai";
import { Contract } from "ethers";

import stageContracts from "./stage-contracts-2";
import { ERROR } from "../../const";


const { ethers } = require("hardhat");


describe("[2.0] V1EMPStrategyUtility.sol", async () => {
	let strategyUtility: Contract;


	beforeEach("[beforeEach] Set up contracts..", async () => { ({ strategyUtility } = await stageContracts()); });


	describe("view", async () => {
		describe("function depositAmountsValid()", async () => {
			describe("Expected Failure", async () => {
				it("[modifier] Should only be able to pass a valid _v1EMPStrategy address..", async () => {
					await expect(strategyUtility.depositAmountsValid(ethers.constants.AddressZero, [])).to.be.rejectedWith(
						ERROR.STRATEGY_UTILITY.ADDRESS_NOT_STRATEGY
					);
				});
			});
		});

		describe("function utilizedERC20AmountETHValue()", async () => {
			describe("Expected Failure", async () => {
				it("[modifier] Should only be able to pass a valid _v1EMPStrategy address..", async () => {
					await expect(
						strategyUtility.utilizedERC20AmountETHValue(ethers.constants.AddressZero, [])
					).to.be.rejectedWith(
						ERROR.STRATEGY_UTILITY.ADDRESS_NOT_STRATEGY
					);
				});
			});
		});
	});

	describe("mutative", async () => {
		describe("function utilizedERC20UpdateValid()", async () => {
			describe("Expected Failure", async () => {
				it("[modifier] Should only be able to pass a valid _v1EMPStrategy address..", async () => {
					await expect(
						strategyUtility.utilizedERC20UpdateValid(ethers.constants.AddressZero, [], [])
					).to.be.rejectedWith(
						ERROR.STRATEGY_UTILITY.ADDRESS_NOT_STRATEGY
					);
				});
			});
		});
	});
});
