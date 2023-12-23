const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

const ERR0R_INVALID_UTILIZEDERC20AMOUNT = "!utilizedERC20AmountValid(_utilizedERC20Amount)";
const ERR0R_INVALID_UTILIZEDERC20AMOUNT_LENGTH = "_utilizedERC20.length != _utilizedERC20Amount.length";

const HUNDRED_PERCENT = ethers.utils.parseUnits('1', 18);
const FIFTY_PERCENT = ethers.utils.parseUnits('.5', 18);
const TWENTY_FIVE_PERCENT = ethers.utils.parseUnits('.25', 18);
const SEVENTY_FIVE_PERCENT = ethers.utils.parseUnits('.75', 18);


describe("[0.1] YieldSyncV1VaultDeployer.sol - Deposit", async () => {
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC206: Contract;
	let strategyInteractorBlank: Contract;
	let yieldSyncV1AMPStrategy: Contract;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		const [owner] = await ethers.getSigners();

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const MockERC206: ContractFactory = await ethers.getContractFactory("MockERC206");
		const StrategyInteractorBlank: ContractFactory = await ethers.getContractFactory("StrategyInteractorBlank");
		const YieldSyncV1AMPStrategy: ContractFactory = await ethers.getContractFactory("YieldSyncV1AMPStrategy");

		mockERC20A = await (await MockERC20.deploy()).deployed();
		mockERC20B = await (await MockERC20.deploy()).deployed();
		mockERC206 = await (await MockERC206.deploy()).deployed();
		strategyInteractorBlank = await (await StrategyInteractorBlank.deploy()).deployed();
		yieldSyncV1AMPStrategy = await (await YieldSyncV1AMPStrategy.deploy(owner.address, "Exampe", "EX")).deployed();
	});


	describe("function utilizedERC20Deposit()", async () => {
		it(
			"Should revert if invalid length for utilizedERC20Amount passed..",
			async () => {
				// Initialize strategy with mock ERC20
				await expect(
					yieldSyncV1AMPStrategy.initializeStrategy(
						strategyInteractorBlank.address,
						[mockERC20A.address],
						[HUNDRED_PERCENT]
					)
				).to.not.be.reverted;

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
				await expect(
					yieldSyncV1AMPStrategy.initializeStrategy(
						strategyInteractorBlank.address,
						[mockERC20A.address],
						[HUNDRED_PERCENT]
					)
				).to.not.be.reverted;

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
				await expect(
					yieldSyncV1AMPStrategy.initializeStrategy(
						strategyInteractorBlank.address,
						[mockERC20A.address],
						[HUNDRED_PERCENT]
					)
				).to.not.be.reverted;

				const mockERC20AdepositAmount = ethers.utils.parseUnits("1", 18);

				// Approve the StrategyInteractorBlank contract to spend tokens on behalf of owner
				await mockERC20A.approve(strategyInteractorBlank.address, mockERC20AdepositAmount);

				// Deposit ERC20 tokens into the strategy
				await yieldSyncV1AMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount])

				expect(await yieldSyncV1AMPStrategy.balanceOf(owner.address)).to.be.equal(ethers.utils.parseUnits("1", 18));
			}
		);

		describe("ERC20 with 6 decimals", async () => {
			it(
				"Should be able to deposit ERC20 into strategy interactor..",
				async () => {
					// Initialize strategy with mock ERC20
					await expect(
						yieldSyncV1AMPStrategy.initializeStrategy(
							strategyInteractorBlank.address,
							[mockERC206.address],
							[HUNDRED_PERCENT]
						)
					).to.not.be.reverted;

					const mockERC206depositAmount = ethers.utils.parseUnits("1", 6);

					// Approve the StrategyInteractorBlank contract to spend tokens on behalf of owner
					await mockERC206.approve(strategyInteractorBlank.address, mockERC206depositAmount);

					// Deposit ERC20 tokens into the strategy
					await expect(
						yieldSyncV1AMPStrategy.utilizedERC20Deposit([mockERC206depositAmount])
					).to.not.be.reverted;

					expect(await mockERC206.balanceOf(strategyInteractorBlank.address)).to.be.equal(mockERC206depositAmount);
				}
			);

			it(
				"Should issue strategy ERC20 tokens upon utilzied ERC20 deposit..",
				async () => {
					const [owner] = await ethers.getSigners();

					// Initialize strategy with mock ERC20
					await expect(
						yieldSyncV1AMPStrategy.initializeStrategy(
							strategyInteractorBlank.address,
							[mockERC206.address],
							[HUNDRED_PERCENT]
						)
					).to.not.be.reverted;

					const mockERC206depositAmount = ethers.utils.parseUnits("1", 6);

					// Approve the StrategyInteractorBlank contract to spend tokens on behalf of owner
					await mockERC206.approve(strategyInteractorBlank.address, mockERC206depositAmount);

					// Deposit ERC20 tokens into the strategy
					await yieldSyncV1AMPStrategy.utilizedERC20Deposit([mockERC206depositAmount])

					expect(await yieldSyncV1AMPStrategy.balanceOf(owner.address)).to.be.equal(
						ethers.utils.parseUnits("1", 18)
					);
				}
			);
		});

		describe("MULTIPLE ERC20", async () => {
			it(
				"Should revert if invalid length for utilizedERC20Amount passed..",
				async () => {
					// Initialize strategy with mock ERC20
					await expect(
						yieldSyncV1AMPStrategy.initializeStrategy(
							strategyInteractorBlank.address,
							[mockERC20A.address, mockERC20B.address],
							[FIFTY_PERCENT, FIFTY_PERCENT]
						)
					).to.not.be.reverted;

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
				"[50/50] Should revert if invalid utilizedERC20Amounts passed..",
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
				"[75/25] Should revert if invalid utilizedERC20Amounts passed..",
				async () => {
					// Initialize strategy with mock ERC20
					await yieldSyncV1AMPStrategy.initializeStrategy(
						strategyInteractorBlank.address,
						[mockERC20A.address, mockERC20B.address],
						[SEVENTY_FIVE_PERCENT, TWENTY_FIVE_PERCENT]
					);

					const mockERC20AdepositAmount = ethers.utils.parseUnits(".5", 18);
					const mockERC20BdepositAmount = ethers.utils.parseUnits(".25", 18);

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
				"[75/25] Should be able to deposit ERC20s into strategy interactor..",
				async () => {
					const [owner] = await ethers.getSigners();

					// Initialize strategy with mock ERC20
					await yieldSyncV1AMPStrategy.initializeStrategy(
						strategyInteractorBlank.address,
						[mockERC20A.address, mockERC20B.address],
						[SEVENTY_FIVE_PERCENT, TWENTY_FIVE_PERCENT]
					);

					const mockERC20AdepositAmount = ethers.utils.parseUnits("1.5", 18);
					const mockERC20BdepositAmount = ethers.utils.parseUnits(".5", 18);

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
					await expect(
						yieldSyncV1AMPStrategy.initializeStrategy(
							strategyInteractorBlank.address,
							[mockERC20A.address, mockERC20B.address],
							[FIFTY_PERCENT, FIFTY_PERCENT]
						)
					).to.not.be.reverted;

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

			describe("ERC20 with 6 decimals", async () => {
				it(
					"[50/50] Should be able to deposit ERC20s into strategy interactor..",
					async () => {
						const [owner] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1AMPStrategy.initializeStrategy(
								strategyInteractorBlank.address,
								[mockERC20A.address, mockERC206.address],
								[FIFTY_PERCENT, FIFTY_PERCENT]
							)
						).to.not.be.reverted;

						const mockERC20AdepositAmount = ethers.utils.parseUnits("1", 18);
						const mockERC206depositAmount = ethers.utils.parseUnits("1", 6);

						// Approve the StrategyInteractorBlank contract to spend tokens on behalf of owner
						await mockERC20A.approve(strategyInteractorBlank.address, mockERC20AdepositAmount);
						await mockERC206.approve(strategyInteractorBlank.address, mockERC206depositAmount);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1AMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount, mockERC206depositAmount])
						).to.not.be.reverted;

						expect(await mockERC20A.balanceOf(strategyInteractorBlank.address)).to.be.equal(mockERC20AdepositAmount);
						expect(await mockERC206.balanceOf(strategyInteractorBlank.address)).to.be.equal(mockERC206depositAmount);

						expect(await yieldSyncV1AMPStrategy.balanceOf(owner.address)).to.be.equal(
							ethers.utils.parseUnits("2", 18)
						);
					}
				);

				it(
					"[75/25] Should be able to deposit ERC20s into strategy interactor..",
					async () => {
						const [owner] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1AMPStrategy.initializeStrategy(
								strategyInteractorBlank.address,
								[mockERC20A.address, mockERC206.address],
								[SEVENTY_FIVE_PERCENT, TWENTY_FIVE_PERCENT]
							)
						).to.not.be.reverted;

						const mockERC20AdepositAmount = ethers.utils.parseUnits(".75", 18);
						const mockERC206depositAmount = ethers.utils.parseUnits(".25", 6);

						// Approve the StrategyInteractorBlank contract to spend tokens on behalf of owner
						await mockERC20A.approve(strategyInteractorBlank.address, mockERC20AdepositAmount);
						await mockERC206.approve(strategyInteractorBlank.address, mockERC206depositAmount);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1AMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount, mockERC206depositAmount])
						).to.not.be.reverted;

						expect(await mockERC20A.balanceOf(strategyInteractorBlank.address)).to.be.equal(mockERC20AdepositAmount);
						expect(await mockERC206.balanceOf(strategyInteractorBlank.address)).to.be.equal(mockERC206depositAmount);

						expect(await yieldSyncV1AMPStrategy.balanceOf(owner.address)).to.be.equal(
							ethers.utils.parseUnits("1", 18)
						);
					}
				);

				it(
					"[75/25] Should revert if invalid utilizedERC20Amounts passed..",
					async () => {
						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1AMPStrategy.initializeStrategy(
								strategyInteractorBlank.address,
								[mockERC20A.address, mockERC206.address],
								[SEVENTY_FIVE_PERCENT, TWENTY_FIVE_PERCENT]
							)
						).to.not.be.reverted;

						const mockERC20AdepositAmount = ethers.utils.parseUnits(".5", 18);
						const mockERC206depositAmount = ethers.utils.parseUnits(".25", 6);

						// Approve the StrategyInteractorBlank contract to spend tokens on behalf of owner
						await mockERC20A.approve(strategyInteractorBlank.address, mockERC20AdepositAmount);
						await mockERC206.approve(strategyInteractorBlank.address, mockERC206depositAmount);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1AMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount, mockERC206depositAmount])
						).to.be.revertedWith(ERR0R_INVALID_UTILIZEDERC20AMOUNT);
					}
				);
			});
		});
	});
});
