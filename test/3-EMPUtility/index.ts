import { expect } from "chai";
import { Contract, VoidSigner } from "ethers";

import stageContracts, { stageSpecificSetup } from "./stage-contracts-3";
import { ERROR } from "../../const";


const { ethers } = require("hardhat");


describe("[3.0] V1EMPUtility.sol", async () => {
	let eRC20A: Contract;
	let registry: Contract;
	let eMPUtility: Contract;

	let fakeEMP: VoidSigner;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		({ registry, eMPUtility, eRC20A } = await stageContracts());

		({ fakeEMP } = await stageSpecificSetup(registry));
	});


	describe("view", async () => {
		describe("function optimizedTransferAmount()", async () => {
			it("[modifier] Should only be able to pass a valid EMP address..", async () => {
				await expect(
					eMPUtility.optimizedTransferAmount(ethers.constants.AddressZero, ethers.constants.AddressZero, 0)
				).to.be.rejectedWith(
					ERROR.EMP.ADDRESS_NOT_EMP
				);
			});

			it("Should return TOLERATED transferAmount if EMP balance less than transferAmount..", async () => {
				const AMOUNT = 100;

				const toleratedAmount = await eMPUtility.optimizedTransferAmount(
					fakeEMP.address,
					eRC20A.address,
					AMOUNT
				);

				expect(toleratedAmount).to.be.equal(AMOUNT - await eMPUtility.TOLERANCE());
			});
		});

		describe("function utilizedERC20AmountValid()", async () => {
			it("[modifier] Should only be able to pass a valid EMP address..", async () => {
				await expect(eMPUtility.utilizedERC20AmountValid(ethers.constants.AddressZero, [])).to.be.rejectedWith(
					ERROR.EMP.ADDRESS_NOT_EMP
				);
			});

			it("Should not allow passing _utilizedERC20Amount with invalid length..", async () => {
				await expect(eMPUtility.utilizedERC20AmountValid(fakeEMP.address, [1])).to.be.rejectedWith(
					ERROR.EMP_UTILITY.INVALID_UTILIZED_ERC20_LENGTH
				);
			});
		});

		describe("function utilizedV1EMPStrategyValid()", async () => {
			it("[modifier] Should only be able to pass a valid EMP address..", async () => {
				await expect(
					eMPUtility.utilizedV1EMPStrategyValid(ethers.constants.AddressZero, [], [])
				).to.be.rejectedWith(
					ERROR.EMP.ADDRESS_NOT_EMP
				);
			});

			it("Should not allow passing _v1EMPStrategy with invalid length..", async () => {
				const payload = await eMPUtility.utilizedV1EMPStrategyValid(
					fakeEMP.address,
					[ethers.constants.AddressZero],
					[]
				);

				expect(payload.valid_).to.be.false;

				expect(payload.message_).to.be.equal(ERROR.EMP_UTILITY.INVALID_STRATEGY_LENTH);
			});

			it("Should catch invalid _v1EMPStrategy..", async () => {
				const payload = await eMPUtility.utilizedV1EMPStrategyValid(
					fakeEMP.address,
					[ethers.constants.AddressZero],
					[0]
				);

				expect(payload.valid_).to.be.false;

				expect(payload.message_).to.be.equal(ERROR.EMP_UTILITY.INVALID_V1_EMP_STRATEGY);
			});
		});

		describe("function v1EMPStrategyUtilizedERC20AmountValid()", async () => {
			it("[modifier] Should only be able to pass a valid EMP address..", async () => {
				await expect(
					eMPUtility.v1EMPStrategyUtilizedERC20AmountValid(ethers.constants.AddressZero, [])
				).to.be.rejectedWith(
					ERROR.EMP.ADDRESS_NOT_EMP
				);
			});
		});
	});

	describe("mutative", async () => {
		describe("function utilizedV1EMPStrategySync()", async () => {
			it("[modifier][auth] Should only be able to called by EMP..", async () => {
				await expect(eMPUtility.utilizedV1EMPStrategySync()).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
			});
		});
	});
});
