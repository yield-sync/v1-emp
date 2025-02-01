import { expect } from "chai";
import { BigNumber, Contract, VoidSigner } from "ethers";

import stageContracts from "./stage-contracts-7";
import { approveTokens } from "../../util/UtilEMP";
import { D_18, ERROR, PERCENT } from "../../const";


const { ethers } = require("hardhat");


describe("[7.2] V1EMP.sol - Withdrawing Tokens", async () => {
	let eTHValueEMPDepositAmount: BigNumber = ethers.utils.parseUnits("1", 18);

	let BeforeBalanceEMPOwner: BigNumber;

	let BeforeBalanceMockAOwner: BigNumber;
	let BeforeBalanceMockBOwner: BigNumber;
	let BeforeBalanceMockCOwner: BigNumber;
	let BeforeBalanceMockAEMP: BigNumber;
	let BeforeBalanceMockBEMP: BigNumber;
	let BeforeBalanceMockCEMP: BigNumber;

	let eMPUtility: Contract;
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;

	let owner: VoidSigner;
	let badActor: VoidSigner;

	let eMPs: TestEMP[] = [];
	let strategies: TestStrategy[] = [];

	let eMPDepositAmounts: UtilizedERC20Amount;
	let depositAmount: UtilizedERC20Amount = [];


	beforeEach("[beforeEach] Set up contracts..", async () => {
		(
			{
				eMPs,
				eMPUtility,
				mockERC20A,
				mockERC20B,
				mockERC20C,
				owner,
				badActor,
				strategies,
			} = await stageContracts()
		);

		BeforeBalanceEMPOwner = await eMPs[0].contract.balanceOf(owner.address);

		BeforeBalanceMockAOwner = await mockERC20A.balanceOf(owner.address);
		BeforeBalanceMockBOwner = await mockERC20B.balanceOf(owner.address);
		BeforeBalanceMockCOwner = await mockERC20C.balanceOf(owner.address);

		BeforeBalanceMockAEMP = await mockERC20A.balanceOf(eMPs[0].contract.address);
		BeforeBalanceMockBEMP = await mockERC20B.balanceOf(eMPs[0].contract.address);
		BeforeBalanceMockCEMP = await mockERC20C.balanceOf(eMPs[0].contract.address);


		eMPDepositAmounts = await eMPs[0].UtilEMPTransfer.calculatedUtilizedERC20Amount(eTHValueEMPDepositAmount);

		// Approve tokens
		await approveTokens(
			eMPs[0].contract.address,
			await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address),
			eMPDepositAmounts
		);

		// Deposit the utilized ERC20 tokens into EMP
		await eMPs[0].contract.utilizedERC20Deposit(eMPDepositAmounts);

		depositAmount[0] = await strategies[0].UtilStrategyTransfer.calculateERC20Required(
			eTHValueEMPDepositAmount.mul(PERCENT.FIFTY).div(D_18)
		);

		depositAmount[1] = await strategies[1].UtilStrategyTransfer.calculateERC20Required(
			eTHValueEMPDepositAmount.mul(PERCENT.FIFTY).div(D_18)
		);

		await eMPs[0].contract.utilizedV1EMPStrategyDeposit([depositAmount[0], depositAmount[1]]);

		// Expect that the owner address received something
		expect(await eMPs[0].contract.balanceOf(owner.address)).to.be.greaterThan(0);
	});


	// TODO make tests for withdrawing from the EMP without every investing into the strategies
	describe("function utilizedV1EMPStrategyWithdraw()", async () => {
		describe("Modifier", async () => {
			it("[auth] Should revert if an unauthorized sender calls..", async () => {
				await expect(eMPs[0].contract.connect(badActor).utilizedV1EMPStrategyWithdraw([])).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});
		});

		describe("Expected Failure", async () => {
			it("Should revert invalid lengthed _v1EMPStrategyERC20Amount param passed..", async () => {
				await expect(eMPs[0].contract.utilizedV1EMPStrategyWithdraw([])).to.be.rejectedWith(
					ERROR.EMP.INVALID_STRATEGY_ERC20_AMOUNTS_LENGTH
				);
			});
		});

		describe("Expected Success", async () => {
			it("Should be able to withdraw ERC20 tokens from Strategy to EMP..", async () => {
				expect(await mockERC20A.balanceOf(eMPs[0].contract.address)).to.be.equal(ethers.utils.parseUnits('0', 18));

				expect(await mockERC20B.balanceOf(eMPs[0].contract.address)).to.be.equal(ethers.utils.parseUnits('0', 18));

				expect(await mockERC20C.balanceOf(eMPs[0].contract.address)).to.be.equal(ethers.utils.parseUnits('0', 18));

				await expect(
					eMPs[0].contract.utilizedV1EMPStrategyWithdraw([
						await strategies[0].contract.eMP_shares(eMPs[0].contract.address),
						await strategies[1].contract.eMP_shares(eMPs[0].contract.address),
					])
				).to.not.be.reverted;

				expect(await mockERC20A.balanceOf(eMPs[0].contract.address)).to.be.greaterThan(ethers.utils.parseUnits('0', 18));

				expect(await mockERC20B.balanceOf(eMPs[0].contract.address)).to.be.greaterThan(ethers.utils.parseUnits('0', 18));

				expect(await mockERC20C.balanceOf(eMPs[0].contract.address)).to.be.greaterThan(ethers.utils.parseUnits('0', 18));
			});
		});

		describe("[indirect-call] function utilizedERC20Updated() - Utilized ERC20 tokens changed..", async () => {
			let eMPUtilizedERC20: string[];


			beforeEach(async () => {
				eMPUtilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);

				expect(eMPUtilizedERC20.length).to.be.equal(3);

				await strategies[0].contract.utilizedERC20DepositOpenUpdate(false);

				await strategies[0].contract.utilizedERC20WithdrawOpenUpdate(false);

				await strategies[0].contract.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await strategies[0].contract.utilizedERC20WithdrawOpenUpdate(true);
			});


			it("Should update EMP's utilizedERC20 array to be a union of the strategy's utilizedERC20s..", async () => {
				await eMPs[0].contract.utilizedV1EMPStrategyWithdraw([
					await strategies[0].contract.eMP_shares(eMPs[0].contract.address),
					await strategies[1].contract.eMP_shares(eMPs[0].contract.address),
				]);

				eMPUtilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);

				expect(eMPUtilizedERC20.length).to.be.equal(2);
			});
		});
	});

	describe("function utilizedERC20Withdraw() (1/3) - utilizedV1EMPStrategyWithdraw() NOT called before", async () => {
		describe("Expected Failure", async () => {
			it("Should fail to withdraw tokens from Strategy if not enough tokens available on EMP..", async () => {
				const OWNER_EMP_BALANCE = await eMPs[0].contract.balanceOf(owner.address);

				await expect(eMPs[0].contract.utilizedERC20Withdraw(OWNER_EMP_BALANCE)).to.be.revertedWith(
					ERROR.EMP.UTILIZED_ERC20_NOT_AVAILABLE
				);
			});
		});
	});

	describe("function utilizedERC20Withdraw() (2/3) - Full Withdrawals Disabled", async () => {
		beforeEach(async () => {
			await eMPs[0].contract.utilizedV1EMPStrategyWithdraw([
				await strategies[0].contract.eMP_shares(eMPs[0].contract.address),
				await strategies[1].contract.eMP_shares(eMPs[0].contract.address),
			])

			expect(await eMPs[0].contract.utilizedERC20WithdrawFull()).to.be.false;
		});


		describe("Expected Failure", async () => {
			it("Should NOT allow withdrawing if not open..", async () => {
				/**
				* @notice This test is to check that depositing must be on in order to call the function properly.
				*/

				await eMPs[0].contract.utilizedERC20WithdrawOpenUpdate(false);

				expect(await eMPs[0].contract.utilizedERC20WithdrawOpen()).to.be.false;

				// Even if utilizedERC20Amounts, the function should revert with reason that deposits are NOT open
				await expect(eMPs[0].contract.utilizedERC20Withdraw(0)).to.be.rejectedWith(
					ERROR.EMP.WITHDRAW_NOT_OPEN
				);
			});

			it("Should not allow msg.sender to withdraw with insufficient EMP balance..", async () => {
				/**
				* @notice This test should test that msg.sender cannot withdraw more than what they have.
				*/

				const INVALID_BALANCE = (await eMPs[0].contract.balanceOf(owner.address)).add(1);

				await expect(eMPs[0].contract.utilizedERC20Withdraw(INVALID_BALANCE)).to.be.rejectedWith(
					ERROR.EMP.INVALID_BALANCE
				);
			});
		});

		describe("Expected Success", async () => {
			it("Should allow withdrawing tokens from Strategy..", async () => {
				/**
				* @notice This test should test that msg.sender cannot withdraw more than what they have.
				*/

				const OWNER_EMP_BALANCE = await eMPs[0].contract.balanceOf(owner.address);

				await eMPs[0].contract.utilizedERC20Withdraw(OWNER_EMP_BALANCE);

				expect(await eMPs[0].contract.balanceOf(owner.address)).to.be.equal(0);

				expect(await strategies[0].contract.eMP_shares(eMPs[0].contract.address)).to.be.equal(0);

				expect(await strategies[1].contract.eMP_shares(eMPs[0].contract.address)).to.be.equal(0);
			});
		});


		describe("[indirect-call] function utilizedERC20Updated() - Utilized ERC20 tokens changed..", async () => {
			let eMPUtilizedERC20: string[];


			beforeEach(async () => {
				eMPUtilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);

				expect(eMPUtilizedERC20.length).to.be.equal(3);

				await strategies[0].contract.utilizedERC20DepositOpenUpdate(false);

				await strategies[0].contract.utilizedERC20WithdrawOpenUpdate(false);

				await strategies[0].contract.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await strategies[0].contract.utilizedERC20WithdrawOpenUpdate(true);
			});


			it("Should update EMP's utilizedERC20 array to be a union of the strategy's utilizedERC20s..", async () => {
				const VALID_BALANCE = await eMPs[0].contract.balanceOf(owner.address);

				await eMPs[0].contract.utilizedERC20Withdraw(VALID_BALANCE);

				eMPUtilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);

				expect(eMPUtilizedERC20.length).to.be.equal(2);
			});
		});
	});

	describe("function utilizedERC20WithdrawFullUpdate()", async () => {
		describe("Expected Failure", async () => {
			it("[modifier][auth] Should revert if an unauthorized sender calls..", async () => {
				await expect(eMPs[0].contract.connect(badActor).utilizedERC20WithdrawFullUpdate(true)).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});
		});

		describe("Expected Success", async () => {
			it("Should set utilizedERC20WithdrawOpen to true..", async () => {

				expect(await eMPs[0].contract.utilizedERC20WithdrawFull()).to.be.false;

				await expect(eMPs[0].contract.utilizedERC20WithdrawFullUpdate(true)).to.be.not.rejected;

				expect(await eMPs[0].contract.utilizedERC20WithdrawFull()).to.be.true;
			});
		});
	});

	describe("function utilizedERC20Withdraw() (3/3) - Full Withdrawals Enabled", async () => {
		describe("Expected Success", async () => {
			beforeEach(async () => {
				expect(await eMPs[0].contract.utilizedERC20WithdrawFull()).to.be.false;

				await eMPs[0].contract.utilizedERC20WithdrawFullUpdate(true);

				expect(await eMPs[0].contract.utilizedERC20WithdrawFull()).to.be.true;
			});


			it("Should allow withdrawing tokens from EMP even if not prewithdrawn from stratgies..", async () => {
				const OWNER_EMP_BALANCE = await eMPs[0].contract.balanceOf(owner.address);

				await eMPs[0].contract.utilizedERC20Withdraw(OWNER_EMP_BALANCE);

				const EMP_MOCK_A_BALANCE = await mockERC20A.balanceOf(eMPs[0].contract.address);
				const OWNER_EMP_BALANCE_AFTER = await eMPs[0].contract.balanceOf(owner.address);
				const OWNER_MOCK_A_BALANCE = await mockERC20A.balanceOf(owner.address);

				const EMP_SHARE_STRATEGY_0_BALANCE = await strategies[0].contract.eMP_shares(eMPs[0].contract.address);
				const EMP_SHARE_STRATEGY_1_BALANCE = await strategies[0].contract.eMP_shares(eMPs[0].contract.address);

				expect(EMP_MOCK_A_BALANCE).to.be.equal(BeforeBalanceMockAEMP);
				expect(OWNER_EMP_BALANCE_AFTER).to.be.equal(BeforeBalanceEMPOwner);
				expect(OWNER_MOCK_A_BALANCE).to.be.equal(BeforeBalanceMockAOwner);

				expect(EMP_SHARE_STRATEGY_0_BALANCE).to.be.equal(0);
				expect(EMP_SHARE_STRATEGY_1_BALANCE).to.be.equal(0);
			});

			describe("[situation] Partial ERC20 amount available on EMP", async () => {
				it("Should allow withdrawing tokens from EMP..", async () => {
					const s1Balance = await strategies[0].contract.eMP_shares(eMPs[0].contract.address);
					const s2Balance = await strategies[1].contract.eMP_shares(eMPs[0].contract.address);

					// Withdraw only partial balanceOf EMP
					await eMPs[0].contract.utilizedV1EMPStrategyWithdraw([s1Balance.div(10), s2Balance.div(10)]);

					const VALID_BALANCE = await eMPs[0].contract.balanceOf(owner.address);

					await eMPs[0].contract.utilizedERC20Withdraw(VALID_BALANCE);


					const OWNER_EMP_BALANCE_AFTER = await eMPs[0].contract.balanceOf(owner.address);

					expect(OWNER_EMP_BALANCE_AFTER).to.be.equal(BeforeBalanceEMPOwner);


					const EMP_MOCK_A_BALANCE = await mockERC20A.balanceOf(eMPs[0].contract.address);
					const EMP_MOCK_B_BALANCE = await mockERC20B.balanceOf(eMPs[0].contract.address);
					const EMP_MOCK_C_BALANCE = await mockERC20C.balanceOf(eMPs[0].contract.address);

					expect(EMP_MOCK_A_BALANCE).to.be.equal(BeforeBalanceMockAEMP);
					expect(EMP_MOCK_B_BALANCE).to.be.equal(BeforeBalanceMockBEMP);
					expect(EMP_MOCK_C_BALANCE).to.be.equal(BeforeBalanceMockCEMP);


					const OWNER_MOCK_A_BALANCE = await mockERC20A.balanceOf(owner.address);
					const OWNER_MOCK_B_BALANCE = await mockERC20B.balanceOf(owner.address);
					const OWNER_MOCK_C_BALANCE = await mockERC20C.balanceOf(owner.address);

					expect(OWNER_MOCK_A_BALANCE).to.be.equal(BeforeBalanceMockAOwner);
					expect(OWNER_MOCK_B_BALANCE).to.be.equal(BeforeBalanceMockBOwner);
					expect(OWNER_MOCK_C_BALANCE).to.be.equal(BeforeBalanceMockCOwner);


					const EMP_SHARE_STRATEGY_0_BALANCE = await strategies[0].contract.eMP_shares(eMPs[0].contract.address);
					const EMP_SHARE_STRATEGY_1_BALANCE = await strategies[0].contract.eMP_shares(eMPs[0].contract.address);

					expect(EMP_SHARE_STRATEGY_0_BALANCE).to.be.equal(0);
					expect(EMP_SHARE_STRATEGY_1_BALANCE).to.be.equal(0);
				});

				it("Should allow withdrawing tokens from EMP with tolerance applied..", async () => {
					const s1Balance = await strategies[0].contract.eMP_shares(eMPs[0].contract.address);
					const s2Balance = await strategies[1].contract.eMP_shares(eMPs[0].contract.address);

					// Withdraw only partial balanceOf EMP
					await eMPs[0].contract.utilizedV1EMPStrategyWithdraw([s1Balance.div(23), s2Balance.div(35)]);

					const VALID_BALANCE = await eMPs[0].contract.balanceOf(owner.address);

					await eMPs[0].contract.utilizedERC20Withdraw(VALID_BALANCE);

					const OWNER_EMP_BALANCE_AFTER = await eMPs[0].contract.balanceOf(owner.address);

					expect(OWNER_EMP_BALANCE_AFTER).to.be.equal(BeforeBalanceEMPOwner);


					const EMP_MOCK_A_BALANCE = await mockERC20A.balanceOf(eMPs[0].contract.address);
					const EMP_MOCK_B_BALANCE = await mockERC20B.balanceOf(eMPs[0].contract.address);
					const EMP_MOCK_C_BALANCE = await mockERC20C.balanceOf(eMPs[0].contract.address);

					expect(EMP_MOCK_A_BALANCE).to.be.equal(BeforeBalanceMockAEMP);
					expect(EMP_MOCK_B_BALANCE).to.be.equal(BeforeBalanceMockBEMP);
					expect(EMP_MOCK_C_BALANCE).to.be.equal(BeforeBalanceMockCEMP.add(await eMPUtility.TOLERANCE()).sub(1));


					const OWNER_MOCK_A_BALANCE = await mockERC20A.balanceOf(owner.address);
					const OWNER_MOCK_B_BALANCE = await mockERC20B.balanceOf(owner.address);
					const OWNER_MOCK_C_BALANCE = await mockERC20C.balanceOf(owner.address);

					expect(OWNER_MOCK_A_BALANCE).to.be.equal(BeforeBalanceMockAOwner);
					expect(OWNER_MOCK_B_BALANCE).to.be.equal(BeforeBalanceMockBOwner);
					expect(OWNER_MOCK_C_BALANCE).to.be.equal(BeforeBalanceMockCOwner.sub(await eMPUtility.TOLERANCE()));


					const EMP_SHARE_STRATEGY_0_BALANCE = await strategies[0].contract.eMP_shares(eMPs[0].contract.address);
					const EMP_SHARE_STRATEGY_1_BALANCE = await strategies[0].contract.eMP_shares(eMPs[0].contract.address);

					expect(EMP_SHARE_STRATEGY_0_BALANCE).to.be.equal(0);
					expect(EMP_SHARE_STRATEGY_1_BALANCE).to.be.equal(0);
				});
			});
		});
	});
});
