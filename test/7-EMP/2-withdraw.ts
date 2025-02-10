import { expect } from "chai";
import { BigNumber, Contract, VoidSigner } from "ethers";

import stageContracts from "./stage-contracts-7";
import { approveTokens } from "../../util/UtilEMP";
import { D_18, ERROR, PERCENT } from "../../const";


const { ethers } = require("hardhat");


describe("[7.2] V1EMP.sol - Withdrawing Tokens", async () => {
	let eTHValueEMPDepositAmount: BigNumber = ethers.utils.parseUnits("1", 18);

	let BeforeBalanceEMPOwner: BigNumber;

	let BeforeBalanceAOwner: BigNumber;
	let BeforeBalanceBOwner: BigNumber;
	let BeforeBalanceCOwner: BigNumber;
	let BeforeBalanceAEMP: BigNumber;
	let BeforeBalanceBEMP: BigNumber;
	let BeforeBalanceCEMP: BigNumber;

	let eMP: Contract;
	let eMPUtility: Contract;
	let eRC20A: Contract;
	let eRC20B: Contract;
	let eRC20C: Contract;

	let owner: VoidSigner;
	let badActor: VoidSigner;

	let eMPs: TestEMP[] = [];
	let strategies: TestStrategy[] = [];

	let eMPDepositAmounts: UtilizedERC20Amount;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		(
			{
				eMPs,
				eMPUtility,
				eRC20A,
				eRC20B,
				eRC20C,
				owner,
				badActor,
				strategies,
			} = await stageContracts()
		);

		eMP = eMPs[0].contract;

		BeforeBalanceEMPOwner = await eMP.balanceOf(owner.address);
		BeforeBalanceAOwner = await eRC20A.balanceOf(owner.address);
		BeforeBalanceBOwner = await eRC20B.balanceOf(owner.address);
		BeforeBalanceCOwner = await eRC20C.balanceOf(owner.address);
		BeforeBalanceAEMP = await eRC20A.balanceOf(eMP.address);
		BeforeBalanceBEMP = await eRC20B.balanceOf(eMP.address);
		BeforeBalanceCEMP = await eRC20C.balanceOf(eMP.address);

		eMPDepositAmounts = await eMPs[0].UtilEMPTransfer.calculatedUtilizedERC20Amount(eTHValueEMPDepositAmount);

		// Approve tokens
		await approveTokens(
			eMP.address,
			await eMPUtility.v1EMP_utilizedERC20(eMP.address),
			eMPDepositAmounts
		);

		// Deposit the utilized ERC20 tokens into EMP
		await eMP.utilizedERC20Deposit(eMPDepositAmounts);
	});


	describe("function utilizedERC20Withdraw() (1/4) - EMP has not injected ERC20 into Strategies..", async () => {
		describe("Expected Failure", async () => {
			it("Should not allow msg.sender to withdraw with insufficient EMP balance..", async () => {
				const INVALID_BALANCE = (await eMP.balanceOf(owner.address)).add(1);

				await expect(eMP.utilizedERC20Withdraw(INVALID_BALANCE)).to.be.rejectedWith(
					ERROR.EMP.INVALID_BALANCE
				);
			});
		});

		describe("Expected Success", async () => {
			it("Should allow withdrawing tokens from EMP..", async () => {
				const OWNER_EMP_BALANCE = await eMP.balanceOf(owner.address);

				await eMP.utilizedERC20Withdraw(OWNER_EMP_BALANCE);

				expect(await eMP.balanceOf(owner.address)).to.be.equal(0);

				expect(await eRC20A.balanceOf(eMP.address)).to.be.equal(0);

				expect(await eRC20B.balanceOf(eMP.address)).to.be.equal(0);

				expect(await eRC20C.balanceOf(eMP.address)).to.be.equal(0);
			});
		});
	});

	describe("EMP injected ERC20 into strategies..", async () => {
		beforeEach("[beforeEach] Set up contracts..", async () => {
			let depositAmount: UtilizedERC20Amount = [];

			depositAmount[0] = await strategies[0].UtilStrategyTransfer.calculateERC20Required(
				eTHValueEMPDepositAmount.mul(PERCENT.FIFTY).div(D_18)
			);

			depositAmount[1] = await strategies[1].UtilStrategyTransfer.calculateERC20Required(
				eTHValueEMPDepositAmount.mul(PERCENT.FIFTY).div(D_18)
			);

			await eMP.utilizedV1EMPStrategyDeposit([depositAmount[0], depositAmount[1]]);

			// Expect that the owner address received something
			expect(await eMP.balanceOf(owner.address)).to.be.greaterThan(0);
		});


		describe("function utilizedV1EMPStrategyWithdraw()", async () => {
			describe("Modifier", async () => {
				it("[auth] Should revert if an unauthorized sender calls..", async () => {
					await expect(eMP.connect(badActor).utilizedV1EMPStrategyWithdraw([])).to.be.rejectedWith(
						ERROR.NOT_AUTHORIZED
					);
				});
			});

			describe("Expected Failure", async () => {
				it("Should revert invalid lengthed _v1EMPStrategyERC20Amount param passed..", async () => {
					await expect(eMP.utilizedV1EMPStrategyWithdraw([])).to.be.rejectedWith(
						ERROR.EMP.INVALID_STRATEGY_ERC20_AMOUNTS_LENGTH
					);
				});
			});

			describe("Expected Success", async () => {
				it("Should be able to withdraw ERC20 tokens from Strategy to EMP..", async () => {
					expect(await eRC20A.balanceOf(eMP.address)).to.be.equal(ethers.utils.parseUnits('0', 18));
					expect(await eRC20B.balanceOf(eMP.address)).to.be.equal(ethers.utils.parseUnits('0', 18));
					expect(await eRC20C.balanceOf(eMP.address)).to.be.equal(ethers.utils.parseUnits('0', 18));

					await expect(
						eMP.utilizedV1EMPStrategyWithdraw([
							await strategies[0].contract.eMP_shares(eMP.address),
							await strategies[1].contract.eMP_shares(eMP.address),
						])
					).to.not.be.reverted;

					expect(await eRC20A.balanceOf(eMP.address)).to.be.greaterThan(ethers.utils.parseUnits('0', 18));
					expect(await eRC20B.balanceOf(eMP.address)).to.be.greaterThan(ethers.utils.parseUnits('0', 18));
					expect(await eRC20C.balanceOf(eMP.address)).to.be.greaterThan(ethers.utils.parseUnits('0', 18));
				});
			});

			describe("[indirect-call] function utilizedERC20Updated() - Utilized ERC20 tokens changed..", async () => {
				let eMPUtilizedERC20: string[];


				beforeEach(async () => {
					eMPUtilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMP.address);

					expect(eMPUtilizedERC20.length).to.be.equal(3);

					await strategies[0].contract.utilizedERC20DepositOpenUpdate(false);
					await strategies[0].contract.utilizedERC20WithdrawOpenUpdate(false);

					await strategies[0].contract.utilizedERC20Update([eRC20A.address], [[true, true, PERCENT.HUNDRED]]);

					await strategies[0].contract.utilizedERC20WithdrawOpenUpdate(true);
				});


				it("Should update EMP's utilizedERC20 array to be a union of the strategy's utilizedERC20s..", async () => {
					await eMP.utilizedV1EMPStrategyWithdraw([
						await strategies[0].contract.eMP_shares(eMP.address),
						await strategies[1].contract.eMP_shares(eMP.address),
					]);

					eMPUtilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMP.address);

					expect(eMPUtilizedERC20.length).to.be.equal(2);
				});
			});
		});

		describe("function utilizedERC20Withdraw() (2/4) - utilizedV1EMPStrategyWithdraw() NOT called before", async () => {
			describe("Expected Failure", async () => {
				it("Should fail to withdraw tokens from Strategy if not enough tokens available on EMP..", async () => {
					const OWNER_EMP_BALANCE = await eMP.balanceOf(owner.address);

					await expect(eMP.utilizedERC20Withdraw(OWNER_EMP_BALANCE)).to.be.revertedWith(
						ERROR.EMP.UTILIZED_ERC20_NOT_AVAILABLE
					);
				});
			});
		});

		describe("function utilizedERC20Withdraw() (3/4) - Full Withdrawals Disabled", async () => {
			beforeEach(async () => {
				await eMP.utilizedV1EMPStrategyWithdraw([
					await strategies[0].contract.eMP_shares(eMP.address),
					await strategies[1].contract.eMP_shares(eMP.address),
				])

				expect(await eMP.utilizedERC20WithdrawFull()).to.be.false;
			});


			describe("Expected Failure", async () => {
				it("Should NOT allow withdrawing if not open..", async () => {
					/**
					* @notice This test is to check that depositing must be on in order to call the function properly.
					*/

					await eMP.utilizedERC20WithdrawOpenUpdate(false);

					expect(await eMP.utilizedERC20WithdrawOpen()).to.be.false;

					// Even if utilizedERC20Amounts, the function should revert with reason that deposits are NOT open
					await expect(eMP.utilizedERC20Withdraw(0)).to.be.rejectedWith(
						ERROR.EMP.WITHDRAW_NOT_OPEN
					);
				});
			});

			describe("Expected Success", async () => {
				it("Should allow withdrawing tokens from EMP..", async () => {
					/**
					* @notice This test should test that msg.sender cannot withdraw more than what they have.
					*/

					const OWNER_EMP_BALANCE = await eMP.balanceOf(owner.address);

					await eMP.utilizedERC20Withdraw(OWNER_EMP_BALANCE);

					expect(await eMP.balanceOf(owner.address)).to.be.equal(0);

					expect(await strategies[0].contract.eMP_shares(eMP.address)).to.be.equal(0);

					expect(await strategies[1].contract.eMP_shares(eMP.address)).to.be.equal(0);
				});
			});


			describe("[indirect-call] function utilizedERC20Updated() - Utilized ERC20 tokens changed..", async () => {
				let eMPUtilizedERC20: string[];


				beforeEach(async () => {
					eMPUtilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMP.address);

					expect(eMPUtilizedERC20.length).to.be.equal(3);

					await strategies[0].contract.utilizedERC20DepositOpenUpdate(false);

					await strategies[0].contract.utilizedERC20WithdrawOpenUpdate(false);

					await strategies[0].contract.utilizedERC20Update([eRC20A.address], [[true, true, PERCENT.HUNDRED]]);

					await strategies[0].contract.utilizedERC20WithdrawOpenUpdate(true);
				});


				it("Should update EMP's utilizedERC20 array to be a union of the strategy's utilizedERC20s..", async () => {
					const VALID_BALANCE = await eMP.balanceOf(owner.address);

					await eMP.utilizedERC20Withdraw(VALID_BALANCE);

					eMPUtilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMP.address);

					expect(eMPUtilizedERC20.length).to.be.equal(2);
				});
			});
		});

		describe("function utilizedERC20WithdrawFullUpdate()", async () => {
			describe("Expected Failure", async () => {
				it("[modifier][auth] Should revert if an unauthorized sender calls..", async () => {
					await expect(eMP.connect(badActor).utilizedERC20WithdrawFullUpdate(true)).to.be.rejectedWith(
						ERROR.NOT_AUTHORIZED
					);
				});
			});

			describe("Expected Success", async () => {
				it("Should set utilizedERC20WithdrawOpen to true..", async () => {

					expect(await eMP.utilizedERC20WithdrawFull()).to.be.false;

					await expect(eMP.utilizedERC20WithdrawFullUpdate(true)).to.be.not.rejected;

					expect(await eMP.utilizedERC20WithdrawFull()).to.be.true;
				});
			});
		});

		describe("function utilizedERC20Withdraw() (4/4) - Full Withdrawals Enabled", async () => {
			describe("Expected Success", async () => {
				beforeEach(async () => {
					expect(await eMP.utilizedERC20WithdrawFull()).to.be.false;

					await eMP.utilizedERC20WithdrawFullUpdate(true);

					expect(await eMP.utilizedERC20WithdrawFull()).to.be.true;
				});


				it("Should allow withdrawing tokens from EMP even if not prewithdrawn from stratgies..", async () => {
					const OWNER_EMP_BALANCE = await eMP.balanceOf(owner.address);

					await eMP.utilizedERC20Withdraw(OWNER_EMP_BALANCE);

					const EMP_BALANCE_A = await eRC20A.balanceOf(eMP.address);
					const OWNER_EMP_BALANCE_AFTER = await eMP.balanceOf(owner.address);
					const OWNER_BALANCE_A = await eRC20A.balanceOf(owner.address);

					const EMP_SHARE_STRATEGY_0_BALANCE = await strategies[0].contract.eMP_shares(eMP.address);
					const EMP_SHARE_STRATEGY_1_BALANCE = await strategies[0].contract.eMP_shares(eMP.address);

					expect(EMP_BALANCE_A).to.be.equal(BeforeBalanceAEMP);
					expect(OWNER_EMP_BALANCE_AFTER).to.be.equal(BeforeBalanceEMPOwner);
					expect(OWNER_BALANCE_A).to.be.equal(BeforeBalanceAOwner);

					expect(EMP_SHARE_STRATEGY_0_BALANCE).to.be.equal(0);
					expect(EMP_SHARE_STRATEGY_1_BALANCE).to.be.equal(0);
				});

				describe("[situation] Partial ERC20 amount available on EMP", async () => {
					it("Should allow withdrawing tokens from EMP..", async () => {
						const s1Balance = await strategies[0].contract.eMP_shares(eMP.address);
						const s2Balance = await strategies[1].contract.eMP_shares(eMP.address);

						// Withdraw only partial balanceOf EMP
						await eMP.utilizedV1EMPStrategyWithdraw([s1Balance.div(10), s2Balance.div(10)]);

						const VALID_BALANCE = await eMP.balanceOf(owner.address);

						await eMP.utilizedERC20Withdraw(VALID_BALANCE);


						const OWNER_EMP_BALANCE_AFTER = await eMP.balanceOf(owner.address);

						expect(OWNER_EMP_BALANCE_AFTER).to.be.equal(BeforeBalanceEMPOwner);

						const EMP_BALANCE_A = await eRC20A.balanceOf(eMP.address);
						const EMP_BALANCE_B = await eRC20B.balanceOf(eMP.address);
						const EMP_BALANCE_C = await eRC20C.balanceOf(eMP.address);

						expect(EMP_BALANCE_A).to.be.equal(BeforeBalanceAEMP);
						expect(EMP_BALANCE_B).to.be.equal(BeforeBalanceBEMP);
						expect(EMP_BALANCE_C).to.be.equal(BeforeBalanceCEMP);

						const OWNER_BALANCE_A = await eRC20A.balanceOf(owner.address);
						const OWNER_BALANCE_B = await eRC20B.balanceOf(owner.address);
						const OWNER_BALANCE_C = await eRC20C.balanceOf(owner.address);

						expect(OWNER_BALANCE_A).to.be.equal(BeforeBalanceAOwner);
						expect(OWNER_BALANCE_B).to.be.equal(BeforeBalanceBOwner);
						expect(OWNER_BALANCE_C).to.be.equal(BeforeBalanceCOwner);


						const EMP_SHARE_STRATEGY_0_BALANCE = await strategies[0].contract.eMP_shares(eMP.address);
						const EMP_SHARE_STRATEGY_1_BALANCE = await strategies[0].contract.eMP_shares(eMP.address);

						expect(EMP_SHARE_STRATEGY_0_BALANCE).to.be.equal(0);
						expect(EMP_SHARE_STRATEGY_1_BALANCE).to.be.equal(0);
					});

					it("Should allow withdrawing tokens from EMP with tolerance applied..", async () => {
						const s1Balance = await strategies[0].contract.eMP_shares(eMP.address);
						const s2Balance = await strategies[1].contract.eMP_shares(eMP.address);

						// Withdraw only partial balanceOf EMP
						await eMP.utilizedV1EMPStrategyWithdraw([s1Balance.div(23), s2Balance.div(35)]);

						const VALID_BALANCE = await eMP.balanceOf(owner.address);

						await eMP.utilizedERC20Withdraw(VALID_BALANCE);

						const OWNER_EMP_BALANCE_AFTER = await eMP.balanceOf(owner.address);

						expect(OWNER_EMP_BALANCE_AFTER).to.be.equal(BeforeBalanceEMPOwner);


						const EMP_BALANCE_A = await eRC20A.balanceOf(eMP.address);
						const EMP_BALANCE_B = await eRC20B.balanceOf(eMP.address);
						const EMP_BALANCE_C = await eRC20C.balanceOf(eMP.address);

						expect(EMP_BALANCE_A).to.be.equal(BeforeBalanceAEMP);
						expect(EMP_BALANCE_B).to.be.equal(BeforeBalanceBEMP);
						expect(EMP_BALANCE_C).to.be.equal(BeforeBalanceCEMP.add(await eMPUtility.TOLERANCE()).sub(1));


						const OWNER_BALANCE_A = await eRC20A.balanceOf(owner.address);
						const OWNER_BALANCE_B = await eRC20B.balanceOf(owner.address);
						const OWNER_BALANCE_C = await eRC20C.balanceOf(owner.address);

						expect(OWNER_BALANCE_A).to.be.equal(BeforeBalanceAOwner);
						expect(OWNER_BALANCE_B).to.be.equal(BeforeBalanceBOwner);
						expect(OWNER_BALANCE_C).to.be.equal(BeforeBalanceCOwner.sub(await eMPUtility.TOLERANCE()));


						const EMP_SHARE_STRATEGY_0_BALANCE = await strategies[0].contract.eMP_shares(eMP.address);
						const EMP_SHARE_STRATEGY_1_BALANCE = await strategies[0].contract.eMP_shares(eMP.address);

						expect(EMP_SHARE_STRATEGY_0_BALANCE).to.be.equal(0);
						expect(EMP_SHARE_STRATEGY_1_BALANCE).to.be.equal(0);
					});
				});
			});
		});
	});
});
