const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

const ERR0R_INVALID_UTILIZEDERC20AMOUNT = "!utilizedERC20AmountValid(_utilizedERC20Amount)";

const D_18 = ethers.utils.parseUnits('1', 18);

const HUNDRED_PERCENT = D_18;
const FIFTY_PERCENT = ethers.utils.parseUnits('.5', 18);
const TWENTY_FIVE_PERCENT = ethers.utils.parseUnits('.25', 18);
const SEVENTY_FIVE_PERCENT = ethers.utils.parseUnits('.75', 18);


describe("[0.1] YieldSyncV1VaultDeployer.sol - Deposit", async () => {
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC206: Contract;
	let eTHValueFeedDummy: Contract;
	let strategyInteractorDummy: Contract;
	let yieldSyncV1EMPStrategy: Contract;


	beforeEach("[beforeEach] Set up contracts..", async () =>
	{
		const [owner] = await ethers.getSigners();

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
		yieldSyncV1EMPStrategy = await (await YieldSyncV1EMPStrategy.deploy(owner.address, "Exampe", "EX")).deployed();
	});


	describe("function utilizedERC20Deposit()", async () => {
		describe("[SINGLE ERC20]", async () => {
			it(
				"Should be able to deposit ERC20 into strategy interactor..",
				async () => {
					// Initialize strategy with mock ERC20
					await expect(
						yieldSyncV1EMPStrategy.initializeStrategy(
							eTHValueFeedDummy.address,
							strategyInteractorDummy.address,
							[mockERC20A.address],
							[HUNDRED_PERCENT]
						)
					).to.not.be.reverted;

					await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
					await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


					const mockERC20AdepositAmount = ethers.utils.parseUnits("1", 18);

					// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
					await mockERC20A.approve(strategyInteractorDummy.address, mockERC20AdepositAmount);

					// Deposit ERC20 tokens into the strategy
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount])
					).to.not.be.reverted;

					expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(mockERC20AdepositAmount);
				}
			);

			it(
				"Should issue strategy ERC20 tokens upon utilized ERC20 deposit..",
				async () => {
					const [owner] = await ethers.getSigners();

					// Initialize strategy with mock ERC20
					await expect(
						yieldSyncV1EMPStrategy.initializeStrategy(
							eTHValueFeedDummy.address,
							strategyInteractorDummy.address,
							[mockERC20A.address],
							[HUNDRED_PERCENT]
						)
					).to.not.be.reverted;

					await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
					await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


					const mockERC20AdepositAmount = ethers.utils.parseUnits("2", 18);

					// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
					await mockERC20A.approve(strategyInteractorDummy.address, mockERC20AdepositAmount);

					// Deposit ERC20 tokens into the strategy
					await yieldSyncV1EMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount])

					// [calculate] YSS balance
					const yssBalance = mockERC20AdepositAmount.mul(
						await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)
					).div(D_18);

					expect(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).to.be.equal(yssBalance);
				}
			);

			describe("DECIMALS = 6", async () => {
				it(
					"Should be able to deposit ERC20 into strategy interactor..",
					async () => {
						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.initializeStrategy(
								eTHValueFeedDummy.address,
								strategyInteractorDummy.address,
								[mockERC206.address],
								[HUNDRED_PERCENT]
							)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


						const mockERC206depositAmount = ethers.utils.parseUnits("1", 6);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
						await mockERC206.approve(strategyInteractorDummy.address, mockERC206depositAmount);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([mockERC206depositAmount])
						).to.not.be.reverted;

						expect(await mockERC206.balanceOf(strategyInteractorDummy.address)).to.be.equal(mockERC206depositAmount);
					}
				);

				it(
					"Should issue strategy ERC20 tokens upon utilzied ERC20 deposit..",
					async () => {
						const [owner] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.initializeStrategy(
								eTHValueFeedDummy.address,
								strategyInteractorDummy.address,
								[mockERC206.address],
								[HUNDRED_PERCENT]
							)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


						const mockERC206depositAmount = ethers.utils.parseUnits("1", 6);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
						await mockERC206.approve(strategyInteractorDummy.address, mockERC206depositAmount);

						// Deposit ERC20 tokens into the strategy
						await yieldSyncV1EMPStrategy.utilizedERC20Deposit([mockERC206depositAmount])

						// [calculate] YSS balance
						const yssBalance = mockERC206depositAmount.mul(
							// Convert to base 18 with 10**12
							ethers.BigNumber.from("1000000000000")
						).mul(
							await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)
						).div(
							D_18
						);

						expect(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).to.be.equal(yssBalance);
					}
				);
			});
		});

		describe("[MULTIPLE ERC20]", async () => {
			describe("[50/50]", async () => {
				it(
					"Should revert if invalid utilizedERC20Amounts passed..",
					async () => {
						// Initialize strategy with mock ERC20
						await yieldSyncV1EMPStrategy.initializeStrategy(
							eTHValueFeedDummy.address,
							strategyInteractorDummy.address,
							[mockERC20A.address, mockERC20B.address],
							[FIFTY_PERCENT, FIFTY_PERCENT]
						);

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


						const mockERC20AdepositAmount = ethers.utils.parseUnits("1", 18);
						const mockERC20BdepositAmount = ethers.utils.parseUnits(".8", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
						await mockERC20A.approve(strategyInteractorDummy.address, mockERC20AdepositAmount);
						await mockERC20B.approve(strategyInteractorDummy.address, mockERC20AdepositAmount);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount, mockERC20BdepositAmount])
						).to.be.revertedWith(ERR0R_INVALID_UTILIZEDERC20AMOUNT);
					}
				);

				it(
					"Should be able to deposit ERC20s into strategy interactor..",
					async () => {
						const [owner] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await yieldSyncV1EMPStrategy.initializeStrategy(
							eTHValueFeedDummy.address,
							strategyInteractorDummy.address,
							[mockERC20A.address, mockERC20B.address],
							[FIFTY_PERCENT, FIFTY_PERCENT]
						);

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


						const mockERC20AdepositAmount = ethers.utils.parseUnits("1", 18);
						const mockERC20BdepositAmount = ethers.utils.parseUnits("1", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
						await mockERC20A.approve(strategyInteractorDummy.address, mockERC20AdepositAmount);
						await mockERC20B.approve(strategyInteractorDummy.address, mockERC20BdepositAmount);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount, mockERC20BdepositAmount])
						).to.not.be.reverted;

						expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(mockERC20AdepositAmount);
						expect(await mockERC20B.balanceOf(strategyInteractorDummy.address)).to.be.equal(mockERC20BdepositAmount);

						// [calculate] YSS balance
						const yssBalance = mockERC20AdepositAmount.mul(
							await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)
						).div(
							D_18
						).add(
							mockERC20BdepositAmount.mul(
								await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)
							).div(
								D_18
							)
						);


						expect(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).to.be.equal(yssBalance);
					}
				);

				it(
					"Should NOT revert if beginning values of utilizedERC20Amounts values fit requirement..",
					async () => {
						await yieldSyncV1EMPStrategy.initializeStrategy(
							eTHValueFeedDummy.address,
							strategyInteractorDummy.address,
							[mockERC20A.address, mockERC20B.address],
							[FIFTY_PERCENT, FIFTY_PERCENT]
						);

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


						const mockERC20AdepositAmount = ethers.utils.parseUnits("1", 18);
						const mockERC20BdepositAmount = ethers.utils.parseUnits("1", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
						await mockERC20A.approve(strategyInteractorDummy.address, mockERC20AdepositAmount);
						await mockERC20B.approve(strategyInteractorDummy.address, mockERC20BdepositAmount);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount, mockERC20BdepositAmount, mockERC20BdepositAmount])
						).to.not.be.reverted;

						expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(mockERC20AdepositAmount);
						expect(await mockERC20B.balanceOf(strategyInteractorDummy.address)).to.be.equal(mockERC20BdepositAmount);
					}
				);
			});

			describe("[75/25]", async () => {
				it(
					"Should revert if invalid utilizedERC20Amounts passed..",
					async () => {
						// Initialize strategy with mock ERC20
						await yieldSyncV1EMPStrategy.initializeStrategy(
							eTHValueFeedDummy.address,
							strategyInteractorDummy.address,
							[mockERC20A.address, mockERC20B.address],
							[SEVENTY_FIVE_PERCENT, TWENTY_FIVE_PERCENT]
						);

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


						const mockERC20AdepositAmount = ethers.utils.parseUnits(".5", 18);
						const mockERC20BdepositAmount = ethers.utils.parseUnits(".25", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
						await mockERC20A.approve(strategyInteractorDummy.address, mockERC20AdepositAmount);
						await mockERC20B.approve(strategyInteractorDummy.address, mockERC20AdepositAmount);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount, mockERC20BdepositAmount])
						).to.be.revertedWith(ERR0R_INVALID_UTILIZEDERC20AMOUNT);
					}
				);

				it(
					"Should be able to deposit ERC20s into strategy interactor..",
					async () => {
						const [owner] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await yieldSyncV1EMPStrategy.initializeStrategy(
							eTHValueFeedDummy.address,
							strategyInteractorDummy.address,
							[mockERC20A.address, mockERC20B.address],
							[SEVENTY_FIVE_PERCENT, TWENTY_FIVE_PERCENT]
						);

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


						const mockERC20AdepositAmount = ethers.utils.parseUnits("1.5", 18);
						const mockERC20BdepositAmount = ethers.utils.parseUnits(".5", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
						await mockERC20A.approve(strategyInteractorDummy.address, mockERC20AdepositAmount);
						await mockERC20B.approve(strategyInteractorDummy.address, mockERC20BdepositAmount);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount, mockERC20BdepositAmount])
						).to.not.be.reverted;

						expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(mockERC20AdepositAmount);
						expect(await mockERC20B.balanceOf(strategyInteractorDummy.address)).to.be.equal(mockERC20BdepositAmount);

						// [calculate] YSS balance = (a * p(a)) / (1e18 + (b * p(b) / 1e18))
						const yssBalance = mockERC20AdepositAmount.mul(
							await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)
						).div(
							D_18
						).add(
							mockERC20BdepositAmount.mul(
								await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)
							).div(
								D_18
							)
						);

						expect(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).to.be.equal(yssBalance);
					}
				);

				it(
					"Should NOT revert if beginning values of utilizedERC20Amounts values fit requirement..",
					async () => {
						await yieldSyncV1EMPStrategy.initializeStrategy(
							eTHValueFeedDummy.address,
							strategyInteractorDummy.address,
								[mockERC20A.address, mockERC20B.address],
							[SEVENTY_FIVE_PERCENT, TWENTY_FIVE_PERCENT]
						);

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


						const mockERC20AdepositAmount = ethers.utils.parseUnits(".75", 18);
						const mockERC20BdepositAmount = ethers.utils.parseUnits(".25", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
						await mockERC20A.approve(strategyInteractorDummy.address, mockERC20AdepositAmount);
						await mockERC20B.approve(strategyInteractorDummy.address, mockERC20BdepositAmount);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount, mockERC20BdepositAmount, mockERC20BdepositAmount])
						).to.not.be.reverted;

						expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(mockERC20AdepositAmount);
						expect(await mockERC20B.balanceOf(strategyInteractorDummy.address)).to.be.equal(mockERC20BdepositAmount);
					}
				);
			});

			describe("[Strategy ERC20]", async () => {
				it(
					"Should issue strategy ERC20 tokens upon utilzied ERC20 deposit..",
					async () => {
						const [owner] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.initializeStrategy(
								eTHValueFeedDummy.address,
								strategyInteractorDummy.address,
								[mockERC20A.address, mockERC20B.address],
								[FIFTY_PERCENT, FIFTY_PERCENT]
							)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


						const mockERC20AdepositAmount = ethers.utils.parseUnits("1", 18);
						const mockERC20BdepositAmount = ethers.utils.parseUnits("1", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
						await mockERC20A.approve(strategyInteractorDummy.address, mockERC20AdepositAmount);
						await mockERC20B.approve(strategyInteractorDummy.address, mockERC20BdepositAmount);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount, mockERC20BdepositAmount])
						).to.not.be.reverted;

						// [calculate] YSS balance
						const yssBalance = mockERC20AdepositAmount.mul(
							await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)
						).div(
							D_18
						).add(
							mockERC20BdepositAmount.mul(
								await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)
							).div(
								D_18
							)
						);

						expect(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).to.be.equal(yssBalance);
					}
				);
			});

			describe("[DECIMALS = 6]", async () => {
				it(
					"[75/25] Should revert if invalid utilizedERC20Amounts passed..",
					async () => {
						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.initializeStrategy(
								eTHValueFeedDummy.address,
								strategyInteractorDummy.address,
								[mockERC20A.address, mockERC206.address],
								[SEVENTY_FIVE_PERCENT, TWENTY_FIVE_PERCENT]
							)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


						const mockERC20AdepositAmount = ethers.utils.parseUnits(".5", 18);
						const mockERC206depositAmount = ethers.utils.parseUnits(".25", 6);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
						await mockERC20A.approve(strategyInteractorDummy.address, mockERC20AdepositAmount);
						await mockERC206.approve(strategyInteractorDummy.address, mockERC206depositAmount);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount, mockERC206depositAmount])
						).to.be.revertedWith(ERR0R_INVALID_UTILIZEDERC20AMOUNT);
					}
				);

				it(
					"[75/25] Should be able to deposit ERC20s into strategy interactor..",
					async () => {
						const [owner] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.initializeStrategy(
								eTHValueFeedDummy.address,
								strategyInteractorDummy.address,
								[mockERC20A.address, mockERC206.address],
								[SEVENTY_FIVE_PERCENT, TWENTY_FIVE_PERCENT]
							)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


						const mockERC20AdepositAmount = ethers.utils.parseUnits(".75", 18);
						const mockERC206depositAmount = ethers.utils.parseUnits(".25", 6);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
						await mockERC20A.approve(strategyInteractorDummy.address, mockERC20AdepositAmount);
						await mockERC206.approve(strategyInteractorDummy.address, mockERC206depositAmount);

						// Deposit ERC20 tokens into the strategy
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount, mockERC206depositAmount])
						).to.not.be.reverted;

						expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(
							mockERC20AdepositAmount
						);
						expect(await mockERC206.balanceOf(strategyInteractorDummy.address)).to.be.equal(
							mockERC206depositAmount
						);

						// [calculate] YSS balance
						const yssBalance = mockERC20AdepositAmount.add(
							// Convert to base 18 with 10**12
							mockERC206depositAmount.mul(ethers.BigNumber.from("1000000000000"))
						).mul(
							await eTHValueFeedDummy.utilizedERC20ETHValue(mockERC20A.address)
						).div(
							D_18
						);

						expect(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).to.be.equal(yssBalance);
					}
				);
			});
		});
	});
});
