const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

const HUNDRED_PERCENT = ethers.utils.parseUnits('1', 18);
const FIFTY_PERCENT = ethers.utils.parseUnits('.5', 18);
const TWENTY_FIVE_PERCENT = ethers.utils.parseUnits('.25', 18);
const SEVENTY_FIVE_PERCENT = ethers.utils.parseUnits('.75', 18);


describe("[0.1] YieldSyncV1VaultDeployer.sol - Withdraw", async () => {
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC206: Contract;
	let priceFeedDummy: Contract;
	let strategyInteractorDummy: Contract;
	let yieldSyncV1EMPStrategy: Contract;

	beforeEach("[beforeEach] Set up contracts..", async () => {
		const [owner] = await ethers.getSigners();

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const MockERC206: ContractFactory = await ethers.getContractFactory("MockERC206");
		const PriceFeedDummy: ContractFactory = await ethers.getContractFactory("PriceFeedDummy");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");
		const YieldSyncV1EMPStrategy: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategy");

		mockERC20A = await (await MockERC20.deploy()).deployed();
		mockERC20B = await (await MockERC20.deploy()).deployed();
		mockERC206 = await (await MockERC206.deploy()).deployed();
		priceFeedDummy = await (await PriceFeedDummy.deploy()).deployed();
		strategyInteractorDummy = await (await StrategyInteractorDummy.deploy()).deployed();
		yieldSyncV1EMPStrategy = await (await YieldSyncV1EMPStrategy.deploy(owner.address, "Exampe", "EX")).deployed();
	});

	describe("function utilizedERC20Withdraw()", async () => {
		it(
			"[100] Should allow caller to burn ERC20 and cash out..",
			async () => {
				const [owner] = await ethers.getSigners();

				// Initialize strategy with mock ERC20
				await expect(
					yieldSyncV1EMPStrategy.initializeStrategy(
						priceFeedDummy.address,
						strategyInteractorDummy.address,
						[mockERC20A.address],
						[HUNDRED_PERCENT]
					)
				).to.not.be.reverted;

				await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
				await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


				const strategyTotalSupplyBefore = await yieldSyncV1EMPStrategy.totalSupply();

				const strategyInteractorMockERC20ABalanceBefore = await mockERC20A.balanceOf(
					strategyInteractorDummy.address
				);

				const ownerMockERC20ABalanceBefore = await mockERC20A.balanceOf(owner.address);

				const mockERC20AdepositAmount = ethers.utils.parseUnits("1", 18);

				// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
				await mockERC20A.approve(strategyInteractorDummy.address, mockERC20AdepositAmount);

				// Deposit mockERC20A tokens into the strategy
				yieldSyncV1EMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount])

				// mockERC20A BalanceOf strategy interactor should equal to deposit amount
				expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(
					strategyInteractorMockERC20ABalanceBefore.add(mockERC20AdepositAmount)
				);

				// Strategy totalSupply has increased
				expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.greaterThan(strategyTotalSupplyBefore);

				// Strategy BalanceOf owner should be newly minted tokens (Current Supply - Before supply)
				expect(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).to.be.equal(
					(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).sub(strategyTotalSupplyBefore)
				);

				// [main-test] Withdraw ERC20 tokens into the strategy
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Withdraw(await yieldSyncV1EMPStrategy.balanceOf(owner.address))
				).to.be.not.reverted;

				// Strategy token burned
				expect(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).to.be.equal(
					strategyInteractorMockERC20ABalanceBefore
				);

				// Supply put back to original
				expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(strategyTotalSupplyBefore);

				// Check that the balance been returned to original or greater
				expect(await mockERC20A.balanceOf(owner.address)).to.be.greaterThanOrEqual(ownerMockERC20ABalanceBefore);
			}
		);

		describe("ERC20 with 6 decimals", async () => {
			it(
				"[100] Should allow caller to burn ERC20 and cash out..",
				async () => {
					const [owner] = await ethers.getSigners();

					// Initialize strategy with mock ERC20
					await expect(
						yieldSyncV1EMPStrategy.initializeStrategy(
							priceFeedDummy.address,
							strategyInteractorDummy.address,
							[mockERC206.address],
							[HUNDRED_PERCENT]
						)
					).to.not.be.reverted;

					await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
					await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


					const strategyTotalSupplyBefore = await yieldSyncV1EMPStrategy.totalSupply();

					const strategyInteractorMockERC206BalanceBefore = await mockERC206.balanceOf(
						strategyInteractorDummy.address
					);

					const ownerMockERC206BalanceBefore = await mockERC206.balanceOf(owner.address);

					const mockERC206depositAmount = ethers.utils.parseUnits("1", 6);

					// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
					await mockERC206.approve(strategyInteractorDummy.address, mockERC206depositAmount);

					// Deposit mockERC206 tokens into the strategy
					yieldSyncV1EMPStrategy.utilizedERC20Deposit([mockERC206depositAmount])

					// mockERC206 BalanceOf strategy interactor should equal to deposit amount
					expect(await mockERC206.balanceOf(strategyInteractorDummy.address)).to.be.equal(
						strategyInteractorMockERC206BalanceBefore.add(mockERC206depositAmount)
					);

					// Strategy totalSupply has increased
					expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.greaterThan(strategyTotalSupplyBefore);

					// Strategy BalanceOf owner should be newly minted tokens (Current Supply - Before supply)
					expect(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).to.be.equal(
						(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).sub(strategyTotalSupplyBefore)
					);

					// [main-test] Withdraw ERC20 tokens into the strategy
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Withdraw(await yieldSyncV1EMPStrategy.balanceOf(owner.address))
					).to.be.not.reverted;

					// Strategy token burned
					expect(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).to.be.equal(
						strategyInteractorMockERC206BalanceBefore
					);

					// Supply put back to original
					expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(strategyTotalSupplyBefore);

					// Check that the balance been returned to original or greater
					expect(await mockERC206.balanceOf(owner.address)).to.be.greaterThanOrEqual(ownerMockERC206BalanceBefore);
				}
			);
		});

		describe("MULTIPLE ERC20", async () => {
			it(
				"[50/50] Should allow caller to burn ERC20 and cash out..",
				async () => {
					const [owner] = await ethers.getSigners();

					// Initialize strategy with mock ERC20
					await expect(
						yieldSyncV1EMPStrategy.initializeStrategy(
							priceFeedDummy.address,
							strategyInteractorDummy.address,
							[mockERC20A.address, mockERC20B.address],
							[FIFTY_PERCENT, FIFTY_PERCENT]
						)
					).to.not.be.reverted;

					await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
					await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


					const strategyTotalSupplyBefore = await yieldSyncV1EMPStrategy.totalSupply();

					const strategyInteractorMockERC20ABalanceBefore = await mockERC20A.balanceOf(
						strategyInteractorDummy.address
					);

					const strategyInteractorMockERC20BBalanceBefore = await mockERC20B.balanceOf(
						strategyInteractorDummy.address
					);

					const ownerMockERC20ABalanceBefore = await mockERC20A.balanceOf(owner.address);
					const ownerMockERC20BBalanceBefore = await mockERC20B.balanceOf(owner.address);

					const mockERC20DepositAmount = ethers.utils.parseUnits("1", 18);

					// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
					await mockERC20A.approve(strategyInteractorDummy.address, mockERC20DepositAmount);
					await mockERC20B.approve(strategyInteractorDummy.address, mockERC20DepositAmount);

					// Deposit mockERC20A tokens into the strategy
					yieldSyncV1EMPStrategy.utilizedERC20Deposit([mockERC20DepositAmount, mockERC20DepositAmount])

					// mockERC20A BalanceOf strategy interactor should equal to deposit amount
					expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(
						strategyInteractorMockERC20ABalanceBefore.add(mockERC20DepositAmount)
					);

					// mockERC20B BalanceOf strategy interactor should equal to deposit amount
					expect(await mockERC20B.balanceOf(strategyInteractorDummy.address)).to.be.equal(
						strategyInteractorMockERC20BBalanceBefore.add(mockERC20DepositAmount)
					);

					// Strategy totalSupply has increased
					expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.greaterThan(strategyTotalSupplyBefore);

					// Strategy BalanceOf owner should be newly minted tokens (Current Supply - Before supply)
					expect(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).to.be.equal(
						(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).sub(strategyTotalSupplyBefore)
					);

					// [main-test] Withdraw ERC20 tokens into the strategy
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Withdraw(await yieldSyncV1EMPStrategy.balanceOf(owner.address))
					).to.be.not.reverted;


					// Strategy token burned
					expect(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).to.be.equal(
						strategyInteractorMockERC20ABalanceBefore
					);

					// Supply put back to original
					expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(strategyTotalSupplyBefore);

					// Check that the balance been returned to original or greater
					expect(await mockERC20A.balanceOf(owner.address)).to.be.greaterThanOrEqual(ownerMockERC20ABalanceBefore);

					// Check that the balance been returned to original or greater
					expect(await mockERC20B.balanceOf(owner.address)).to.be.greaterThanOrEqual(ownerMockERC20BBalanceBefore);
				}
			);

			it(
				"[75/25] Should allow caller to burn ERC20 and cash out..",
				async () => {
					const [owner] = await ethers.getSigners();

					// Initialize strategy with mock ERC20
					await expect(
						yieldSyncV1EMPStrategy.initializeStrategy(
							priceFeedDummy.address,
							strategyInteractorDummy.address,
							[mockERC20A.address, mockERC20B.address],
							[SEVENTY_FIVE_PERCENT, TWENTY_FIVE_PERCENT]
						)
					).to.not.be.reverted;

					await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
					await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


					const strategyTotalSupplyBefore = await yieldSyncV1EMPStrategy.totalSupply();

					const strategyInteractorMockERC20ABalanceBefore = await mockERC20A.balanceOf(
						strategyInteractorDummy.address
					);

					const strategyInteractorMockERC20BBalanceBefore = await mockERC20B.balanceOf(
						strategyInteractorDummy.address
					);

					const ownerMockERC20ABalanceBefore = await mockERC20A.balanceOf(owner.address);
					const ownerMockERC20BBalanceBefore = await mockERC20B.balanceOf(owner.address);

					const mockERC20ADepositAmount = ethers.utils.parseUnits(".75", 18);
					const mockERC20BDepositAmount = ethers.utils.parseUnits(".25", 18);

					// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
					await mockERC20A.approve(strategyInteractorDummy.address, mockERC20ADepositAmount);
					await mockERC20B.approve(strategyInteractorDummy.address, mockERC20BDepositAmount);

					// Deposit mockERC20A tokens into the strategy
					yieldSyncV1EMPStrategy.utilizedERC20Deposit([mockERC20ADepositAmount, mockERC20BDepositAmount])

					// mockERC20A BalanceOf strategy interactor should equal to deposit amount
					expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(
						strategyInteractorMockERC20ABalanceBefore.add(mockERC20ADepositAmount)
					);

					// mockERC20B BalanceOf strategy interactor should equal to deposit amount
					expect(await mockERC20B.balanceOf(strategyInteractorDummy.address)).to.be.equal(
						strategyInteractorMockERC20BBalanceBefore.add(mockERC20BDepositAmount)
					);

					// Strategy totalSupply has increased
					expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.greaterThan(strategyTotalSupplyBefore);

					// Strategy BalanceOf owner should be newly minted tokens (Current Supply - Before supply)
					expect(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).to.be.equal(
						(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).sub(strategyTotalSupplyBefore)
					);

					// [main-test] Withdraw ERC20 tokens into the strategy
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Withdraw(await yieldSyncV1EMPStrategy.balanceOf(owner.address))
					).to.be.not.reverted;


					// Strategy token burned
					expect(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).to.be.equal(
						strategyInteractorMockERC20ABalanceBefore
					);

					// Supply put back to original
					expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(strategyTotalSupplyBefore);

					// Check that the balance been returned to original or greater
					expect(await mockERC20A.balanceOf(owner.address)).to.be.greaterThanOrEqual(ownerMockERC20ABalanceBefore);

					// Check that the balance been returned to original or greater
					expect(await mockERC20B.balanceOf(owner.address)).to.be.greaterThanOrEqual(ownerMockERC20BBalanceBefore);
				}
			);

			describe("ERC20 with 6 decimals", async () => {
				it(
					"[50/50] Should allow caller to burn ERC20 and cash out..",
					async () => {
						const [owner] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.initializeStrategy(
								priceFeedDummy.address,
								strategyInteractorDummy.address,
								[mockERC20A.address, mockERC206.address],
								[FIFTY_PERCENT, FIFTY_PERCENT]
							)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


						const strategyTotalSupplyBefore = await yieldSyncV1EMPStrategy.totalSupply();

						const strategyInteractorMockERC20ABalanceBefore = await mockERC20A.balanceOf(
							strategyInteractorDummy.address
						);

						const strategyInteractorMockERC206BalanceBefore = await mockERC206.balanceOf(
							strategyInteractorDummy.address
						);

						const ownerMockERC20ABalanceBefore = await mockERC20A.balanceOf(owner.address);
						const ownerMockERC206BalanceBefore = await mockERC206.balanceOf(owner.address);

						const mockERC20ADepositAmount = ethers.utils.parseUnits("1", 18);
						const mockERC206DepositAmount = ethers.utils.parseUnits("1", 6);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
						await mockERC20A.approve(strategyInteractorDummy.address, mockERC20ADepositAmount);
						await mockERC206.approve(strategyInteractorDummy.address, mockERC206DepositAmount);

						// Deposit mockERC20A tokens into the strategy
						yieldSyncV1EMPStrategy.utilizedERC20Deposit([mockERC20ADepositAmount, mockERC206DepositAmount])

						// mockERC20A BalanceOf strategy interactor should equal to deposit amount
						expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(
							strategyInteractorMockERC20ABalanceBefore.add(mockERC20ADepositAmount)
						);

						// mockERC206 BalanceOf strategy interactor should equal to deposit amount
						expect(await mockERC206.balanceOf(strategyInteractorDummy.address)).to.be.equal(
							strategyInteractorMockERC206BalanceBefore.add(mockERC206DepositAmount)
						);

						// Strategy totalSupply has increased
						expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.greaterThan(strategyTotalSupplyBefore);

						// Strategy BalanceOf owner should be newly minted tokens (Current Supply - Before supply)
						expect(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).to.be.equal(
							(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).sub(strategyTotalSupplyBefore)
						);

						// [main-test] Withdraw ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Withdraw(
								await yieldSyncV1EMPStrategy.balanceOf(owner.address)
							)
						).to.be.not.reverted;


						// Strategy token burned
						expect(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).to.be.equal(
							strategyInteractorMockERC20ABalanceBefore
						);

						// Supply put back to original
						expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(strategyTotalSupplyBefore);

						// Check that the balance been returned to original or greater
						expect(await mockERC20A.balanceOf(owner.address)).to.be.greaterThanOrEqual(
							ownerMockERC20ABalanceBefore
						);

						// Check that the balance been returned to original or greater
						expect(await mockERC206.balanceOf(owner.address)).to.be.greaterThanOrEqual(
							ownerMockERC206BalanceBefore
						);
					}
				);

				it(
					"[75/25] Should allow caller to burn ERC20 and cash out..",
					async () => {
						const [owner] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.initializeStrategy(
								priceFeedDummy.address,
								strategyInteractorDummy.address,
								[mockERC20A.address, mockERC206.address],
								[SEVENTY_FIVE_PERCENT, TWENTY_FIVE_PERCENT]
							)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


						const strategyTotalSupplyBefore = await yieldSyncV1EMPStrategy.totalSupply();

						const strategyInteractorMockERC20ABalanceBefore = await mockERC20A.balanceOf(
							strategyInteractorDummy.address
						);

						const strategyInteractorMockERC206BalanceBefore = await mockERC206.balanceOf(
							strategyInteractorDummy.address
						);

						const ownerMockERC20ABalanceBefore = await mockERC20A.balanceOf(owner.address);
						const ownerMockERC206BalanceBefore = await mockERC206.balanceOf(owner.address);

						const mockERC20ADepositAmount = ethers.utils.parseUnits(".75", 18);
						const mockERC206DepositAmount = ethers.utils.parseUnits(".25", 6);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
						await mockERC20A.approve(strategyInteractorDummy.address, mockERC20ADepositAmount);
						await mockERC206.approve(strategyInteractorDummy.address, mockERC206DepositAmount);

						// Deposit mockERC20A tokens into the strategy
						yieldSyncV1EMPStrategy.utilizedERC20Deposit([mockERC20ADepositAmount, mockERC206DepositAmount])

						// mockERC20A BalanceOf strategy interactor should equal to deposit amount
						expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(
							strategyInteractorMockERC20ABalanceBefore.add(mockERC20ADepositAmount)
						);

						// mockERC206 BalanceOf strategy interactor should equal to deposit amount
						expect(await mockERC206.balanceOf(strategyInteractorDummy.address)).to.be.equal(
							strategyInteractorMockERC206BalanceBefore.add(mockERC206DepositAmount)
						);

						// Strategy totalSupply has increased
						expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.greaterThan(strategyTotalSupplyBefore);

						// Strategy BalanceOf owner should be newly minted tokens (Current Supply - Before supply)
						expect(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).to.be.equal(
							(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).sub(strategyTotalSupplyBefore)
						);

						// [main-test] Withdraw ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Withdraw(
								await yieldSyncV1EMPStrategy.balanceOf(owner.address)
							)
						).to.be.not.reverted;


						// Strategy token burned
						expect(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).to.be.equal(
							strategyInteractorMockERC20ABalanceBefore
						);

						// Supply put back to original
						expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(strategyTotalSupplyBefore);

						// Check that the balance been returned to original or greater
						expect(await mockERC20A.balanceOf(owner.address)).to.be.greaterThanOrEqual(
							ownerMockERC20ABalanceBefore
						);

						// Check that the balance been returned to original or greater
						expect(await mockERC206.balanceOf(owner.address)).to.be.greaterThanOrEqual(
							ownerMockERC206BalanceBefore
						);
					}
				);
			});
		});
	});
});
