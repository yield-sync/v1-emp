import { expect } from "chai";
import { Contract, VoidSigner } from "ethers";

import { ERROR } from "../../const";
import { deployContract } from "../../util/UtilEMP";


const { ethers } = require("hardhat");


describe("[3.0] V1EMPUtility.sol", async () => {
	let addressArrayUtility: Contract;
	let fakeEMP: Contract;
	let governance: Contract;
	let mockERC20A: Contract;
	let owner: Contract;
	let registry: Contract;
	let utility: Contract;

	let fakeEMPUtility: VoidSigner;
	let fakeEMPDeployer: VoidSigner;
	let treasury: VoidSigner;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		[owner, , treasury, fakeEMPDeployer, fakeEMPDeployer, fakeEMPUtility, fakeEMP] = await ethers.getSigners();

		governance = await deployContract("YieldSyncGovernance");
		addressArrayUtility = await deployContract("AddressArrayUtility");
		registry = await deployContract("V1EMPRegistry", [governance.address]);
		utility = await deployContract("V1EMPUtility", [registry.address]);

		await governance.payToUpdate(treasury.address);
		await registry.addressArrayUtilityUpdate(addressArrayUtility.address);
		await registry.v1EMPStrategyDeployerUpdate(utility.address);

		await registry.v1EMPUtilityUpdate(fakeEMPUtility.address);
		await registry.v1EMPDeployerUpdate(fakeEMPDeployer.address);
		await registry.connect(fakeEMPDeployer).v1EMPRegister(fakeEMP.address);

		mockERC20A = await deployContract("MockERC20", ["Mock A", "A", 18]);
	});


	describe("view", async () => {
		describe("function optimizedTransferAmount()", async () => {
			it("[modifier] Should only be able to pass a valid EMP address..", async () => {
				await expect(
					utility.optimizedTransferAmount(ethers.constants.AddressZero, ethers.constants.AddressZero, 0)
				).to.be.rejectedWith(
					ERROR.EMP.ADDRESS_NOT_EMP
				);
			});

			it("Should return TOLERATED transferAmount if EMP balance less than transferAmount..", async () => {
				const AMOUNT = 100;

				const toleratedAmount = await utility.optimizedTransferAmount(
					fakeEMP.address,
					mockERC20A.address,
					AMOUNT
				);

				expect(toleratedAmount).to.be.equal(AMOUNT - await utility.TOLERANCE());
			});
		});

		describe("function utilizedERC20AmountValid()", async () => {
			it("[modifier] Should only be able to pass a valid EMP address..", async () => {
				await expect(utility.utilizedERC20AmountValid(ethers.constants.AddressZero, [])).to.be.rejectedWith(
					ERROR.EMP.ADDRESS_NOT_EMP
				);
			});

			it("Should not allow passing _utilizedERC20Amount with invalid length..", async () => {
				await expect(
					utility.utilizedERC20AmountValid(fakeEMP.address, [1])
				).to.be.rejectedWith(
					ERROR.EMP_UTILITY.INVALID_UTILIZED_ERC20_LENGTH
				);
			});
		});

		describe("function utilizedV1EMPStrategyValid()", async () => {
			it("[modifier] Should only be able to pass a valid EMP address..", async () => {
				await expect(
					utility.utilizedV1EMPStrategyValid(ethers.constants.AddressZero, [], [])
				).to.be.rejectedWith(
					ERROR.EMP.ADDRESS_NOT_EMP
				);
			});

			it("Should not allow passing _v1EMPStrategy with invalid length..", async () => {
				const payload = await utility.utilizedV1EMPStrategyValid(
					fakeEMP.address,
					[ethers.constants.AddressZero],
					[]
				);

				expect(payload.valid_).to.be.false;

				expect(payload.message_).to.be.equal(ERROR.EMP_UTILITY.INVALID_STRATEGY_LENTH);
			});

			it("Should catch invalid _v1EMPStrategy..", async () => {
				const payload = await utility.utilizedV1EMPStrategyValid(
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
					utility.v1EMPStrategyUtilizedERC20AmountValid(ethers.constants.AddressZero, [])
				).to.be.rejectedWith(
					ERROR.EMP.ADDRESS_NOT_EMP
				);
			});
		});
	});

	describe("mutative", async () => {
		describe("function utilizedV1EMPStrategySync()", async () => {
			it("[modifier][auth] Should only be able to called by EMP..", async () => {
				await expect(utility.utilizedV1EMPStrategySync()).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
			});
		});
	});
});
