import { expect } from "chai";
import { BigNumber, Contract, VoidSigner } from "ethers";

import { ERROR, PERCENT, D_18 } from "../../const";
import UtilStrategyTransfer from "../../util/UtilStrategyTransfer";

import stageContracts, { stageSpecificSetup } from "./stage-contracts-5";


const { ethers } = require("hardhat");


const LOCATION_IERC20: string = "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20";


describe("[5.2] V1EMPStrategy.sol - Withdrawing Tokens", async () => {
	let eRC20Handler: Contract;
	let registry: Contract;
	let strategy: Contract;
	let strategyDeployer: Contract;
	let eRC20A: Contract;
	let eRC20B: Contract;
	let eRC20C: Contract;
	let eRC20D: Contract;

	let utilStrategyTransfer: UtilStrategyTransfer;

	let owner: VoidSigner;
	let badActor: VoidSigner;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		(
			{
				registry,
				strategyDeployer,
				eRC20A,
				eRC20B,
				eRC20C,
				eRC20D,
				owner,
				badActor,
			} = await stageContracts()
		);

		({ eRC20Handler, strategy, utilStrategyTransfer, } = await stageSpecificSetup(registry, strategyDeployer, owner));
	});


	describe("function utilizedERC20Withdraw()", async () => {
		let b4TotalSupplyStrategy: BigNumber;
		let b4BalanceAERC20Handler: BigNumber;
		let b4BalanceBERC20Handler: BigNumber;
		let b4BalanceAOwner: BigNumber;
		let b4BalanceBOwner: BigNumber;

		beforeEach(async () => {
			// Snapshot Total Supply
			b4TotalSupplyStrategy = await strategy.sharesTotal();

			// Snapshot Balances
			b4BalanceAOwner = await eRC20A.balanceOf(owner.address);

			b4BalanceAERC20Handler = await eRC20A.balanceOf(eRC20Handler.address);

			b4BalanceBOwner = await eRC20B.balanceOf(owner.address);

			b4BalanceBERC20Handler = await eRC20B.balanceOf(eRC20Handler.address);
		});

		describe("Modifier", async () => {
			it("[modifier] Should revert if ERC20 Handler is not set..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([eRC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await expect(strategy.utilizedERC20Withdraw(0)).to.be.rejectedWith(
					ERROR.STRATEGY.ERC20_HANDLER_NOT_SET
				);
			});

			it("[modifier][auth] Should only allow mocked EMP (owner address) to call fn..", async () => {
				/**
				* @notice
				* In this test suite the OWNER address is mocked to be an EMP
				*/

				await strategy.utilizedERC20Update([eRC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await expect(strategy.connect(badActor).utilizedERC20Withdraw(0)).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
			});
		});

		describe("Expected Failure", async () => {
			it("Should revert if withdrawals are not open..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([eRC20A.address], [[true, true, PERCENT.HUNDRED]])

				await strategy.iERC20HandlerUpdate(eRC20Handler.address);

				await strategy.utilizedERC20DepositOpenUpdate(true);

				// Set deposit amount
				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				// APPROVE - Contract to spend tokens on behalf of owner
				await eRC20A.approve(eRC20Handler.address, DEPOSIT_AMOUNT);

				// DEPOSIT - ERC20 tokens into the strategy
				await strategy.utilizedERC20Deposit([DEPOSIT_AMOUNT]);

				// Expect that owner balance is the difference of the strategy total supply increased
				expect(await strategy.eMP_shares(owner.address)).to.be.equal(
					(await strategy.sharesTotal()).sub(b4TotalSupplyStrategy)
				);

				// [main-test] WITHDRAW - ERC20 tokens into the strategy
				await expect(strategy.utilizedERC20Withdraw(0)).to.be.rejectedWith(
					ERROR.STRATEGY.WITHDRAW_NOT_OPEN
				);
			});
		});

		describe("[SINGLE ERC20]", async () => {
			beforeEach(async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([eRC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await strategy.iERC20HandlerUpdate(eRC20Handler.address);

				await strategy.utilizedERC20DepositOpenUpdate(true);

				await strategy.utilizedERC20WithdrawOpenUpdate(true);

				expect(await strategy.utilizedERC20WithdrawOpen()).to.be.true;
			});

			describe("Expected Failure", async () => {
				let depositAmount: BigNumber;
				let totalSupplyStrategy: BigNumber;


				beforeEach(async () => {
					// Set deposit amount
					depositAmount = ethers.utils.parseUnits("1", 18);

					// APPROVE - Contract to spend tokens on behalf of owner
					await eRC20A.approve(eRC20Handler.address, depositAmount);


					// DEPOSIT - eRC20A tokens into the strategy
					await strategy.utilizedERC20Deposit([depositAmount]);

					// Expect that the balance remains less than original
					expect(await eRC20A.balanceOf(owner.address)).to.be.lessThan(b4BalanceAOwner);

					// Mock a balance should equal to deposit amount
					expect(await eRC20A.balanceOf(eRC20Handler.address)).to.be.equal(depositAmount);

					// Get current Strategy ERC20 total supply
					totalSupplyStrategy = await strategy.sharesTotal();

					// Expect that strategy total supply has increased
					expect(totalSupplyStrategy).to.be.greaterThan(b4TotalSupplyStrategy);
				});


				it("Should fail to process withdrawal if Strategy token balance is greater than owned..", async () => {
					const BALANCE_STRATEGY_OWNER: BigNumber = await strategy.eMP_shares(owner.address);

					// Expect that owner balance is the difference of the Strat supply increase
					expect(BALANCE_STRATEGY_OWNER).to.be.equal(totalSupplyStrategy.sub(b4TotalSupplyStrategy));

					// Create invalid balance to test with
					const INVALID_BALANCE: BigNumber = (BALANCE_STRATEGY_OWNER).add(ethers.utils.parseUnits(".1", 18));

					// [main-test] WITHDRAW - Fail to withdraw ERC20 tokens
					await expect(strategy.utilizedERC20Withdraw(INVALID_BALANCE)).to.be.rejectedWith(
						ERROR.STRATEGY.INVALID_SHARES_AMOUNT
					);
				});

				it("Should fail to return ERC20 if purpose.withdraw != true..", async () => {
					// Capture balance after depositing
					const AFTER_DEPOSIT_BALANCE_A_OWNER = await eRC20A.balanceOf(owner.address);

					// Expect that owner balance is the difference of the Strat supply increase
					expect(await strategy.eMP_shares(owner.address)).to.be.equal(
						totalSupplyStrategy.sub(b4TotalSupplyStrategy)
					);

					// Disable transfers
					await strategy.utilizedERC20DepositOpenUpdate(false);
					await strategy.utilizedERC20WithdrawOpenUpdate(false);

					// Set utilization.withdraw to false
					await strategy.utilizedERC20Update([eRC20A.address], [[true, false, PERCENT.HUNDRED]]);

					// Enable transfers
					await strategy.utilizedERC20DepositOpenUpdate(true);
					await strategy.utilizedERC20WithdrawOpenUpdate(true);

					// [main-test] Withdraw ERC20 tokens into the strategy
					await expect(strategy.utilizedERC20Withdraw(await strategy.eMP_shares(owner.address))).to.be.not.rejected;

					// Expect that the ERC20 Handler MockERC20A balance has not changed
					expect(await eRC20A.balanceOf(eRC20Handler.address)).to.be.equal(depositAmount);

					// Expect that the Strategy tokens have been burned
					expect(await strategy.eMP_shares(owner.address)).to.be.equal(0);

					// Expect that the Strategy total supply is not what it was before the deposit
					expect(await strategy.sharesTotal()).to.be.equal(b4TotalSupplyStrategy);

					// Expect that owner MockERC20A balance is equal to what it was after depositing
					expect(await eRC20A.balanceOf(owner.address)).to.be.greaterThanOrEqual(
						AFTER_DEPOSIT_BALANCE_A_OWNER
					);

					// Expect that owner MockERC20A balance is less than what it was before depositing
					expect(await eRC20A.balanceOf(owner.address)).to.be.lessThan(b4BalanceAOwner);
				});
			});

			describe("Expected Success", async () => {
				it("Should allow caller to burn Strategy ERC20 tokens and receive deposits back..", async () => {
					// Set deposit amount
					const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

					// APPROVE - Contract to spend tokens on behalf of owner
					await eRC20A.approve(eRC20Handler.address, DEPOSIT_AMOUNT);

					// DEPOSIT - eRC20A tokens into the strategy
					await strategy.utilizedERC20Deposit([DEPOSIT_AMOUNT]);

					// eRC20A BalanceOf erc20 handler should equal to deposit amount
					expect(await eRC20A.balanceOf(eRC20Handler.address)).to.be.equal(b4BalanceAERC20Handler.add(DEPOSIT_AMOUNT));

					// Expect that strategy total supply has increased
					expect(await strategy.sharesTotal()).to.be.greaterThan(b4TotalSupplyStrategy);

					// Expect that owner balance is the difference of the Strat supply increase
					expect(await strategy.eMP_shares(owner.address)).to.be.equal(
						(await strategy.sharesTotal()).sub(b4TotalSupplyStrategy)
					);

					// [main-test] Withdraw ERC20 tokens into the strategy
					await expect(strategy.utilizedERC20Withdraw(DEPOSIT_AMOUNT)).to.be.not.rejected;

					// Strategy token burned
					expect(await strategy.eMP_shares(owner.address)).to.be.equal(b4BalanceAERC20Handler);

					// Supply put back to original
					expect(await strategy.sharesTotal()).to.be.equal(b4TotalSupplyStrategy);

					// Expect that the balance been returned to original or greater
					expect(await eRC20A.balanceOf(owner.address)).to.be.greaterThanOrEqual(b4BalanceAOwner);
				});
			});
		});

		describe("[MULTIPLE ERC20] - A 40%, B 25%, C 25%, D 10%", async () => {
			beforeEach(async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update(
					[
						eRC20A.address,
						eRC20B.address,
						eRC20C.address,
						eRC20D.address,
					],
					[
						[true, true, PERCENT.FORTY],
						[true, true, PERCENT.TWENTY_FIVE],
						[true, true, PERCENT.TWENTY_FIVE],
						[true, true, PERCENT.TEN],
					]
				);

				await strategy.iERC20HandlerUpdate(eRC20Handler.address);

				await strategy.utilizedERC20DepositOpenUpdate(true);

				expect(await strategy.utilizedERC20DepositOpen()).to.be.true;

				await strategy.utilizedERC20WithdrawOpenUpdate(true);

				expect(await strategy.utilizedERC20WithdrawOpen()).to.be.true;
			});

			describe("Expected Success", async () => {
				it("Should allow caller to burn Strategy ERC20 tokens and receive deposits back..", async () => {
					const UTILIZED_ERC20: string[] = await strategy.utilizedERC20();

					const DEPOSIT_AMOUNTS: BigNumber[] = await utilStrategyTransfer.calculateERC20Required(
						ethers.utils.parseUnits("1", 18)
					);

					let b4BalancesOwner: BigNumber[] = [];
					let b4BalancesERC20Handler: BigNumber[] = [];

					for (let i: number = 0; i < UTILIZED_ERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_IERC20, UTILIZED_ERC20[i]);

						// APPROVE - contract to spend tokens on behalf of owner
						await IERC20.approve(eRC20Handler.address, DEPOSIT_AMOUNTS[i]);

						// Collect previous balances to check later with
						b4BalancesOwner.push(await IERC20.balanceOf(owner.address));
						b4BalancesERC20Handler.push(await IERC20.balanceOf(eRC20Handler.address));
					}

					// DEPOSIT - eRC20A tokens into the strategy
					await strategy.utilizedERC20Deposit(DEPOSIT_AMOUNTS);

					for (let i: number = 0; i < UTILIZED_ERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_IERC20, UTILIZED_ERC20[i]);

						// Expect balance of owner
						expect(await IERC20.balanceOf(owner.address)).to.equal(b4BalancesOwner[i].sub(DEPOSIT_AMOUNTS[i]));

						expect(await IERC20.balanceOf(eRC20Handler.address)).to.be.equal(
							b4BalancesERC20Handler[i].add(DEPOSIT_AMOUNTS[i])
						);
					}

					const TOTAL_SUPPLY_STRATEGY: BigNumber = await strategy.sharesTotal();

					// Expect that strategy total supply has increased
					expect(TOTAL_SUPPLY_STRATEGY).to.be.greaterThan(b4TotalSupplyStrategy);

					// Expect that the Strat balance of owner is correct
					expect(await strategy.eMP_shares(owner.address)).to.be.equal(
						TOTAL_SUPPLY_STRATEGY.sub(b4TotalSupplyStrategy)
					);

					// [main-test] Withdraw ERC20 tokens into the strategy
					await expect(
						strategy.utilizedERC20Withdraw(await strategy.eMP_shares(owner.address))
					).to.be.not.rejected;

					// Supply put back to original
					expect(await strategy.sharesTotal()).to.be.equal(b4TotalSupplyStrategy);

					// Expect that the balance been returned to original or greater
					expect(await eRC20A.balanceOf(owner.address)).to.be.greaterThanOrEqual(b4BalanceAOwner);

					// Expect that the balance been returned to original or greater
					expect(await eRC20B.balanceOf(owner.address)).to.be.greaterThanOrEqual(b4BalanceBOwner);
				});
			});
		});
	});
});
