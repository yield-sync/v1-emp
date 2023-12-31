const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

const ERR0R_INVALID_UTILIZEDERC20AMOUNT = "!utilizedERC20AmountValid(_utilizedERC20Amount)";
const ERROR_INVALID_AMOUNT_LENGTH = "_utilizedERC20.length != _utilizedERC20Amount.length";
const ERROR_ETH_FEED_NOT_SET = "address(yieldSyncV1EMPETHValueFeed) == address(0)";
const ERROR_STRATEGY_NOT_SET = "address(yieldSyncV1EMPStrategyInteractor) == address(0)";
const ERROR_DEPOSIT_NOT_OPEN = "!utilizedERC20DepositOpen";

const D_18 = ethers.utils.parseUnits('1', 18);

const HUNDRED_PERCENT = D_18;
const FIFTY_PERCENT = ethers.utils.parseUnits('.5', 18);
const TWENTY_FIVE_PERCENT = ethers.utils.parseUnits('.25', 18);
const SEVENTY_FIVE_PERCENT = ethers.utils.parseUnits('.75', 18);


describe("[0.1] YieldSyncV1EMPStrategy.sol - Deposit", async () =>
{
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC206: Contract;
	let eTHValueFeedDummy: Contract;
	let strategyInteractorDummy: Contract;
	let yieldSyncV1EMPStrategy: Contract;


	beforeEach("[beforeEach] Set up contracts..", async () =>
	{
		const [OWNER] = await ethers.getSigners();

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const MockERC206: ContractFactory = await ethers.getContractFactory("MockERC206");
		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");
		const YieldSyncV1EMPStrategy: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategy");

		mockERC20A = await (await MockERC20.deploy()).deployed();
		mockERC20B = await (await MockERC20.deploy()).deployed();
		mockERC206 = await (await MockERC206.deploy()).deployed();
		eTHValueFeedDummy = await (await ETHValueFeedDummy.deploy()).deployed();
		strategyInteractorDummy = await (await StrategyInteractorDummy.deploy()).deployed();
		yieldSyncV1EMPStrategy = await (await YieldSyncV1EMPStrategy.deploy(OWNER.address, "Exampe", "EX")).deployed();
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
					).to.be.rejectedWith(ERROR_ETH_FEED_NOT_SET);
				}
			);

			it(
				"[modifier] Should revert if strategy is not set..",
				async () =>
				{
					await expect(
						yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
					).to.not.be.reverted;

					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Deposit([])
					).to.be.rejectedWith(ERROR_STRATEGY_NOT_SET);
				}
			);

			it(
				"Should revert if deposits not open..",
				async () =>
				{
					await expect(
						await yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
							[mockERC20A.address],
							[[true, true, HUNDRED_PERCENT]]
						)
					).to.not.be.reverted;

					await expect(
						yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
					).to.not.be.reverted;

					await expect(
						yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
					).to.not.be.reverted;

					const DEPOSIT_AMOUNT = ethers.utils.parseUnits("1", 18);

					// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
					await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT);

					// [main-test] Deposit ERC20 tokens into the strategy
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT, DEPOSIT_AMOUNT])
					).to.revertedWith(ERROR_DEPOSIT_NOT_OPEN);
				}
			);
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
							await yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
								[mockERC20A.address],
								[[true, true, HUNDRED_PERCENT]]
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();


						const DEPOSIT_AMOUNT = ethers.utils.parseUnits("1", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT);

						// [main-test] Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT, DEPOSIT_AMOUNT])
						).to.revertedWith(ERROR_INVALID_AMOUNT_LENGTH);
					}
				);

				it(
					"[100] Should be able to deposit ERC20 into strategy interactor..",
					async () =>
					{
						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
								[mockERC20A.address],
								[[true, true, HUNDRED_PERCENT]]
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();


						const DEPOSIT_AMOUNT_A = ethers.utils.parseUnits("1", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_A])
						).to.not.be.reverted;

						expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(DEPOSIT_AMOUNT_A);
					}
				);

				it(
					"[100] Should issue strategy ERC20 tokens upon utilized ERC20 deposit..",
					async () =>
					{
						const [OWNER] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
								[mockERC20A.address],
								[[true, true, HUNDRED_PERCENT]]
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();


						const DEPOSIT_AMOUNT_A = ethers.utils.parseUnits("2", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);

						// Deposit ERC20 tokens into the strategy
						await yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_A])

						// [calculate] YSS balance
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
							yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
								[mockERC206.address],
								[[true, true, HUNDRED_PERCENT]]
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();


						const DEPOSIT_AMOUNT_6 = ethers.utils.parseUnits("1", 6);

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
							yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
								[mockERC206.address],
								[[true, true, HUNDRED_PERCENT]]
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();


						const DEPOSIT_AMOUNT_6 = ethers.utils.parseUnits("1", 6);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC206.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_6);

						// Deposit ERC20 tokens into the strategy
						await yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_6])

						// [calculate] YSS balance
						const yssBalance = DEPOSIT_AMOUNT_6.mul(
							// Convert to base 18 with 10**12
							ethers.BigNumber.from("1000000000000")
						).mul(
							await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)
						).div(
							D_18
						);

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
							await yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
								[mockERC20A.address, mockERC20B.address],
								[[true, true, FIFTY_PERCENT], [true, true, FIFTY_PERCENT]]
							)
						).to.not.be.reverted;


						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();


						const DEPOSIT_AMOUNT_A = ethers.utils.parseUnits("1", 18);
						const DEPOSIT_AMOUNT_B = ethers.utils.parseUnits(".8", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);
						await mockERC20B.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_A, DEPOSIT_AMOUNT_B])
						).to.be.revertedWith(ERR0R_INVALID_UTILIZEDERC20AMOUNT);
					}
				);

				it(
					"[50/50] Should be able to deposit ERC20s into strategy interactor..",
					async () =>
					{
						const [OWNER] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							await yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
								[mockERC20A.address, mockERC20B.address],
								[[true, true, FIFTY_PERCENT], [true, true, FIFTY_PERCENT]]
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();


						const DEPOSIT_AMOUNT_A = ethers.utils.parseUnits("1", 18);
						const DEPOSIT_AMOUNT_B = ethers.utils.parseUnits("1", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);
						await mockERC20B.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_B);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_A, DEPOSIT_AMOUNT_B])
						).to.not.be.reverted;

						expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(DEPOSIT_AMOUNT_A);
						expect(await mockERC20B.balanceOf(strategyInteractorDummy.address)).to.be.equal(DEPOSIT_AMOUNT_B);

						// [calculate] YSS balance
						const yssBalance = DEPOSIT_AMOUNT_A.mul(
							await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)
						).div(
							D_18
						).add(
							DEPOSIT_AMOUNT_B.mul(
								await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)
							).div(
								D_18
							)
						);


						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(yssBalance);
					}
				);

				it(
					"[50/50] Should issue strategy ERC20 tokens upon utilized ERC20 deposit..",
					async () =>
					{
						const [OWNER] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
								[mockERC20A.address, mockERC20B.address],
								[[true, true, FIFTY_PERCENT], [true, true, FIFTY_PERCENT]]
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();


						const DEPOSIT_AMOUNT_A = ethers.utils.parseUnits("1", 18);
						const DEPOSIT_AMOUNT_B = ethers.utils.parseUnits("1", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);
						await mockERC20B.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_B);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_A, DEPOSIT_AMOUNT_B])
						).to.not.be.reverted;

						// [calculate] YSS balance
						const yssBalance = DEPOSIT_AMOUNT_A.mul(
							await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)
						).div(
							D_18
						).add(
							DEPOSIT_AMOUNT_B.mul(
								await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)
							).div(
								D_18
							)
						);

						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(yssBalance);
					}
				);

				it(
					"[75/25] Should revert if invalid utilizedERC20Amounts passed..",
					async () =>
					{
						// Initialize strategy with mock ERC20
						await expect(
							await yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
								[mockERC20A.address, mockERC20B.address],
								[[true, true, SEVENTY_FIVE_PERCENT], [true, true, TWENTY_FIVE_PERCENT]]
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();


						const DEPOSIT_AMOUNT_A = ethers.utils.parseUnits(".5", 18);
						const DEPOSIT_AMOUNT_B = ethers.utils.parseUnits(".25", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);
						await mockERC20B.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_A, DEPOSIT_AMOUNT_B])
						).to.be.revertedWith(ERR0R_INVALID_UTILIZEDERC20AMOUNT);
					}
				);

				it(
					"[75/25] Should be able to deposit ERC20s into strategy interactor..",
					async () =>
					{
						const [OWNER] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							await yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
								[mockERC20A.address, mockERC20B.address],
								[[true, true, SEVENTY_FIVE_PERCENT], [true, true, TWENTY_FIVE_PERCENT]]
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();


						const DEPOSIT_AMOUNT_A = ethers.utils.parseUnits("1.5", 18);
						const DEPOSIT_AMOUNT_B = ethers.utils.parseUnits(".5", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);
						await mockERC20B.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_B);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_A, DEPOSIT_AMOUNT_B])
						).to.not.be.reverted;

						expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(DEPOSIT_AMOUNT_A);
						expect(await mockERC20B.balanceOf(strategyInteractorDummy.address)).to.be.equal(DEPOSIT_AMOUNT_B);

						// [calculate] YSS balance = (a * p(a)) / (1e18 + (b * p(b) / 1e18))
						const yssBalance = DEPOSIT_AMOUNT_A.mul(
							await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)
						).div(
							D_18
						).add(
							DEPOSIT_AMOUNT_B.mul(
								await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)
							).div(
								D_18
							)
						);

						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(yssBalance);
					}
				);

				it(
					"[75/25] Should issue strategy ERC20 tokens upon utilized ERC20 deposit..",
					async () =>
					{
						const [OWNER] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
								[mockERC20A.address, mockERC20B.address],
								[[true, true, SEVENTY_FIVE_PERCENT], [true, true, TWENTY_FIVE_PERCENT]]
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();


						const DEPOSIT_AMOUNT_A = ethers.utils.parseUnits(".75", 18);
						const DEPOSIT_AMOUNT_B = ethers.utils.parseUnits(".25", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);
						await mockERC20B.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_B);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_A, DEPOSIT_AMOUNT_B])
						).to.not.be.reverted;

						// [calculate] YSS balance
						const yssBalance = DEPOSIT_AMOUNT_A.mul(
							await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)
						).div(
							D_18
						).add(
							DEPOSIT_AMOUNT_B.mul(
								await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)
							).div(
								D_18
							)
						);

						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(yssBalance);
					}
				);
			});

			describe("[DECIMALS = 6]", async () =>
			{
				it(
					"[75/25] Should revert if invalid utilizedERC20Amounts passed..",
					async () =>
					{
						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
								[mockERC20A.address, mockERC206.address],
								[[true, true, SEVENTY_FIVE_PERCENT], [true, true, TWENTY_FIVE_PERCENT]]
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();


						const DEPOSIT_AMOUNT_A = ethers.utils.parseUnits(".5", 18);
						const DEPOSIT_AMOUNT_6 = ethers.utils.parseUnits(".25", 6);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);
						await mockERC206.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_6);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_A, DEPOSIT_AMOUNT_6])
						).to.be.revertedWith(ERR0R_INVALID_UTILIZEDERC20AMOUNT);
					}
				);

				it(
					"[75/25] Should be able to deposit ERC20s into strategy interactor..",
					async () =>
					{
						const [OWNER] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
								[mockERC20A.address, mockERC206.address],
								[[true, true, SEVENTY_FIVE_PERCENT], [true, true, TWENTY_FIVE_PERCENT]]
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();


						const DEPOSIT_AMOUNT_A = ethers.utils.parseUnits(".75", 18);
						const DEPOSIT_AMOUNT_6 = ethers.utils.parseUnits(".25", 6);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);
						await mockERC206.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_6);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_A, DEPOSIT_AMOUNT_6])
						).to.not.be.reverted;

						expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(
							DEPOSIT_AMOUNT_A
						);
						expect(await mockERC206.balanceOf(strategyInteractorDummy.address)).to.be.equal(
							DEPOSIT_AMOUNT_6
						);

						// [calculate] YSS balance
						const yssBalance = DEPOSIT_AMOUNT_A.add(
							// Convert to base 18 with 10**12
							DEPOSIT_AMOUNT_6.mul(ethers.BigNumber.from("1000000000000"))
						).mul(
							await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)
						).div(
							D_18
						);

						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(yssBalance);
					}
				);
			});
		});
	});
});
