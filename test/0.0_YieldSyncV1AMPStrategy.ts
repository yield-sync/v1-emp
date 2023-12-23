const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

const ERROR_NOT_MANAGER = "manager != msg.sender";
const ERROR_INVALID_ALLOCATION = "_utilizedERC20AllocationTotal != ONE_HUNDRED_PERCENT";
const ERR0R_INVALID_UTILIZEDERC20AMOUNT = "!utilizedERC20AmountValid(_utilizedERC20Amount)";
const ERR0R_INVALID_UTILIZEDERC20AMOUNT_LENGTH = "_utilizedERC20.length != _utilizedERC20Amount.length";
const ERROR_STRATEGY_ALREADY_SET = "address(yieldSyncV1AMPStrategyInteractor) != address(0)";

const HUNDRED_PERCENT = ethers.utils.parseUnits('1', 18);
const FIFTY_PERCENT = ethers.utils.parseUnits('.5', 18);
const TWENTY_FIVE_PERCENT = ethers.utils.parseUnits('.25', 18);
const SEVENTY_FIVE_PERCENT = ethers.utils.parseUnits('.75', 18);


describe("[0.0] YieldSyncV1VaultDeployer.sol", async () => {
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let strategyInteractorBlank: Contract;
	let yieldSyncV1AMPStrategy: Contract;

	beforeEach("[beforeEach] Set up contracts..", async () => {
		const [owner] = await ethers.getSigners();

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const StrategyInteractorBlank: ContractFactory = await ethers.getContractFactory("StrategyInteractorBlank");
		const YieldSyncV1AMPStrategy: ContractFactory = await ethers.getContractFactory("YieldSyncV1AMPStrategy");

		mockERC20A = await (await MockERC20.deploy()).deployed();
		mockERC20B = await (await MockERC20.deploy()).deployed();
		strategyInteractorBlank = await (await StrategyInteractorBlank.deploy()).deployed();
		yieldSyncV1AMPStrategy = await (await YieldSyncV1AMPStrategy.deploy(owner.address, "Exampe", "EX")).deployed();
	});

	describe("function initializeStrategy()", async () => {
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () => {
				const [, addr1] = await ethers.getSigners();

				await expect(
					yieldSyncV1AMPStrategy.connect(addr1).initializeStrategy(
						strategyInteractorBlank.address,
						[mockERC20A.address],
						[HUNDRED_PERCENT]
					)
				).to.be.rejectedWith(ERROR_NOT_MANAGER);
			}
		);

		it(
			"Should revert when invalid allocation passed..",
			async () => {
				await expect(
					yieldSyncV1AMPStrategy.initializeStrategy(
						strategyInteractorBlank.address,
						[mockERC20A.address],
						[FIFTY_PERCENT]
					)
				).to.be.rejectedWith(ERROR_INVALID_ALLOCATION);
			}
		);

		it(
			"It should be able to set _strategy and _utilizedERC20..",
			async () => {
				// Initialize strategy with mock ERC20
				await expect(
					yieldSyncV1AMPStrategy.initializeStrategy(
						strategyInteractorBlank.address,
						[mockERC20A.address],
						[HUNDRED_PERCENT]
					)
				).to.not.be.reverted;

				expect(await yieldSyncV1AMPStrategy.yieldSyncV1AMPStrategyInteractor()).to.be.equal(
					strategyInteractorBlank.address
				);
				expect((await yieldSyncV1AMPStrategy.utilizedERC20()).length).to.be.equal(1);
				expect((await yieldSyncV1AMPStrategy.utilizedERC20())[0]).to.be.equal(mockERC20A.address);
				expect((await yieldSyncV1AMPStrategy.utilizedERC20Allocation())[0]).to.be.equal(HUNDRED_PERCENT);
			}
		);

		it(
			"It should be able only be able to set once..",
			async () => {
				// Initialize strategy with mock ERC20
				await expect(
					await yieldSyncV1AMPStrategy.initializeStrategy(
						strategyInteractorBlank.address,
						[mockERC20A.address],
						[HUNDRED_PERCENT]
					)
				).to.not.be.reverted;

				await expect(
					yieldSyncV1AMPStrategy.initializeStrategy(
						strategyInteractorBlank.address,
						[mockERC20A.address],
						[HUNDRED_PERCENT]
					)
				).to.be.rejectedWith(ERROR_STRATEGY_ALREADY_SET);
			}
		);


		describe("MULTIPLE ERC20", async () => {
			it(
				"It should be able to set multiple _utilizedERC20..",
				async () => {
					// Initialize strategy with mock ERC20
					await yieldSyncV1AMPStrategy.initializeStrategy(
						strategyInteractorBlank.address,
						[mockERC20A.address, mockERC20B.address],
						[FIFTY_PERCENT, FIFTY_PERCENT]
					);

					expect(await yieldSyncV1AMPStrategy.yieldSyncV1AMPStrategyInteractor()).to.be.equal(
						strategyInteractorBlank.address
					);
					expect((await yieldSyncV1AMPStrategy.utilizedERC20()).length).to.be.equal(2);
					expect((await yieldSyncV1AMPStrategy.utilizedERC20())[0]).to.be.equal(mockERC20A.address);
					expect((await yieldSyncV1AMPStrategy.utilizedERC20())[1]).to.be.equal(mockERC20B.address);
					expect((await yieldSyncV1AMPStrategy.utilizedERC20Allocation())[0]).to.be.equal(FIFTY_PERCENT);
					expect((await yieldSyncV1AMPStrategy.utilizedERC20Allocation())[1]).to.be.equal(FIFTY_PERCENT);
				}
			);

			it(
				"Should revert when invalid allocation passed..",
				async () => {
					await expect(
						yieldSyncV1AMPStrategy.initializeStrategy(
							strategyInteractorBlank.address,
							[mockERC20A.address, mockERC20B.address],
							[FIFTY_PERCENT, TWENTY_FIVE_PERCENT]
						)
					).to.be.rejectedWith(ERROR_INVALID_ALLOCATION);
				}
			);
		});
	});

	describe("function utilizedERC20AllocationSet()", async () => {
		it(
			"[MULTIPLE-ONLY] Should be able to update utilizedERC20Allocation..",
			async () => {
				// Initialize strategy with mock ERC20
				await yieldSyncV1AMPStrategy.initializeStrategy(
					strategyInteractorBlank.address,
					[mockERC20A.address, mockERC20B.address],
					[FIFTY_PERCENT, FIFTY_PERCENT]
				);

				const mockERC20AdepositAmount = ethers.utils.parseUnits("1", 18);

				// Approve the StrategyInteractorBlank contract to spend tokens on behalf of owner
				await mockERC20A.approve(strategyInteractorBlank.address, mockERC20AdepositAmount);

				const NEW_ALLOCATION = [SEVENTY_FIVE_PERCENT, TWENTY_FIVE_PERCENT]

				await expect(yieldSyncV1AMPStrategy.utilizedERC20AllocationSet(NEW_ALLOCATION)).to.not.be.reverted;

				const ALLOCATION = await yieldSyncV1AMPStrategy.utilizedERC20Allocation();

				for (let i = 0; i < NEW_ALLOCATION.length; i++)
				{
					expect(NEW_ALLOCATION[i]).to.be.equal(ALLOCATION[i]);
				}
			}
		);
	});

	describe("function utilizedERC20Deposit()", async () => {
		it(
			"Should revert if invalid length for utilizedERC20Amount passed..",
			async () => {
				// Initialize strategy with mock ERC20
				await yieldSyncV1AMPStrategy.initializeStrategy(
					strategyInteractorBlank.address,
					[mockERC20A.address],
					[HUNDRED_PERCENT]
				);

				const mockERC20AdepositAmount = ethers.utils.parseUnits("1", 18);

				// Approve the StrategyInteractorBlank contract to spend tokens on behalf of owner
				await mockERC20A.approve(strategyInteractorBlank.address, mockERC20AdepositAmount);

				// Deposit ERC20 tokens into the strategy
				await expect(
					yieldSyncV1AMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount, mockERC20AdepositAmount])
				).to.be.revertedWith(ERR0R_INVALID_UTILIZEDERC20AMOUNT_LENGTH);
			}
		);

		it(
			"Should be able to deposit ERC20 into strategy interactor..",
			async () => {
				// Initialize strategy with mock ERC20
				await yieldSyncV1AMPStrategy.initializeStrategy(
					strategyInteractorBlank.address,
					[mockERC20A.address],
					[HUNDRED_PERCENT]
				);

				const mockERC20AdepositAmount = ethers.utils.parseUnits("1", 18);

				// Approve the StrategyInteractorBlank contract to spend tokens on behalf of owner
				await mockERC20A.approve(strategyInteractorBlank.address, mockERC20AdepositAmount);

				// Deposit ERC20 tokens into the strategy
				await expect(
					yieldSyncV1AMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount])
				).to.not.be.reverted;

				expect(await mockERC20A.balanceOf(strategyInteractorBlank.address)).to.be.equal(mockERC20AdepositAmount);
			}
		);

		it(
			"Should issue strategy ERC20 tokens upon utilzied ERC20 deposit..",
			async () => {
				const [owner] = await ethers.getSigners();

				// Initialize strategy with mock ERC20
				await yieldSyncV1AMPStrategy.initializeStrategy(
					strategyInteractorBlank.address,
					[mockERC20A.address],
					[HUNDRED_PERCENT]
				);

				const mockERC20AdepositAmount = ethers.utils.parseUnits("1", 18);

				// Approve the StrategyInteractorBlank contract to spend tokens on behalf of owner
				await mockERC20A.approve(strategyInteractorBlank.address, mockERC20AdepositAmount);

				// Deposit ERC20 tokens into the strategy
				await yieldSyncV1AMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount])

				expect(await yieldSyncV1AMPStrategy.balanceOf(owner.address)).to.be.equal(ethers.utils.parseUnits("1", 18));
			}
		);

		describe("MULTIPLE ERC20", async () => {
			it(
				"Should revert if invalid length for utilizedERC20Amount passed..",
				async () => {
					// Initialize strategy with mock ERC20
					await yieldSyncV1AMPStrategy.initializeStrategy(
						strategyInteractorBlank.address,
						[mockERC20A.address, mockERC20B.address],
						[FIFTY_PERCENT, FIFTY_PERCENT]
					);

					const mockERC20AdepositAmount = ethers.utils.parseUnits("1", 18);

					// Approve the StrategyInteractorBlank contract to spend tokens on behalf of owner
					await mockERC20A.approve(strategyInteractorBlank.address, mockERC20AdepositAmount);
					await mockERC20B.approve(strategyInteractorBlank.address, mockERC20AdepositAmount);

					// Deposit ERC20 tokens into the strategy
					await expect(
						yieldSyncV1AMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount])
					).to.be.revertedWith(ERR0R_INVALID_UTILIZEDERC20AMOUNT_LENGTH);
				}
			);

			it(
				"Should revert if invalid utilizedERC20Amounts passed..",
				async () => {
					// Initialize strategy with mock ERC20
					await yieldSyncV1AMPStrategy.initializeStrategy(
						strategyInteractorBlank.address,
						[mockERC20A.address, mockERC20B.address],
						[FIFTY_PERCENT, FIFTY_PERCENT]
					);

					const mockERC20AdepositAmount = ethers.utils.parseUnits("1", 18);
					const mockERC20BdepositAmount = ethers.utils.parseUnits(".8", 18);

					// Approve the StrategyInteractorBlank contract to spend tokens on behalf of owner
					await mockERC20A.approve(strategyInteractorBlank.address, mockERC20AdepositAmount);
					await mockERC20B.approve(strategyInteractorBlank.address, mockERC20AdepositAmount);

					// Deposit ERC20 tokens into the strategy
					await expect(
						yieldSyncV1AMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount, mockERC20BdepositAmount])
					).to.be.revertedWith(ERR0R_INVALID_UTILIZEDERC20AMOUNT);
				}
			);

			it(
				"Should be able to deposit ERC20s into strategy interactor..",
				async () => {
					const [owner] = await ethers.getSigners();

					// Initialize strategy with mock ERC20
					await yieldSyncV1AMPStrategy.initializeStrategy(
						strategyInteractorBlank.address,
						[mockERC20A.address, mockERC20B.address],
						[FIFTY_PERCENT, FIFTY_PERCENT]
					);

					const mockERC20AdepositAmount = ethers.utils.parseUnits("1", 18);
					const mockERC20BdepositAmount = ethers.utils.parseUnits("1", 18);

					// Approve the StrategyInteractorBlank contract to spend tokens on behalf of owner
					await mockERC20A.approve(strategyInteractorBlank.address, mockERC20AdepositAmount);
					await mockERC20B.approve(strategyInteractorBlank.address, mockERC20BdepositAmount);

					// Deposit ERC20 tokens into the strategy
					await expect(
						yieldSyncV1AMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount, mockERC20BdepositAmount])
					).to.not.be.reverted;

					expect(await mockERC20A.balanceOf(strategyInteractorBlank.address)).to.be.equal(mockERC20AdepositAmount);
					expect(await mockERC20B.balanceOf(strategyInteractorBlank.address)).to.be.equal(mockERC20BdepositAmount);

					expect(await yieldSyncV1AMPStrategy.balanceOf(owner.address)).to.be.equal(
						ethers.utils.parseUnits("2", 18)
					);
				}
			);

			it(
				"Should issue strategy ERC20 tokens upon utilzied ERC20 deposit..",
				async () => {
					const [owner] = await ethers.getSigners();

					// Initialize strategy with mock ERC20
					await yieldSyncV1AMPStrategy.initializeStrategy(
						strategyInteractorBlank.address,
						[mockERC20A.address, mockERC20B.address],
						[FIFTY_PERCENT, FIFTY_PERCENT]
					);

					const mockERC20AdepositAmount = ethers.utils.parseUnits("1", 18);
					const mockERC20BdepositAmount = ethers.utils.parseUnits("1", 18);

					// Approve the StrategyInteractorBlank contract to spend tokens on behalf of owner
					await mockERC20A.approve(strategyInteractorBlank.address, mockERC20AdepositAmount);
					await mockERC20B.approve(strategyInteractorBlank.address, mockERC20BdepositAmount);

					// Deposit ERC20 tokens into the strategy
					await expect(
						yieldSyncV1AMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount, mockERC20BdepositAmount])
					).to.not.be.reverted;

					expect(await yieldSyncV1AMPStrategy.balanceOf(owner.address)).to.be.equal(
						ethers.utils.parseUnits("2", 18)
					);
				}
			);
		});
	});

	describe("function utilizedERC20Withdraw()", async () => {
		it(
			"Should allow caller to burn ERC20 and cash out..",
			async () => {
				const [owner] = await ethers.getSigners();

				// Initialize strategy with mock ERC20
				await yieldSyncV1AMPStrategy.initializeStrategy(
					strategyInteractorBlank.address,
					[mockERC20A.address],
					[HUNDRED_PERCENT]
				);

				const strategyTotalSupplyBefore = await yieldSyncV1AMPStrategy.totalSupply();

				const strategyInteractorMockERC20ABalanceBefore = await mockERC20A.balanceOf(
					strategyInteractorBlank.address
				);

				const ownerMockERC20ABalanceBefore = await mockERC20A.balanceOf(owner.address);

				const mockERC20AdepositAmount = ethers.utils.parseUnits("1", 18);

				// Approve the StrategyInteractorBlank contract to spend tokens on behalf of owner
				await mockERC20A.approve(strategyInteractorBlank.address, mockERC20AdepositAmount);

				// Deposit mockERC20A tokens into the strategy
				yieldSyncV1AMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount])

				// mockERC20A BalanceOf strategy interactor should equal to deposit amount
				expect(await mockERC20A.balanceOf(strategyInteractorBlank.address)).to.be.equal(
					strategyInteractorMockERC20ABalanceBefore.add(mockERC20AdepositAmount)
				);

				// Strategy totalSupply has increased
				expect(await yieldSyncV1AMPStrategy.totalSupply()).to.be.greaterThan(strategyTotalSupplyBefore);

				// Strategy BalanceOf owner should be newly minted tokens (Current Supply - Before supply)
				expect(await yieldSyncV1AMPStrategy.balanceOf(owner.address)).to.be.equal(
					(await yieldSyncV1AMPStrategy.balanceOf(owner.address)).sub(strategyTotalSupplyBefore)
				);

				// [main-test] Withdraw ERC20 tokens into the strategy
				await expect(
					yieldSyncV1AMPStrategy.utilizedERC20Withdraw(await yieldSyncV1AMPStrategy.balanceOf(owner.address))
				).to.be.not.reverted;

				// Strategy token burned
				expect(await yieldSyncV1AMPStrategy.balanceOf(owner.address)).to.be.equal(
					strategyInteractorMockERC20ABalanceBefore
				);

				// Supply put back to original
				expect(await yieldSyncV1AMPStrategy.totalSupply()).to.be.equal(strategyTotalSupplyBefore);

				// Check that the balance been returned to original or greater
				expect(await mockERC20A.balanceOf(owner.address)).to.be.greaterThanOrEqual(ownerMockERC20ABalanceBefore);
			}
		);

		describe("MULTIPLE ERC20", async () => {

		});
	});
});
