const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";

import { ERROR, PERCENT, D_18 } from "../const";
import StrategyTransferUtil from "../scripts/StrategyTransferUtil";


describe("[2.2] YieldSyncV1EMPStrategy.sol - Withdrawing Tokens", async () => {
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let yieldSyncUtilityV1Array: Contract;
	let yieldSyncGovernance: Contract;
	let eTHValueFeedDummy: Contract;
	let strategyInteractorDummy: Contract;
	let yieldSyncV1EMPRegistry: Contract;
	let yieldSyncV1EMPStrategy: Contract;
	let yieldSyncV1EMPStrategyDeployer: Contract;
	let strategyTransferUtil: StrategyTransferUtil;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		const [OWNER, MANAGER, TREASURY] = await ethers.getSigners();

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");
		const YieldSyncUtilityV1Array: ContractFactory = await ethers.getContractFactory("YieldSyncUtilityV1Array");
		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");
		const YieldSyncV1EMPStrategy: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategy");
		const YieldSyncV1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategyDeployer");

		mockERC20A = await (await MockERC20.deploy()).deployed();
		mockERC20B = await (await MockERC20.deploy()).deployed();
		eTHValueFeedDummy = await (await ETHValueFeedDummy.deploy()).deployed();
		strategyInteractorDummy = await (await StrategyInteractorDummy.deploy()).deployed();
		yieldSyncUtilityV1Array = await (await YieldSyncUtilityV1Array.deploy()).deployed();
		yieldSyncGovernance = await (await YieldSyncGovernance.deploy()).deployed();
		yieldSyncV1EMPRegistry = await (await YieldSyncV1EMPRegistry.deploy(yieldSyncGovernance.address, yieldSyncUtilityV1Array.address)).deployed();
		yieldSyncV1EMPStrategyDeployer = await (
			await YieldSyncV1EMPStrategyDeployer.deploy(yieldSyncV1EMPRegistry.address)
		).deployed();

		// Set Treasury
		await expect(yieldSyncGovernance.payToUpdate(TREASURY.address)).to.not.be.reverted;

		// Mock owner being an EMP Deployer
		await expect(yieldSyncV1EMPRegistry.yieldSyncV1EMPDeployerUpdate(OWNER.address)).to.not.be.reverted;

		// Mock owner being an EMP for authorization
		await expect(yieldSyncV1EMPRegistry.yieldSyncV1EMPRegister(OWNER.address)).to.not.be.reverted;

		// Set EMP Strategy Deployer on registry
		await expect(
			yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyDeployerUpdate(yieldSyncV1EMPStrategyDeployer.address)
		).to.not.be.reverted;

		await expect(yieldSyncV1EMPStrategyDeployer.deployYieldSyncV1EMPStrategy("Strategy", "S")).to.be.not.reverted;

		expect(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(1)).to.be.not.equal(
			ethers.constants.AddressZero
		);

		// Attach the deployed YieldSyncV1EMPStrategy address
		yieldSyncV1EMPStrategy = await YieldSyncV1EMPStrategy.attach(
			String(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(1))
		);

		strategyTransferUtil = new StrategyTransferUtil(yieldSyncV1EMPStrategy, eTHValueFeedDummy);
	});


	describe("function utilizedERC20Withdraw()", async () => {
		describe("Prereqs", async () => {
			it(
				"[modifier] Should revert if ETH FEED is not set..",
				async () => {
					const [OWNER] = await ethers.getSigners();

					await expect(yieldSyncV1EMPStrategy.utilizedERC20Withdraw(OWNER.address, 0)).to.be.rejectedWith(
						ERROR.ETH_FEED_NOT_SET
					);
				}
			);

			it(
				"[modifier] Should revert if strategy is not set..",
				async () => {
					const [OWNER] = await ethers.getSigners();

					await expect(
						yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
					).to.not.be.reverted;

					await expect(yieldSyncV1EMPStrategy.utilizedERC20Withdraw(OWNER.address, 0)).to.be.rejectedWith(
						ERROR.STRATEGY_NOT_SET
					);
				}
			);

			it("Should revert if withdrawals are not open..", async () => {
				const [OWNER] = await ethers.getSigners();

				// Set strategy ERC20 tokens
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]])
				).to.not.be.reverted;

				// Set value feed
				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				// Set SI feed
				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
				).to.not.be.reverted;

				// Open deposits
				await expect(yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()).to.not.be.reverted;

				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				// Approve the SI contract to spend tokens on behalf of OWNER
				await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT);

				// Deposit ERC20 tokens into the strategy
				await yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT])

				// [calculate] Deposit ETH Value
				const YSS_BALANCE: BigNumber = DEPOSIT_AMOUNT.mul(
					await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)
				).div(D_18);

				// Check that the owner recieved SI tokens equivalent to the ETH value of the deposits
				expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(YSS_BALANCE);

				// [main-test] WITHDRAW - ERC20 tokens into the strategy
				await expect(yieldSyncV1EMPStrategy.utilizedERC20Withdraw(OWNER.address, 0)).to.be.rejectedWith(
					ERROR.WITHDRAW_NOT_OPEN
				);
			});
		});

		describe("[SINGLE ERC20]", async () => {
			it("[100] Should fail to process withdraw request if token balance is not enough..", async () => {
				const [OWNER] = await ethers.getSigners();

				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				// Set strategy ERC20 tokens
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Update([mockERC20A.address], [[true, false, PERCENT.HUNDRED]])
				).to.not.be.reverted;

				// Set value feed
				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				// Set SI feed
				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
				).to.not.be.reverted;

				await expect(yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()).to.not.be.reverted;

				await expect(yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle()).to.not.be.reverted;

				const B4_STRAT_TOTAL_SUPPLY: BigNumber = await yieldSyncV1EMPStrategy.totalSupply();

				const B4_BALANCE_OWNER_MOCK_A: BigNumber = await mockERC20A.balanceOf(OWNER.address);

				// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
				await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT);

				// Deposit mockERC20A tokens into the strategy
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT])
				).to.not.be.reverted;

				const AFTER_BALANCE_MOCK_A_OWNER: BigNumber = await mockERC20A.balanceOf(OWNER.address);

				// Check that the balance remains less than original
				expect(AFTER_BALANCE_MOCK_A_OWNER).to.be.lessThan(B4_BALANCE_OWNER_MOCK_A);

				// mockERC20A BalanceOf strategy interactor should equal to deposit amount
				expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(DEPOSIT_AMOUNT);

				// Strategy totalSupply has increased (b4 should be 0)
				expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.greaterThan(B4_STRAT_TOTAL_SUPPLY);

				// Strategy BalanceOf OWNER should be newly minted tokens (Current Supply - B4 supply)
				expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
					(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).sub(B4_STRAT_TOTAL_SUPPLY)
				);

				// [main-test] Withdraw ERC20 tokens into the strategy
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Withdraw(
						OWNER.address,
						(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).add(
							await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)
						)
					)
				).to.be.revertedWith(ERROR.INVALID_BALANCE);
			});

			it("[100] Should fail to return ERC20 if purpose.withdraw != true..", async () => {
				const [OWNER] = await ethers.getSigners();

				// Set strategy ERC20 tokens
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Update([mockERC20A.address], [[true, false, PERCENT.HUNDRED]])
				).to.not.be.reverted;

				// Set value feed
				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				// Set SI feed
				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
				).to.not.be.reverted;

				await expect(yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()).to.not.be.reverted;
				await expect(yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle()).to.not.be.reverted;


				const B4_STRAT_TOTAL_SUPPLY: BigNumber = await yieldSyncV1EMPStrategy.totalSupply();
				const B4_BALANCE_OWNER_MOCK_A: BigNumber = await mockERC20A.balanceOf(OWNER.address);

				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
				await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT);

				// Deposit mockERC20A tokens into the strategy
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT])
				).to.not.be.reverted;

				const AFTER_BALANCE_MOCK_A_OWNER = await mockERC20A.balanceOf(OWNER.address);

				// Check that the balance remains less than original
				expect(AFTER_BALANCE_MOCK_A_OWNER).to.be.lessThan(B4_BALANCE_OWNER_MOCK_A);

				// mockERC20A BalanceOf strategy interactor should equal to deposit amount
				expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(DEPOSIT_AMOUNT);

				// Strategy totalSupply has increased (b4 should be 0)
				expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.greaterThan(B4_STRAT_TOTAL_SUPPLY);

				// Strategy BalanceOf OWNER should be newly minted tokens (Current Supply - B4 supply)
				expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
					(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).sub(B4_STRAT_TOTAL_SUPPLY)
				);

				// [main-test] Withdraw ERC20 tokens into the strategy
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Withdraw(
						OWNER.address,
						await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)
					)
				).to.be.not.reverted;

				// Unchanged balance of strategy interactor
				expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(DEPOSIT_AMOUNT);

				// Strategy token burned
				expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(0);

				// Supply put back to original
				expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(B4_STRAT_TOTAL_SUPPLY);

				// Check that the balance remains less than original
				expect(await mockERC20A.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(AFTER_BALANCE_MOCK_A_OWNER);

				// Check that the balance remains less than original
				expect(await mockERC20A.balanceOf(OWNER.address)).to.be.lessThan(B4_BALANCE_OWNER_MOCK_A);
			});

			it(
				"[100] Should allow caller to burn ERC20 and cash out..",
				async () => {
					const [OWNER] = await ethers.getSigners();

					// Set strategy ERC20 tokens
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]])
					).to.not.be.reverted;

					await expect(
						yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
					).to.not.be.reverted;

					await expect(
						yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
					).to.not.be.reverted;

					await expect(yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()).to.not.be.reverted;
					await expect(yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle()).to.not.be.reverted;


					const B4_STRAT_TOTAL_SUPPLY: BigNumber = await yieldSyncV1EMPStrategy.totalSupply();

					const STRAT_MOCK_A_BALANCE_B4: BigNumber = await mockERC20A.balanceOf(strategyInteractorDummy.address);

					const B4_BALANCE_OWNER_MOCK_A: BigNumber = await mockERC20A.balanceOf(OWNER.address);

					const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

					// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
					await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT);

					// Deposit mockERC20A tokens into the strategy
					yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT])

					// mockERC20A BalanceOf strategy interactor should equal to deposit amount
					expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(
						STRAT_MOCK_A_BALANCE_B4.add(DEPOSIT_AMOUNT)
					);

					// Strategy totalSupply has increased
					expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.greaterThan(B4_STRAT_TOTAL_SUPPLY);

					// Strategy BalanceOf OWNER should be newly minted tokens (Current Supply - B4 supply)
					expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
						(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).sub(B4_STRAT_TOTAL_SUPPLY)
					);

					// [main-test] Withdraw ERC20 tokens into the strategy
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Withdraw(
							OWNER.address,
							await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)
						)
					).to.be.not.reverted;

					// Strategy token burned
					expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(STRAT_MOCK_A_BALANCE_B4);

					// Supply put back to original
					expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(B4_STRAT_TOTAL_SUPPLY);

					// Check that the balance been returned to original or greater
					expect(await mockERC20A.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(B4_BALANCE_OWNER_MOCK_A);
				}
			);
		});

		describe("[MULTIPLE ERC20]", async () => {
			it(
				"[50/50] Should allow caller to burn ERC20 and cash out..",
				async () => {
					const [OWNER] = await ethers.getSigners();

					// Set strategy ERC20 tokens
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Update(
							[mockERC20A.address, mockERC20B.address],
							[[true, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]],
						)
					).to.not.be.reverted;

					await expect(
						yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
					).to.not.be.reverted;

					await expect(
						yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
					).to.not.be.reverted;

					await expect(yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()).to.not.be.reverted;
					await expect(yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle()).to.not.be.reverted;


					const B4_STRAT_TOTAL_SUPPLY: BigNumber = await yieldSyncV1EMPStrategy.totalSupply();

					const STRAT_MOCK_A_BALANCE_B4: BigNumber = await mockERC20A.balanceOf(strategyInteractorDummy.address);
					const STRAT_MOCK_B_BALANCE_B4: BigNumber = await mockERC20B.balanceOf(strategyInteractorDummy.address);

					const B4_BALANCE_OWNER_MOCK_A: BigNumber = await mockERC20A.balanceOf(OWNER.address);
					const OWNER_MOCK_B_BALANCE_B4: BigNumber = await mockERC20B.balanceOf(OWNER.address);

					const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

					// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
					await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT);
					await mockERC20B.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT);

					// Deposit mockERC20A tokens into the strategy
					yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT, DEPOSIT_AMOUNT])

					// mockERC20A BalanceOf strategy interactor should equal to deposit amount
					expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(
						STRAT_MOCK_A_BALANCE_B4.add(DEPOSIT_AMOUNT)
					);

					// mockERC20B BalanceOf strategy interactor should equal to deposit amount
					expect(await mockERC20B.balanceOf(strategyInteractorDummy.address)).to.be.equal(
						STRAT_MOCK_B_BALANCE_B4.add(DEPOSIT_AMOUNT)
					);

					// Strategy totalSupply has increased
					expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.greaterThan(B4_STRAT_TOTAL_SUPPLY);

					// Strategy BalanceOf OWNER should be newly minted tokens (Current Supply - B4 supply)
					expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
						(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).sub(B4_STRAT_TOTAL_SUPPLY)
					);

					// [main-test] Withdraw ERC20 tokens into the strategy
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Withdraw(
							OWNER.address,
							await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)
						)
					).to.be.not.reverted;


					// Strategy token burned
					expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(STRAT_MOCK_A_BALANCE_B4);

					// Supply put back to original
					expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(B4_STRAT_TOTAL_SUPPLY);

					// Check that the balance been returned to original or greater
					expect(await mockERC20A.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(B4_BALANCE_OWNER_MOCK_A);

					// Check that the balance been returned to original or greater
					expect(await mockERC20B.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(OWNER_MOCK_B_BALANCE_B4);
				}
			);

			/// TODO Check that everything that needs to be checked is being checked in this test
			it("[75/25] Should allow caller to burn ERC20 and cash out..", async () => {
				const [OWNER] = await ethers.getSigners();

				// Set strategy ERC20 tokens
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Update(
						[mockERC20A.address, mockERC20B.address],
						[[true, true, PERCENT.SEVENTY_FIVE], [true, true, PERCENT.TWENTY_FIVE]],
					)
				).to.not.be.reverted;

				const UTILIZED_ERC20: string[] = await yieldSyncV1EMPStrategy.utilizedERC20s();

				// Set value feed
				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				// Set SI feed
				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
				).to.not.be.reverted;

				await expect(yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()).to.not.be.reverted;
				await expect(yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle()).to.not.be.reverted;


				const DEPOSIT_AMOUNTS: BigNumber[] = await strategyTransferUtil.calculateERC20RequiredByTotalAmount(
					ethers.utils.parseUnits("1", 18)
				);

				const B4_TOTAL_SUPPLY_STRAT: BigNumber = await yieldSyncV1EMPStrategy.totalSupply();

				const B4_BALANCE_OWNER_STRAT: BigNumber = await yieldSyncV1EMPStrategy.balanceOf(OWNER.address);

				const B4_BALANCE_OWNER_MOCK_A: BigNumber = await mockERC20A.balanceOf(OWNER.address);

				const B4_BALANCE_OWNER_MOCK_B: BigNumber = await mockERC20B.balanceOf(OWNER.address);

				let balancesB4Owner: BigNumber[] = [];
				let balancesB4StrategyInteractor: BigNumber[] = [];

				for (let i: number = 0; i < UTILIZED_ERC20.length; i++)
				{
					const IERC20 = await ethers.getContractAt(
						"@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
						UTILIZED_ERC20[i]
					);

					// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
					await IERC20.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNTS[i]);

					// Collect previous balances to check later with
					balancesB4Owner.push(await IERC20.balanceOf(OWNER.address));
					balancesB4StrategyInteractor.push(await IERC20.balanceOf(strategyInteractorDummy.address));
				}

				// DEPOSIT - mockERC20A tokens into the strategy
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, DEPOSIT_AMOUNTS)
				).to.be.not.reverted;

				for (let i = 0; i < UTILIZED_ERC20.length; i++)
				{
					const IERC20 = await ethers.getContractAt(
						"@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
						UTILIZED_ERC20[i]
					);

					// Check balance of owner
					expect(await IERC20.balanceOf(OWNER.address)).to.equal(balancesB4Owner[i].sub(DEPOSIT_AMOUNTS[i]));

					expect(await IERC20.balanceOf(strategyInteractorDummy.address)).to.be.equal(
						balancesB4StrategyInteractor[i].add(DEPOSIT_AMOUNTS[i])
					);
				}

				const STRAT_TOTAL_SUPPLY = await yieldSyncV1EMPStrategy.totalSupply();

				// Strategy totalSupply has increased
				expect(STRAT_TOTAL_SUPPLY).to.be.greaterThan(B4_TOTAL_SUPPLY_STRAT);

				// Strategy BalanceOf OWNER should be newly minted tokens (Current Supply - B4 supply)
				expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
					(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).sub(B4_TOTAL_SUPPLY_STRAT)
				);

				// [main-test] Withdraw ERC20 tokens into the strategy
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Withdraw(
						OWNER.address,
						await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)
					)
				).to.be.not.reverted;

				// Supply put back to original
				expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(B4_TOTAL_SUPPLY_STRAT);

				// Strategy token burned
				expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(B4_BALANCE_OWNER_STRAT);

				// Check that the balance been returned to original or greater
				expect(await mockERC20A.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(B4_BALANCE_OWNER_MOCK_A);

				// Check that the balance been returned to original or greater
				expect(await mockERC20B.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(B4_BALANCE_OWNER_MOCK_B);
			});
		});
	});
});
