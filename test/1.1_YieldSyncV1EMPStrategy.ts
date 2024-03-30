const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";

import { ERROR, PERCENT, D_18 } from "../common";
import TransferUtil from "../scripts/TransferUtil"


describe("[1.1] YieldSyncV1EMPStrategy.sol - Deposit", async () =>
{
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC206: Contract;
	let eTHValueFeedDummy: Contract;
	let strategyInteractorDummy: Contract;
	let yieldSyncV1EMPRegistry: Contract;
	let yieldSyncV1EMPStrategy: Contract;
	let yieldSyncV1EMPStrategyDeployer: Contract;
	let transferUtil: TransferUtil;


	beforeEach("[beforeEach] Set up contracts..", async () =>
	{
		const [OWNER] = await ethers.getSigners();

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const MockERC206: ContractFactory = await ethers.getContractFactory("MockERC206");
		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");
		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");
		const YieldSyncV1EMPStrategy: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategy");
		const YieldSyncV1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategyDeployer");

		mockERC20A = await (await MockERC20.deploy()).deployed();
		mockERC20B = await (await MockERC20.deploy()).deployed();
		mockERC206 = await (await MockERC206.deploy()).deployed();
		eTHValueFeedDummy = await (await ETHValueFeedDummy.deploy()).deployed();
		strategyInteractorDummy = await (await StrategyInteractorDummy.deploy()).deployed();
		yieldSyncV1EMPRegistry = await (await YieldSyncV1EMPRegistry.deploy()).deployed();
		yieldSyncV1EMPStrategyDeployer = await (
			await YieldSyncV1EMPStrategyDeployer.deploy(yieldSyncV1EMPRegistry.address, OWNER.address)
		).deployed();

		// Mock owner being an EMP Deployer
		await expect(
			yieldSyncV1EMPRegistry.yieldSyncV1EMPDeployerUpdate(OWNER.address)
		).to.not.be.reverted;

		// Mock owner registering a deployed EMP
		await expect(
			yieldSyncV1EMPRegistry.yieldSyncV1EMPRegister(OWNER.address)
		).to.not.be.reverted;

		// Set EMP Strategy Deployer on registry
		await expect(
			yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyDeployerUpdate(yieldSyncV1EMPStrategyDeployer.address)
		).to.not.be.reverted;

		await expect(
			yieldSyncV1EMPStrategyDeployer.deployYieldSyncV1EMPStrategy("Strategy", "S")
		).to.be.not.reverted;

		expect(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(0)).to.be.not.equal(
			ethers.constants.AddressZero
		);

		// Attach the deployed YieldSyncV1EMPStrategy address
		yieldSyncV1EMPStrategy = await YieldSyncV1EMPStrategy.attach(
			String(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(0))
		);

		transferUtil = new TransferUtil(yieldSyncV1EMPStrategy, eTHValueFeedDummy)
	});


	describe("function utilizedERC20Deposit()", async () =>
	{
		describe("Prereqs", async () =>
		{
			it(
				"[modifier] Should revert if ETH FEED is not set..",
				async () =>
				{
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Deposit([])
					).to.be.rejectedWith(ERROR.ETH_FEED_NOT_SET);
				}
			);

			it(
				"[modifier] Should revert if strategy is not set..",
				async () =>
				{
					await expect(
						yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
					).to.not.be.reverted;

					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Deposit([])
					).to.be.rejectedWith(ERROR.STRATEGY_NOT_SET);
				}
			);

			it(
				"[modifier] Should only authorize authorized caller..",
				async () =>
				{
					const [, ADDR_1] = await ethers.getSigners();

					await expect(
						await yieldSyncV1EMPStrategy.utilizedERC20Update(
							[[mockERC20A.address, true, true, PERCENT.HUNDRED]]
						)
					).to.not.be.reverted;

					await expect(
						yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
					).to.not.be.reverted;

					await expect(
						yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
					).to.not.be.reverted;

					await expect(
						yieldSyncV1EMPStrategy.connect(ADDR_1).utilizedERC20Deposit([])
					).to.be.rejectedWith(ERROR.NOT_EMP);
				}
			);

			it(
				"Should revert if deposits not open..",
				async () =>
				{
					await expect(
						await yieldSyncV1EMPStrategy.utilizedERC20Update(
							[[mockERC20A.address, true, true, PERCENT.HUNDRED]]
						)
					).to.not.be.reverted;

					await expect(
						yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
					).to.not.be.reverted;

					await expect(
						yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
					).to.not.be.reverted;

					const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

					// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
					await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT);

					// [main-test] Deposit ERC20 tokens into the strategy
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT, DEPOSIT_AMOUNT])
					).to.revertedWith(ERROR.DEPOSIT_NOT_OPEN);
				}
			);

			it(
				"Should revert if denominator is 0..",
				async () =>
				{
					// Initialize strategy with mock ERC20
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Update([[mockERC20A.address, true, true, PERCENT.HUNDRED]])
					).to.not.be.reverted;

					await expect(
						yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
					).to.not.be.reverted;

					await expect(
						yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
					).to.not.be.reverted;

					await expect(yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()).to.not.be.reverted;

					// Set ETH value to ZERO
					await eTHValueFeedDummy.updateETHValue(0);

					const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

					await expect(yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT])).to.be.revertedWith(
						ERROR.NOT_COMPUTED
					);
				}
			);

			it(
				"Should return false if INVALID ERC20 amounts passed..",
				async () =>
				{
					// Initialize strategy with mock ERC20
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Update(
							[
								[mockERC20A.address, true, true, PERCENT.FIFTY],
								[mockERC20B.address, true, true, PERCENT.FIFTY]
							]
						)
					).to.not.be.reverted;

					await expect(
						yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
					).to.not.be.reverted;

					await expect(
						yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
					).to.not.be.reverted;

					await expect(yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()).to.not.be.reverted;

					const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

					await expect(yieldSyncV1EMPStrategy.utilizedERC20Deposit([0, DEPOSIT_AMOUNT])).to.be.revertedWith(
						ERROR.INVALID_UTILIZED_ERC20_AMOUNT
					);
				}
			)

			it(
				"Should return false if INVALID ERC20 amounts with deposits set to false but non-zero deposit amount passed..",
				async () =>
				{
					// Initialize strategy with mock ERC20
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Update(
							[
								[mockERC20A.address, true, true, PERCENT.HUNDRED],
								[mockERC20B.address, false, true, PERCENT.HUNDRED]
							]
						)
					).to.not.be.reverted;

					await expect(
						yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
					).to.not.be.reverted;

					await expect(
						yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
					).to.not.be.reverted;

					await expect(yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()).to.not.be.reverted;

					const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT, DEPOSIT_AMOUNT])
					).to.be.revertedWith(
						ERROR.INVALID_UTILIZED_ERC20_AMOUNT_DEPOSIT_FALSE_AND_NON_ZERO_DEPOSIT
					);
				}
			)
		});

		describe("[SINGLE ERC20]", async () =>
		{
			describe("[DECIMALS = 18]", async () =>
			{
				it(
					"Should revert if invalid _utilizedERC20Amount.length passed..",
					async () =>
					{
						await expect(
							await yieldSyncV1EMPStrategy.utilizedERC20Update(
								[[mockERC20A.address, true, true, PERCENT.HUNDRED]]
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();

						const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT);

						// [main-test] Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT, DEPOSIT_AMOUNT])
						).to.revertedWith(ERROR.INVALID_AMOUNT_LENGTH);
					}
				);

				it(
					"[100] Should be able to deposit ERC20 into strategy interactor..",
					async () =>
					{
						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Update([[mockERC20A.address, true, true, PERCENT.HUNDRED]])
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();


						const DEPOSIT_AMOUNT_A: BigNumber = ethers.utils.parseUnits("1", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_A])
						).to.not.be.reverted;

						const { totalValue } = await transferUtil.calculateValueOfERC20Deposits(
							[DEPOSIT_AMOUNT_A],
							[mockERC20A]
						);

						expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(totalValue);
					}
				);

				it(
					"[100] Should issue strategy ERC20 tokens upon utilized ERC20 deposit..",
					async () =>
					{
						const [OWNER] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Update([[mockERC20A.address, true, true, PERCENT.HUNDRED]])
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();


						const DEPOSIT_AMOUNT_A: BigNumber = ethers.utils.parseUnits("2", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);

						// Deposit ERC20 tokens into the strategy
						await yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_A])

						// [calculate] YSS balance ETH Value
						const yssBalance = DEPOSIT_AMOUNT_A.mul(
							await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)
						).div(D_18);

						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(yssBalance);
					}
				);
			});

			describe("[DECIMALS = 6]", async () =>
			{
				it(
					"[100] Should be able to deposit ERC20 into strategy interactor..",
					async () =>
					{
						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Update([[mockERC206.address, true, true, PERCENT.HUNDRED]])
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();

						const DEPOSIT_AMOUNT_6: BigNumber = ethers.utils.parseUnits("1", 6);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC206.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_6);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_6])
						).to.not.be.reverted;

						expect(await mockERC206.balanceOf(strategyInteractorDummy.address)).to.be.equal(DEPOSIT_AMOUNT_6);
					}
				);

				it(
					"[100] Should issue strategy ERC20 tokens upon utilzied ERC20 deposit..",
					async () =>
					{
						const [OWNER] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Update([[mockERC206.address, true, true, PERCENT.HUNDRED]])
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();


						const DEPOSIT_AMOUNT_6: BigNumber = ethers.utils.parseUnits("1", 6);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC206.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_6);

						// Deposit ERC20 tokens into the strategy
						await yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_6])

						// [calculate] YSS balance ETH Value
						const yssBalance = DEPOSIT_AMOUNT_6.mul(
							// Convert to base 18 with 10**12
							ethers.BigNumber.from("1000000000000")
						).mul(await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)).div(D_18);

						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(yssBalance);
					}
				);
			});
		});

		describe("[MULTIPLE ERC20]", async () =>
		{
			describe("[DECIMALS = 18]", async () =>
			{
				it(
					"[50/50] Should revert if invalid utilizedERC20Amounts passed..",
					async () =>
					{
						// Initialize strategy with mock ERC20
						await expect(
							await yieldSyncV1EMPStrategy.utilizedERC20Update(
								[
									[mockERC20A.address, true, true, PERCENT.FIFTY],
									[mockERC20B.address, true, true, PERCENT.FIFTY]
								]
							)
						).to.not.be.reverted;


						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();


						const DEPOSIT_AMOUNT_A: BigNumber = ethers.utils.parseUnits("1", 18);
						const DEPOSIT_AMOUNT_B: BigNumber = ethers.utils.parseUnits(".8", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);
						await mockERC20B.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_B);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_A, DEPOSIT_AMOUNT_B])
						).to.be.revertedWith(ERROR.INVALID_UTILIZED_ERC20_AMOUNT);
					}
				);

				it(
					"[50/50] Should be able to deposit ERC20s into strategy interactor..",
					async () =>
					{
						const CONTRACTS_TOKENS: Contract[] = [mockERC20A, mockERC20B];

						// Initialize strategy with mock ERC20
						await expect(
							await yieldSyncV1EMPStrategy.utilizedERC20Update(
								[
									[mockERC20A.address, true, true, PERCENT.FIFTY],
									[mockERC20B.address, true, true, PERCENT.FIFTY]
								]
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();

						const DEPOSIT_AMOUNTS: BigNumber[] = await transferUtil.calculateERC20RequiredByTotalAmount(
							CONTRACTS_TOKENS,
							ethers.utils.parseUnits(".4", 18)
						);

						expect(DEPOSIT_AMOUNTS.length).to.be.equal(CONTRACTS_TOKENS.length);

						for (let i: number = 0; i < CONTRACTS_TOKENS.length; i++)
						{
							// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
							await CONTRACTS_TOKENS[i].approve(strategyInteractorDummy.address, DEPOSIT_AMOUNTS[i]);
						}

						// [main-test] Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit(DEPOSIT_AMOUNTS)
						).to.not.be.reverted;

						for (let i: number = 0; i < CONTRACTS_TOKENS.length; i++)
						{
							// [main-test]
							expect(await CONTRACTS_TOKENS[i].balanceOf(strategyInteractorDummy.address)).to.be.equal(
								DEPOSIT_AMOUNTS[i]
							)
						}
					}
				);

				it(
					"[50/50] Should issue strategy ERC20 tokens upon utilized ERC20 deposit..",
					async () =>
					{
						const CONTRACTS_TOKENS: Contract[] = [mockERC20A, mockERC20B];

						const [OWNER] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Update(
								[
									[mockERC20A.address, true, true, PERCENT.FIFTY],
									[mockERC20B.address, true, true, PERCENT.FIFTY]
								]
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();

						const DEPOSIT_AMOUNTS: BigNumber[] = await transferUtil.calculateERC20RequiredByTotalAmount(
							CONTRACTS_TOKENS,
							ethers.utils.parseUnits("2", 18)
						);

						expect(DEPOSIT_AMOUNTS.length).to.be.equal(CONTRACTS_TOKENS.length);

						for (let i: number = 0; i < CONTRACTS_TOKENS.length; i++)
						{
							// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
							await CONTRACTS_TOKENS[i].approve(
								strategyInteractorDummy.address,
								DEPOSIT_AMOUNTS[i]
							);
						}

						// [main-test] Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit(DEPOSIT_AMOUNTS)
						).to.not.be.reverted;

						// [calculate] YSS balance ETH Value = (a * p(a) / 1e18) + (b * p(b) / 1e18)
						const { totalValue } = await transferUtil.calculateValueOfERC20Deposits(
							DEPOSIT_AMOUNTS,
							[mockERC20A, mockERC20B]
						);

						// [main-test]
						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(totalValue);
					}
				);

				it(
					"[75/25] Should revert if invalid utilizedERC20Amounts passed..",
					async () =>
					{
						const CONTRACTS_TOKENS: Contract[] = [mockERC20A, mockERC20B];

						// Initialize strategy with mock ERC20
						await expect(
							await yieldSyncV1EMPStrategy.utilizedERC20Update(
								[
									[mockERC20A.address, true, true, PERCENT.SEVENTY_FIVE],
									[mockERC20B.address, true, true, PERCENT.TWENTY_FIVE]
								]
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();

						const DEPOSIT_AMOUNT_A: BigNumber = ethers.utils.parseUnits(".5", 18);
						const DEPOSIT_AMOUNT_B: BigNumber = ethers.utils.parseUnits(".25", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);
						await mockERC20B.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);

						// [main-test] Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_A, DEPOSIT_AMOUNT_B])
						).to.be.revertedWith(ERROR.INVALID_UTILIZED_ERC20_AMOUNT);
					}
				);

				it(
					"[75/25] Should be able to deposit ERC20s into strategy interactor..",
					async () =>
					{
						const CONTRACTS_TOKENS: Contract[] = [mockERC20A, mockERC20B];

						// Initialize strategy with mock ERC20
						await expect(
							await yieldSyncV1EMPStrategy.utilizedERC20Update(
								[
									[mockERC20A.address, true, true, PERCENT.SEVENTY_FIVE],
									[mockERC20B.address, true, true, PERCENT.TWENTY_FIVE]
								]
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();


						const DEPOSIT_AMOUNTS: BigNumber[] = await transferUtil.calculateERC20RequiredByTotalAmount(
							CONTRACTS_TOKENS,
							ethers.utils.parseUnits("3", 18)
						);

						expect(DEPOSIT_AMOUNTS.length).to.be.equal(CONTRACTS_TOKENS.length);

						for (let i: number = 0; i < CONTRACTS_TOKENS.length; i++)
						{
							// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
							await CONTRACTS_TOKENS[i].approve(
								strategyInteractorDummy.address,
								DEPOSIT_AMOUNTS[i]
							);
						}

						// [main-test] Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit(DEPOSIT_AMOUNTS)
						).to.not.be.reverted;

						for (let i: number = 0; i < CONTRACTS_TOKENS.length; i++)
						{
							// [main-test]
							expect(await CONTRACTS_TOKENS[i].balanceOf(strategyInteractorDummy.address)).to.be.equal(
								DEPOSIT_AMOUNTS[i]
							)
						}
					}
				);

				it(
					"[75/25] Should issue strategy ERC20 tokens upon utilized ERC20 deposit..",
					async () =>
					{
						const [OWNER] = await ethers.getSigners();

						const CONTRACTS_TOKENS: Contract[] = [mockERC20A, mockERC20B];

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Update(
								[
									[mockERC20A.address, true, true, PERCENT.SEVENTY_FIVE],
									[mockERC20B.address, true, true, PERCENT.TWENTY_FIVE]
								]
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();

						const DEPOSIT_AMOUNTS: BigNumber[] = await transferUtil.calculateERC20RequiredByTotalAmount(
							CONTRACTS_TOKENS,
							ethers.utils.parseUnits("1", 18)
						);

						expect(DEPOSIT_AMOUNTS.length).to.be.equal(CONTRACTS_TOKENS.length);

						for (let i: number = 0; i < CONTRACTS_TOKENS.length; i++)
						{
							// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
							await CONTRACTS_TOKENS[i].approve(
								strategyInteractorDummy.address,
								DEPOSIT_AMOUNTS[i]
							);
						}

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit(DEPOSIT_AMOUNTS)
						).to.not.be.reverted;

						// [calculate] YSS balance ETH Value = (a * p(a) / 1e18) + (b * p(b) / 1e18)
						const { totalValue } = await transferUtil.calculateValueOfERC20Deposits(
							DEPOSIT_AMOUNTS,
							[mockERC20A, mockERC20B]
						);

						// [main-test]
						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(totalValue);
					}
				);
			});

			describe("[DECIMALS = 6]", async () =>
			{
				it(
					"[75/25] Should revert if invalid utilizedERC20Amounts passed..",
					async () =>
					{
						const CONTRACTS_TOKENS: Contract[] = [mockERC20A, mockERC206];

						// Initialize strategy with mock ERC20
						await expect(
							await yieldSyncV1EMPStrategy.utilizedERC20Update(
								[
									[mockERC20A.address, true, true, PERCENT.SEVENTY_FIVE],
									[mockERC206.address, true, true, PERCENT.TWENTY_FIVE]
								]
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();


						const DEPOSIT_AMOUNT_A: BigNumber = ethers.utils.parseUnits(".5", 18);
						const DEPOSIT_AMOUNT_6: BigNumber = ethers.utils.parseUnits(".25", 6);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);
						await mockERC206.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_6);

						// [main-test] Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_A, DEPOSIT_AMOUNT_6])
						).to.be.revertedWith(ERROR.INVALID_UTILIZED_ERC20_AMOUNT);
					}
				);

				it(
					"[75/25] Should be able to deposit ERC20s into strategy interactor..",
					async () =>
					{
						const [OWNER] = await ethers.getSigners();

						const CONTRACTS_TOKENS: Contract[] = [mockERC20A, mockERC206];

						// Initialize strategy with mock ERC20
						await expect(
							await yieldSyncV1EMPStrategy.utilizedERC20Update(
								[
									[mockERC20A.address, true, true, PERCENT.SEVENTY_FIVE],
									[mockERC206.address, true, true, PERCENT.TWENTY_FIVE]
								]
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();


						const DEPOSIT_AMOUNT_A: BigNumber = ethers.utils.parseUnits(".75", 18);
						const DEPOSIT_AMOUNT_6: BigNumber = ethers.utils.parseUnits(".25", 6);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);
						await mockERC206.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_6);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_A, DEPOSIT_AMOUNT_6])
						).to.not.be.reverted;

						expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(DEPOSIT_AMOUNT_A);
						expect(await mockERC206.balanceOf(strategyInteractorDummy.address)).to.be.equal(DEPOSIT_AMOUNT_6);

						// [calculate] YSS balance ETH Value
						const yssBalance = DEPOSIT_AMOUNT_A.add(
							// Convert to base 18 with 10**12
							DEPOSIT_AMOUNT_6.mul(ethers.BigNumber.from("1000000000000"))
						).mul(await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)).div(D_18);

						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(yssBalance);
					}
				);
			});
		});
	});
});
