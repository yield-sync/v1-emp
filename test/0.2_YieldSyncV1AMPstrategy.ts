const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

const ERROR_ETH_FEED_NOT_SET = "address(yieldSyncV1EMPETHValueFeed) == address(0)";
const ERROR_STRATEGY_NOT_SET = "address(yieldSyncV1EMPStrategyInteractor) == address(0)";
const ERROR_WITHDRAW_NOT_OPEN = "!utilizedERC20WithdrawOpen";
const ERROR_INVALID_BALANCE = "balanceOf(msg.sender) < _tokenAmount";

const HUNDRED_PERCENT = ethers.utils.parseUnits('1', 18);
const FIFTY_PERCENT = ethers.utils.parseUnits('.5', 18);
const TWENTY_FIVE_PERCENT = ethers.utils.parseUnits('.25', 18);
const SEVENTY_FIVE_PERCENT = ethers.utils.parseUnits('.75', 18);


describe("[0.2] YieldSyncV1EMPStrategy.sol - Withdraw", async () =>
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


	describe("function utilizedERC20Withdraw()", async () =>
	{
		describe("Prereqs", async () =>
		{
			it(
				"[modifier] Should revert if ETH FEED is not set..",
				async () =>
				{
					await expect(yieldSyncV1EMPStrategy.utilizedERC20Withdraw(0)).to.be.rejectedWith(
						ERROR_ETH_FEED_NOT_SET
					);
				}
			);

			it(
				"[modifier] Should revert if strategy is not set..",
				async () =>
				{
					await expect(
						yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
					).to.not.be.reverted;

					await expect(yieldSyncV1EMPStrategy.utilizedERC20Withdraw(0)).to.be.rejectedWith(
						ERROR_STRATEGY_NOT_SET
					);
				}
			);

			it(
				"Should revert if withdrawals is not open..",
				async () =>
				{
					const [OWNER] = await ethers.getSigners();

					// Initialize strategy with mock ERC20
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
							[mockERC20A.address],
							[[true, false, HUNDRED_PERCENT]],
						)
					).to.not.be.reverted;

					await expect(
						yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
					).to.not.be.reverted;

					await expect(
						yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
					).to.not.be.reverted;

					await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();

					const STRAT_TOTAL_SUPPLY = await yieldSyncV1EMPStrategy.totalSupply();
					const OWNER_MOCK_A_BALANCE_B4 = await mockERC20A.balanceOf(OWNER.address);

					const DEPOSIT_AMOUNT = ethers.utils.parseUnits("1", 18);

					// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
					await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT);

					// Deposit mockERC20A tokens into the strategy
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT])
					).to.not.be.reverted;

					const OWNER_MOCK_A_BALANCE_AFTER = await mockERC20A.balanceOf(OWNER.address);

					// Check that the balance remains less than original
					expect(OWNER_MOCK_A_BALANCE_AFTER).to.be.lessThan(OWNER_MOCK_A_BALANCE_B4);

					// mockERC20A BalanceOf strategy interactor should equal to deposit amount
					expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(
						DEPOSIT_AMOUNT
					);

					// Strategy totalSupply has increased (b4 should be 0)
					expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.greaterThan(STRAT_TOTAL_SUPPLY);

					// Strategy BalanceOf OWNER should be newly minted tokens (Current Supply - B4 supply)
					expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
						(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).sub(STRAT_TOTAL_SUPPLY)
					);

					// [main-test] Withdraw ERC20 tokens into the strategy
					await expect(yieldSyncV1EMPStrategy.utilizedERC20Withdraw(0)).to.be.rejectedWith(
						ERROR_WITHDRAW_NOT_OPEN
					);
				}
			);
		});

		describe("[SINGLE ERC20]", async () =>
		{
			describe("[DECIMALS = 18]", async () =>
			{
				it(
					"[100] Should fail to proccess withdraw request if token balance is not enough..",
					async () =>
					{
						const [OWNER] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
								[mockERC20A.address],
								[[true, false, HUNDRED_PERCENT]],
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


						const STRAT_TOTAL_SUPPLY_B4 = await yieldSyncV1EMPStrategy.totalSupply();
						const OWNER_MOCK_A_BALANCE_B4 = await mockERC20A.balanceOf(OWNER.address);

						const DEPOSIT_AMOUNT = ethers.utils.parseUnits("1", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT);

						// Deposit mockERC20A tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT])
						).to.not.be.reverted;

						const OWNERMockERC20ABalanceAfterDeposit = await mockERC20A.balanceOf(OWNER.address);

						// Check that the balance remains less than original
						expect(OWNERMockERC20ABalanceAfterDeposit).to.be.lessThan(OWNER_MOCK_A_BALANCE_B4);

						// mockERC20A BalanceOf strategy interactor should equal to deposit amount
						expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(
							DEPOSIT_AMOUNT
						);

						// Strategy totalSupply has increased (b4 should be 0)
						expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.greaterThan(STRAT_TOTAL_SUPPLY_B4);

						// Strategy BalanceOf OWNER should be newly minted tokens (Current Supply - B4 supply)
						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
							(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).sub(STRAT_TOTAL_SUPPLY_B4)
						);

						// [main-test] Withdraw ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Withdraw(
								(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).add(
									await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)
								)
							)
						).to.be.revertedWith(ERROR_INVALID_BALANCE);
					}
				);

				it(
					"[100] Should fail to return ERC20 if purpose.withdraw != true..",
					async () =>
					{
						const [OWNER] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
								[mockERC20A.address],
								[[true, false, HUNDRED_PERCENT]],
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


						const STRAT_TOTAL_SUPPLY_B4 = await yieldSyncV1EMPStrategy.totalSupply();
						const OWNER_MOCK_A_BALANCE_B4 = await mockERC20A.balanceOf(OWNER.address);

						const DEPOSIT_AMOUNT = ethers.utils.parseUnits("1", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT);

						// Deposit mockERC20A tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT])
						).to.not.be.reverted;

						const OWNERMockERC20ABalanceAfterDeposit = await mockERC20A.balanceOf(OWNER.address);

						// Check that the balance remains less than original
						expect(OWNERMockERC20ABalanceAfterDeposit).to.be.lessThan(OWNER_MOCK_A_BALANCE_B4);

						// mockERC20A BalanceOf strategy interactor should equal to deposit amount
						expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(
							DEPOSIT_AMOUNT
						);

						// Strategy totalSupply has increased (b4 should be 0)
						expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.greaterThan(STRAT_TOTAL_SUPPLY_B4);

						// Strategy BalanceOf OWNER should be newly minted tokens (Current Supply - B4 supply)
						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
							(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).sub(STRAT_TOTAL_SUPPLY_B4)
						);

						// [main-test] Withdraw ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Withdraw(
								await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)
							)
						).to.be.not.reverted;

						// Unchanged balance of strategy interactor
						expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(
							DEPOSIT_AMOUNT
						);

						// Strategy token burned
						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(0);

						// Supply put back to original
						expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(STRAT_TOTAL_SUPPLY_B4);

						// Check that the balance remains less than original
						expect(await mockERC20A.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(
							OWNERMockERC20ABalanceAfterDeposit
						);

						// Check that the balance remains less than original
						expect(await mockERC20A.balanceOf(OWNER.address)).to.be.lessThan(OWNER_MOCK_A_BALANCE_B4);
					}
				);

				it(
					"[100] Should allow caller to burn ERC20 and cash out..",
					async () =>
					{
						const [OWNER] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
								[mockERC20A.address],
								[[true, true, HUNDRED_PERCENT]],
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


						const STRAT_TOTAL_SUPPLY_B4 = await yieldSyncV1EMPStrategy.totalSupply();

						const STRAT_MOCK_A_BALANCE_B4 = await mockERC20A.balanceOf(strategyInteractorDummy.address);

						const OWNER_MOCK_A_BALANCE_B4 = await mockERC20A.balanceOf(OWNER.address);

						const DEPOSIT_AMOUNT = ethers.utils.parseUnits("1", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT);

						// Deposit mockERC20A tokens into the strategy
						yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT])

						// mockERC20A BalanceOf strategy interactor should equal to deposit amount
						expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(
							STRAT_MOCK_A_BALANCE_B4.add(DEPOSIT_AMOUNT)
						);

						// Strategy totalSupply has increased
						expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.greaterThan(STRAT_TOTAL_SUPPLY_B4);

						// Strategy BalanceOf OWNER should be newly minted tokens (Current Supply - B4 supply)
						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
							(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).sub(STRAT_TOTAL_SUPPLY_B4)
						);

						// [main-test] Withdraw ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Withdraw(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address))
						).to.be.not.reverted;

						// Strategy token burned
						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
							STRAT_MOCK_A_BALANCE_B4
						);

						// Supply put back to original
						expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(STRAT_TOTAL_SUPPLY_B4);

						// Check that the balance been returned to original or greater
						expect(await mockERC20A.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(OWNER_MOCK_A_BALANCE_B4);
					}
				);
			});

			describe("[DECIMALS = 6]", async () =>
			{
				it(
					"[100] Should allow caller to burn ERC20 and cash out..",
					async () =>
					{
						const [OWNER] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
								[mockERC206.address],
								[[true, true, HUNDRED_PERCENT]],
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


						const STRAT_TOTAL_SUPPLY_B4 = await yieldSyncV1EMPStrategy.totalSupply();

						const STRAT_MOCK_6_BALANCE_B4 = await mockERC206.balanceOf(strategyInteractorDummy.address);

						const OWNER_MOCK_6_BALANCE_B4 = await mockERC206.balanceOf(OWNER.address);

						const DEPOSIT_AMOUNT_6 = ethers.utils.parseUnits("1", 6);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC206.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_6);

						// Deposit mockERC206 tokens into the strategy
						yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_6])

						// mockERC206 BalanceOf strategy interactor should equal to deposit amount
						expect(await mockERC206.balanceOf(strategyInteractorDummy.address)).to.be.equal(
							STRAT_MOCK_6_BALANCE_B4.add(DEPOSIT_AMOUNT_6)
						);

						// Strategy totalSupply has increased
						expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.greaterThan(STRAT_TOTAL_SUPPLY_B4);

						// Strategy BalanceOf OWNER should be newly minted tokens (Current Supply - B4 supply)
						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
							(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).sub(STRAT_TOTAL_SUPPLY_B4)
						);

						// [main-test] Withdraw ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Withdraw(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address))
						).to.be.not.reverted;

						// Strategy token burned
						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
							STRAT_MOCK_6_BALANCE_B4
						);

						// Supply put back to original
						expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(STRAT_TOTAL_SUPPLY_B4);

						// Check that the balance been returned to original or greater
						expect(await mockERC206.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(OWNER_MOCK_6_BALANCE_B4);
					}
				);
			});
		});

		describe("[MULTIPLE ERC20]", async () =>
		{
			describe("[DECIMALS = 18]", async () =>
			{
				it(
					"[50/50] Should allow caller to burn ERC20 and cash out..",
					async () =>
					{
						const [OWNER] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
								[mockERC20A.address, mockERC20B.address],
								[[true, true, FIFTY_PERCENT], [true, true, FIFTY_PERCENT],],

							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


						const STRAT_TOTAL_SUPPLY_B4 = await yieldSyncV1EMPStrategy.totalSupply();

						const STRAT_MOCK_A_BALANCE_B4 = await mockERC20A.balanceOf(strategyInteractorDummy.address);
						const STRAT_MOCK_B_BALANCE_B4 = await mockERC20B.balanceOf(strategyInteractorDummy.address);

						const OWNER_MOCK_A_BALANCE_B4 = await mockERC20A.balanceOf(OWNER.address);
						const OWNER_MOCK_B_BALANCE_B4 = await mockERC20B.balanceOf(OWNER.address);

						const DEPOSIT_AMOUNT = ethers.utils.parseUnits("1", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT);
						await mockERC20B.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT);

						// Deposit mockERC20A tokens into the strategy
						yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT, DEPOSIT_AMOUNT])

						// mockERC20A BalanceOf strategy interactor should equal to deposit amount
						expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(
							STRAT_MOCK_A_BALANCE_B4.add(DEPOSIT_AMOUNT)
						);

						// mockERC20B BalanceOf strategy interactor should equal to deposit amount
						expect(await mockERC20B.balanceOf(strategyInteractorDummy.address)).to.be.equal(
							STRAT_MOCK_B_BALANCE_B4.add(DEPOSIT_AMOUNT)
						);

						// Strategy totalSupply has increased
						expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.greaterThan(STRAT_TOTAL_SUPPLY_B4);

						// Strategy BalanceOf OWNER should be newly minted tokens (Current Supply - B4 supply)
						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
							(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).sub(STRAT_TOTAL_SUPPLY_B4)
						);

						// [main-test] Withdraw ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Withdraw(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address))
						).to.be.not.reverted;


						// Strategy token burned
						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
							STRAT_MOCK_A_BALANCE_B4
						);

						// Supply put back to original
						expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(STRAT_TOTAL_SUPPLY_B4);

						// Check that the balance been returned to original or greater
						expect(await mockERC20A.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(OWNER_MOCK_A_BALANCE_B4);

						// Check that the balance been returned to original or greater
						expect(await mockERC20B.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(OWNER_MOCK_B_BALANCE_B4);
					}
				);

				it(
					"[75/25] Should allow caller to burn ERC20 and cash out..",
					async () =>
					{
						const [OWNER] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
								[mockERC20A.address, mockERC20B.address],
								[[true, true, SEVENTY_FIVE_PERCENT], [true, true, TWENTY_FIVE_PERCENT]],
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


						const STRAT_TOTAL_SUPPLY_B4 = await yieldSyncV1EMPStrategy.totalSupply();

						const STRAT_MOCK_A_BALANCE_B4 = await mockERC20A.balanceOf(strategyInteractorDummy.address);
						const STRAT_MOCK_B_BALANCE_B4 = await mockERC20B.balanceOf(strategyInteractorDummy.address);

						const OWNER_MOCK_A_BALANCE_B4 = await mockERC20A.balanceOf(OWNER.address);
						const OWNER_MOCK_B_BALANCE_B4 = await mockERC20B.balanceOf(OWNER.address);

						const DEPOSIT_AMOUNT_A = ethers.utils.parseUnits(".75", 18);
						const DEPOSIT_AMOUNT_B = ethers.utils.parseUnits(".25", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);
						await mockERC20B.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_B);

						// Deposit mockERC20A tokens into the strategy
						yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_A, DEPOSIT_AMOUNT_B])

						// mockERC20A BalanceOf strategy interactor should equal to deposit amount
						expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(
							STRAT_MOCK_A_BALANCE_B4.add(DEPOSIT_AMOUNT_A)
						);

						// mockERC20B BalanceOf strategy interactor should equal to deposit amount
						expect(await mockERC20B.balanceOf(strategyInteractorDummy.address)).to.be.equal(
							STRAT_MOCK_B_BALANCE_B4.add(DEPOSIT_AMOUNT_B)
						);

						// Strategy totalSupply has increased
						expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.greaterThan(STRAT_TOTAL_SUPPLY_B4);

						// Strategy BalanceOf OWNER should be newly minted tokens (Current Supply - B4 supply)
						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
							(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).sub(STRAT_TOTAL_SUPPLY_B4)
						);

						// [main-test] Withdraw ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Withdraw(
								await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)
							)
						).to.be.not.reverted;

						// Strategy token burned
						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(STRAT_MOCK_A_BALANCE_B4);

						// Supply put back to original
						expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(STRAT_TOTAL_SUPPLY_B4);

						// Check that the balance been returned to original or greater
						expect(await mockERC20A.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(OWNER_MOCK_A_BALANCE_B4);

						// Check that the balance been returned to original or greater
						expect(await mockERC20B.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(OWNER_MOCK_B_BALANCE_B4);
					}
				);
			});

			describe("[DECIMALS = 6]", async () =>
			{
				it(
					"[50/50] Should allow caller to burn ERC20 and cash out..",
					async () =>
					{
						const [OWNER] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
								[mockERC20A.address, mockERC206.address],
								[[true, true, FIFTY_PERCENT], [true, true, FIFTY_PERCENT]],
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


						const STRAT_TOTAL_SUPPLY_B4 = await yieldSyncV1EMPStrategy.totalSupply();

						const STRAT_MOCK_A_BALANCE_B4 = await mockERC20A.balanceOf(strategyInteractorDummy.address);
						const STRAT_MOCK_6_BALANCE_B4 = await mockERC206.balanceOf(strategyInteractorDummy.address);

						const OWNER_MOCK_A_BALANCE_B4 = await mockERC20A.balanceOf(OWNER.address);
						const OWNER_MOCK_6_BALANCE_B4 = await mockERC206.balanceOf(OWNER.address);

						const DEPOSIT_AMOUNT_A = ethers.utils.parseUnits("1", 18);
						const DEPOSIT_AMOUNT_6 = ethers.utils.parseUnits("1", 6);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);
						await mockERC206.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_6);

						// Deposit mockERC20A tokens into the strategy
						yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_A, DEPOSIT_AMOUNT_6])

						// mockERC20A BalanceOf strategy interactor should equal to deposit amount
						expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(
							STRAT_MOCK_A_BALANCE_B4.add(DEPOSIT_AMOUNT_A)
						);

						// mockERC206 BalanceOf strategy interactor should equal to deposit amount
						expect(await mockERC206.balanceOf(strategyInteractorDummy.address)).to.be.equal(
							STRAT_MOCK_6_BALANCE_B4.add(DEPOSIT_AMOUNT_6)
						);

						// Strategy totalSupply has increased
						expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.greaterThan(STRAT_TOTAL_SUPPLY_B4);

						// Strategy BalanceOf OWNER should be newly minted tokens (Current Supply - B4 supply)
						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
							(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).sub(STRAT_TOTAL_SUPPLY_B4)
						);

						// [main-test] Withdraw ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Withdraw(
								await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)
							)
						).to.be.not.reverted;


						// Strategy token burned
						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
							STRAT_MOCK_A_BALANCE_B4
						);

						// Supply put back to original
						expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(STRAT_TOTAL_SUPPLY_B4);

						// Check that the balance been returned to original or greater
						expect(await mockERC20A.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(
							OWNER_MOCK_A_BALANCE_B4
						);

						// Check that the balance been returned to original or greater
						expect(await mockERC206.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(
							OWNER_MOCK_6_BALANCE_B4
						);
					}
				);

				it(
					"[75/25] Should allow caller to burn ERC20 and cash out..",
					async () =>
					{
						const [OWNER] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
								[mockERC20A.address, mockERC206.address],
								[[true, true, SEVENTY_FIVE_PERCENT], [true, true, TWENTY_FIVE_PERCENT]],
							)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
						).to.not.be.reverted;

						await expect(
							yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();

						const STRAT_TOTAL_SUPPLY_B4 = await yieldSyncV1EMPStrategy.totalSupply();

						const STRAT_MOCK_A_BALANCE_B4 = await mockERC20A.balanceOf(strategyInteractorDummy.address);
						const STRAT_MOCK_6_BALANCE_B4 = await mockERC206.balanceOf(strategyInteractorDummy.address);

						const OWNER_MOCK_A_BALANCE_B4 = await mockERC20A.balanceOf(OWNER.address);
						const OWNER_MOCK_6_BALANCE_B4 = await mockERC206.balanceOf(OWNER.address);

						const DEPOSIT_AMOUNT_A = ethers.utils.parseUnits(".75", 18);
						const DEPOSIT_AMOUNT_6 = ethers.utils.parseUnits(".25", 6);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
						await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);
						await mockERC206.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_6);

						// Deposit mockERC20A tokens into the strategy
						yieldSyncV1EMPStrategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_A, DEPOSIT_AMOUNT_6])

						// mockERC20A BalanceOf strategy interactor should equal to deposit amount
						expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(
							STRAT_MOCK_A_BALANCE_B4.add(DEPOSIT_AMOUNT_A)
						);

						// mockERC206 BalanceOf strategy interactor should equal to deposit amount
						expect(await mockERC206.balanceOf(strategyInteractorDummy.address)).to.be.equal(
							STRAT_MOCK_6_BALANCE_B4.add(DEPOSIT_AMOUNT_6)
						);

						// Strategy totalSupply has increased
						expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.greaterThan(STRAT_TOTAL_SUPPLY_B4);

						// Strategy BalanceOf OWNER should be newly minted tokens (Current Supply - B4 supply)
						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
							(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).sub(STRAT_TOTAL_SUPPLY_B4)
						);

						// [main-test] Withdraw ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Withdraw(
								await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)
							)
						).to.be.not.reverted;


						// Strategy token burned
						expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
							STRAT_MOCK_A_BALANCE_B4
						);

						// Supply put back to original
						expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(STRAT_TOTAL_SUPPLY_B4);

						// Check that the balance been returned to original or greater
						expect(await mockERC20A.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(
							OWNER_MOCK_A_BALANCE_B4
						);

						// Check that the balance been returned to original or greater
						expect(await mockERC206.balanceOf(OWNER.address)).to.be.greaterThanOrEqual(
							OWNER_MOCK_6_BALANCE_B4
						);
					}
				);
			});
		});
	});
});
