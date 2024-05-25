const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";

import { ERROR, PERCENT, D_18 } from "../const";
import StrategyTransferUtil from "../scripts/StrategyTransferUtil";


const LOCATION_IERC20: string = "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20";


describe("[2.2] YieldSyncV1EMPStrategy.sol - Withdrawing Tokens", async () => {
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let yieldSyncUtilityV1Array: Contract;
	let yieldSyncGovernance: Contract;
	let eTHValueFeed: Contract;
	let strategyInteractor: Contract;
	let yieldSyncV1EMPRegistry: Contract;
	let yieldSyncV1EMPStrategy: Contract;
	let yieldSyncV1EMPStrategyDeployer: Contract;
	let strategyTransferUtil: StrategyTransferUtil;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		/**
		* @dev It is important to utilize the strategyTransferUtil for multiple ERC20 based strategies because they get
		* reordred when setup. The strategyUtil will return the deposit amounts in the order of the what the conctract
		* returns for the Utilized ERC20s
		*/
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
		eTHValueFeed = await (await ETHValueFeedDummy.deploy()).deployed();
		strategyInteractor = await (await StrategyInteractorDummy.deploy()).deployed();
		yieldSyncUtilityV1Array = await (await YieldSyncUtilityV1Array.deploy()).deployed();
		yieldSyncGovernance = await (await YieldSyncGovernance.deploy()).deployed();
		yieldSyncV1EMPRegistry = await (
			await YieldSyncV1EMPRegistry.deploy(yieldSyncGovernance.address)
		).deployed();
		yieldSyncV1EMPStrategyDeployer = await (
			await YieldSyncV1EMPStrategyDeployer.deploy(yieldSyncV1EMPRegistry.address, yieldSyncUtilityV1Array.address)
		).deployed();

		// Set Treasury
		await expect(yieldSyncGovernance.payToUpdate(TREASURY.address)).to.be.not.reverted;

		// Mock owner being an EMP Deployer
		await expect(yieldSyncV1EMPRegistry.yieldSyncV1EMPDeployerUpdate(OWNER.address)).to.be.not.reverted;

		// Mock owner being an EMP for authorization
		await expect(yieldSyncV1EMPRegistry.yieldSyncV1EMPRegister(OWNER.address)).to.be.not.reverted;

		// Set EMP Strategy Deployer on registry
		await expect(
			yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyDeployerUpdate(yieldSyncV1EMPStrategyDeployer.address)
		).to.be.not.reverted;

		await expect(yieldSyncV1EMPStrategyDeployer.deployYieldSyncV1EMPStrategy("Strategy", "S")).to.be.not.reverted;

		expect(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(1)).to.be.not.equal(
			ethers.constants.AddressZero
		);

		// Attach the deployed YieldSyncV1EMPStrategy address
		yieldSyncV1EMPStrategy = await YieldSyncV1EMPStrategy.attach(
			String(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(1))
		);

		strategyTransferUtil = new StrategyTransferUtil(yieldSyncV1EMPStrategy, eTHValueFeed);
	});


	describe("function utilizedERC20Withdraw()", async () => {
		let b4TotalSupplyStrategy: BigNumber;
		let b4BalanceMockAOwner: BigNumber;
		let b4BalanceMockASI: BigNumber;
		let b4BalanceMockBOwner: BigNumber;
		let b4BalanceMockBSI: BigNumber;

		beforeEach(async () => {
			const [OWNER] = await ethers.getSigners();

			// Snapshot Total Supply
			b4TotalSupplyStrategy = await yieldSyncV1EMPStrategy.totalSupply();

			// Snapshot Balances
			b4BalanceMockAOwner = await mockERC20A.balanceOf(OWNER.address);

			b4BalanceMockASI = await mockERC20A.balanceOf(strategyInteractor.address);

			b4BalanceMockBOwner = await mockERC20B.balanceOf(OWNER.address);

			b4BalanceMockBSI = await mockERC20B.balanceOf(strategyInteractor.address);
		});

		describe("Setup Tests", async () => {
			it("[modifier] Should revert if ETH FEED is not set..", async () => {
				const [OWNER] = await ethers.getSigners();

				// Set strategy ERC20 tokens
				await yieldSyncV1EMPStrategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await expect(yieldSyncV1EMPStrategy.utilizedERC20Withdraw(OWNER.address, 0)).to.be.rejectedWith(
					ERROR.ETH_FEED_NOT_SET
				);
			});

			it("[modifier] Should revert if STRATEGY INTERACTOR is not set..", async () => {
				const [OWNER] = await ethers.getSigners();

				// Set strategy ERC20 tokens
				await yieldSyncV1EMPStrategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				// Set value feed
				await yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address);

				await expect(yieldSyncV1EMPStrategy.utilizedERC20Withdraw(OWNER.address, 0)).to.be.rejectedWith(
					ERROR.STRATEGY_NOT_SET
				);
			});

			it("Should revert if withdrawals are not open..", async () => {
				const [OWNER] = await ethers.getSigners();

				// Set strategy ERC20 tokens
				await yieldSyncV1EMPStrategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]])

				// Set value feed
				await yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address);

				// Set SI
				await yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				// Toggle deposits on
				await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();

				// Set deposit amount
				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				// APPROVE - the SI contract to spend tokens on behalf of OWNER
				await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT);

				// DEPOSIT - ERC20 tokens into the strategy
				await yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT]);

				// Expect that owner balance is the difference of the strategy total supply increased
				expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
					(await yieldSyncV1EMPStrategy.totalSupply()).sub(b4TotalSupplyStrategy)
				);

				// [main-test] WITHDRAW - ERC20 tokens into the strategy
				await expect(yieldSyncV1EMPStrategy.utilizedERC20Withdraw(OWNER.address, 0)).to.be.rejectedWith(
					ERROR.WITHDRAW_NOT_OPEN
				);
			});
		});

		describe("[SINGLE ERC20]", async () => {
			beforeEach(async () => {
				// Set strategy ERC20 tokens
				await yieldSyncV1EMPStrategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				// Set value feed
				await yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address);

				// Set SI
				await yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				// Toggle deposits on
				await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();

				// Toggle withdrawals on
				await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();

				// Expect that withdrawals are toggled on
				expect(await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.true;
			});

			it("Should fail to process withdrawal if Strategy token balance is greater than owned..", async () => {
				const [OWNER] = await ethers.getSigners();

				// Set deposit amount
				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				// APPROVE - SI contract to spend tokens on behalf of OWNER
				await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT);

				// DEPOSIT - mockERC20A tokens into the strategy
				await yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT]);

				// Expect that the balance remains less than original
				expect(await mockERC20A.balanceOf(OWNER.address)).to.be.lessThan(b4BalanceMockAOwner);

				// SI mock a balance should equal to deposit amount
				expect(await mockERC20A.balanceOf(strategyInteractor.address)).to.be.equal(DEPOSIT_AMOUNT);

				// Get current Strategy ERC20 total supply
				const TOTAL_SUPPLY_STRATEGY: BigNumber = await yieldSyncV1EMPStrategy.totalSupply();

				// Expect that strategy total supply has increased
				expect(TOTAL_SUPPLY_STRATEGY).to.be.greaterThan(b4TotalSupplyStrategy);

				const BALANCE_STRATEGY_OWNER: BigNumber = await yieldSyncV1EMPStrategy.balanceOf(OWNER.address);

				// Expect that owner balance is the difference of the Strat supply increase
				expect(BALANCE_STRATEGY_OWNER).to.be.equal(TOTAL_SUPPLY_STRATEGY.sub(b4TotalSupplyStrategy));

				// Create invalid balance to test with
				const INVALID_BALANCE: BigNumber = (BALANCE_STRATEGY_OWNER).add(ethers.utils.parseUnits(".1", 18));

				// [main-test] WITHDRAW - Fail to withdraw ERC20 tokens
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Withdraw(OWNER.address, INVALID_BALANCE)
				).to.be.revertedWith(
					ERROR.INVALID_BALANCE
				);
			});

			it("Should fail to return ERC20 if purpose.withdraw != true..", async () => {
				const [OWNER] = await ethers.getSigners();

				// Set deposit amount
				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				// APPROVE - SI contract to spend tokens on behalf of OWNER
				await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT);

				// DEPOSIT - mockERC20A tokens into the strategy
				await yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT]);

				// Expect that the OWNER has deposited MockERC20A
				expect(await mockERC20A.balanceOf(OWNER.address)).to.be.lessThan(b4BalanceMockAOwner);

				// Expect that the SI received the mockERC20A tokens
				expect(await mockERC20A.balanceOf(strategyInteractor.address)).to.be.equal(DEPOSIT_AMOUNT);

				// Expect that the Strategy ERC20 total supply has increased
				expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.greaterThan(b4TotalSupplyStrategy);

				// Capture balance after depositing
				const AFTER_DEPOSIT_BALANCE_MOCK_A_OWNER = await mockERC20A.balanceOf(OWNER.address);

				// Expect that owner balance is the difference of the Strat supply increase
				expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
					(await yieldSyncV1EMPStrategy.totalSupply()).sub(b4TotalSupplyStrategy)
				);

				// Disable transfers
				await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
				await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();

				// Set utilization.withdraw to false
				await yieldSyncV1EMPStrategy.utilizedERC20Update([mockERC20A.address], [[true, false, PERCENT.HUNDRED]]);

				// Enable transfers
				await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
				await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();

				// [main-test] Withdraw ERC20 tokens into the strategy
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Withdraw(
						OWNER.address,
						await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)
					)
				).to.be.not.reverted;

				// Expect that the SI MockERC20A balance has not changed
				expect(await mockERC20A.balanceOf(strategyInteractor.address)).to.be.equal(DEPOSIT_AMOUNT);

				// Expect that the Strategy tokens have been burned
				expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(0);

				// Expect that the Strategy total supply is not what it was before the deposit
				expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(b4TotalSupplyStrategy);

				// Expect that OWNER MockERC20A balance is equal to what it was after depositing
				expect(await mockERC20A.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(
					AFTER_DEPOSIT_BALANCE_MOCK_A_OWNER
				);

				// Expect that OWNER MockERC20A balance is less than what it was before depositing
				expect(await mockERC20A.balanceOf(OWNER.address)).to.be.lessThan(b4BalanceMockAOwner);
			});

			it("Should allow caller to burn Strategy ERC20 tokens and receive deposits back..", async () => {
				const [OWNER] = await ethers.getSigners();

				// Set deposit amount
				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				// APPROVE - SI contract to spend tokens on behalf of OWNER
				await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT);

				// DEPOSIT - mockERC20A tokens into the strategy
				await yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT]);

				const AFTER_BALANCE_MOCK_A_SI: BigNumber = await mockERC20A.balanceOf(strategyInteractor.address);

				// mockERC20A BalanceOf strategy interactor should equal to deposit amount
				expect(AFTER_BALANCE_MOCK_A_SI).to.be.equal(b4BalanceMockASI.add(DEPOSIT_AMOUNT));

				// Expect that strategy total supply has increased
				expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.greaterThan(b4TotalSupplyStrategy);

				// Expect that owner balance is the difference of the Strat supply increase
				expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
					(await yieldSyncV1EMPStrategy.totalSupply()).sub(b4TotalSupplyStrategy)
				);

				// [main-test] Withdraw ERC20 tokens into the strategy
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Withdraw(OWNER.address, DEPOSIT_AMOUNT)
				).to.be.not.reverted;

				// Strategy token burned
				expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(b4BalanceMockASI);

				// Supply put back to original
				expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(b4TotalSupplyStrategy);

				// Expect that the balance been returned to original or greater
				expect(await mockERC20A.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(b4BalanceMockAOwner);
			});
		});

		describe("[MULTIPLE ERC20]", async () => {
			describe("[50/50]", async () => {
				beforeEach(async () => {
					// Set strategy ERC20 tokens
					await yieldSyncV1EMPStrategy.utilizedERC20Update(
						[mockERC20A.address, mockERC20B.address],
						[[true, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]]
					);

					// Set value feed
					await yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address);

					// Set SI
					await yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

					// Toggle deposits on
					await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();

					// Toggle withdrawals on
					await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();

					// Expect that withdrawals are toggled on
					expect(await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.true;
				});

				it("Should allow caller to burn Strategy ERC20 tokens and receive deposits back..", async () => {
					const [OWNER] = await ethers.getSigners();

					// Set deposit amount
					const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

					// APPROVE - SI contract to spend tokens on behalf of OWNER
					await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT);
					await mockERC20B.approve(strategyInteractor.address, DEPOSIT_AMOUNT);

					// DEPOSIT - mockERC20A tokens into the strategy
					await yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT, DEPOSIT_AMOUNT])

					// mockERC20A BalanceOf SI should equal to deposit amount
					expect(await mockERC20A.balanceOf(strategyInteractor.address)).to.be.equal(
						b4BalanceMockASI.add(DEPOSIT_AMOUNT)
					);

					// mockERC20B BalanceOf SI should equal to deposit amount
					expect(await mockERC20B.balanceOf(strategyInteractor.address)).to.be.equal(
						b4BalanceMockBSI.add(DEPOSIT_AMOUNT)
					);

					// Get the total supply after deposit
					const TOTAL_SUPPLY_STRATEGY: BigNumber = await yieldSyncV1EMPStrategy.totalSupply();

					// expect that the total supply of strategy has increased
					expect(TOTAL_SUPPLY_STRATEGY).to.be.greaterThan(b4TotalSupplyStrategy);

					// Calculate newly minted tokens by subtracting current total supply with b4 total supply
					const TOTAL_NEWLY_MINTED: BigNumber = TOTAL_SUPPLY_STRATEGY.sub(b4TotalSupplyStrategy);

					// Expect that the Strategy balance of owner is correct
					expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(TOTAL_NEWLY_MINTED);

					// [main-test] Expect to be able to withdraw ERC20 tokens from the strategy
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Withdraw(
							OWNER.address,
							await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)
						)
					).to.be.not.reverted;

					// Expect that the OWNER balance is returned back to what it was before depositing
					expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(b4BalanceMockASI);

					// Strategy total supply is restored back to what it was before depositing
					expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(b4TotalSupplyStrategy);

					// Expect that the OWNER received his previously depositied (and now withdrawn) MockERCA back
					expect(await mockERC20A.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(b4BalanceMockAOwner);

					// Expect that the OWNER received his previously deposited (and now withdrawn) MockERCB back
					expect(await mockERC20B.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(b4BalanceMockBOwner);
				});
			});

			describe("[75/25]", async () => {
				beforeEach(async () => {
					// Set strategy ERC20 tokens
					await yieldSyncV1EMPStrategy.utilizedERC20Update(
						[mockERC20A.address, mockERC20B.address],
						[[true, true, PERCENT.SEVENTY_FIVE], [true, true, PERCENT.TWENTY_FIVE]]
					);

					// Set value feed
					await yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address);

					// Set SI
					await yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

					// Toggle deposits on
					await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();

					// Toggle withdrawals on
					await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();

					// Expect that withdrawals are toggled on
					expect(await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.true;
				});

				it("Should allow caller to burn Strategy ERC20 tokens and receive deposits back..", async () => {
					const [OWNER] = await ethers.getSigners();

					const UTILIZED_ERC20: string[] = await yieldSyncV1EMPStrategy.utilizedERC20();

					const DEPOSIT_AMOUNTS: BigNumber[] = await strategyTransferUtil.calculateERC20RequiredByTotalAmount(
						ethers.utils.parseUnits("1", 18)
					);

					let b4BalancesOwner: BigNumber[] = [];
					let b4BalancesStrategyInteractor: BigNumber[] = [];

					for (let i: number = 0; i < UTILIZED_ERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_IERC20, UTILIZED_ERC20[i]);

						// APPROVE - SI contract to spend tokens on behalf of OWNER
						await IERC20.approve(strategyInteractor.address, DEPOSIT_AMOUNTS[i]);

						// Collect previous balances to check later with
						b4BalancesOwner.push(await IERC20.balanceOf(OWNER.address));
						b4BalancesStrategyInteractor.push(await IERC20.balanceOf(strategyInteractor.address));
					}

					// DEPOSIT - mockERC20A tokens into the strategy
					await yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, DEPOSIT_AMOUNTS);

					for (let i = 0; i < UTILIZED_ERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_IERC20, UTILIZED_ERC20[i]);

						// Expect balance of owner
						expect(await IERC20.balanceOf(OWNER.address)).to.equal(b4BalancesOwner[i].sub(DEPOSIT_AMOUNTS[i]));

						expect(await IERC20.balanceOf(strategyInteractor.address)).to.be.equal(
							b4BalancesStrategyInteractor[i].add(DEPOSIT_AMOUNTS[i])
						);
					}

					const TOTAL_SUPPLY_STRATEGY: BigNumber = await yieldSyncV1EMPStrategy.totalSupply();

					// Expect that strategy total supply has increased
					expect(TOTAL_SUPPLY_STRATEGY).to.be.greaterThan(b4TotalSupplyStrategy);

					// Expect that the Strat balance of owner is correct
					expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
						TOTAL_SUPPLY_STRATEGY.sub(b4TotalSupplyStrategy)
					);

					// [main-test] Withdraw ERC20 tokens into the strategy
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Withdraw(
							OWNER.address,
							await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)
						)
					).to.be.not.reverted;

					// Supply put back to original
					expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(b4TotalSupplyStrategy);

					// Expect that the balance been returned to original or greater
					expect(await mockERC20A.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(b4BalanceMockAOwner);

					// Expect that the balance been returned to original or greater
					expect(await mockERC20B.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(b4BalanceMockBOwner);
				});
			});
		});
	});
});
