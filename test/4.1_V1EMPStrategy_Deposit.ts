const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory, VoidSigner } from "ethers";

import { ERROR, PERCENT, D_18 } from "../const";
import StrategyTransferUtil from "../scripts/StrategyTransferUtil";


const LOCATION_IERC20: string = "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20";


describe("[4.1] V1EMPStrategy.sol - Depositing Tokens", async () => {
	let arrayUtility: Contract;
	let governance: Contract;
	let eTHValueFeed: Contract;
	let strategyInteractor: Contract;
	let registry: Contract;
	let strategy: Contract;
	let strategyUtility: Contract;
	let strategyDeployer: Contract;

	let mockERC20A: Contract;
	let mockERC20B: Contract;

	let strategyTransferUtil: StrategyTransferUtil;

	let owner: VoidSigner;
	let manager: VoidSigner;
	let treasury: VoidSigner;
	let badActor: VoidSigner;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		/**
		* This beforeEach process does the following:
		* 1) Deploy a Governance contract
		* 2) Set the treasury on the Governance contract
		* 3) Deploy an Array Utility contract
		* 4) Deploy a Registry contract
		* 5) Register the Array Utility contract on the Registry contract
		* 6) Deploy a Strategy Utility contract
		* 7) Register the Strategy Utility contract on the Registry contract
		*
		* @dev It is important to utilize the strategyTransferUtil for multiple ERC20 based strategies because they get
		* reordred when setup. The strategyUtil will return the deposit amounts in the order of the what the conctract
		* returns for the Utilized ERC20s
		*/
		[owner, manager, treasury, badActor] = await ethers.getSigners();


		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const V1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("V1EMPArrayUtility");
		const V1EMPRegistry: ContractFactory = await ethers.getContractFactory("V1EMPRegistry");
		const V1EMPStrategy: ContractFactory = await ethers.getContractFactory("V1EMPStrategy");
		const V1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("V1EMPStrategyDeployer");

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");


		governance = await (await YieldSyncGovernance.deploy()).deployed();

		await governance.payToUpdate(treasury.address);

		arrayUtility = await (await V1EMPArrayUtility.deploy()).deployed();

		registry = await (await V1EMPRegistry.deploy(governance.address)).deployed();

		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

		strategyDeployer = await (await V1EMPStrategyDeployer.deploy(registry.address)).deployed();

		mockERC20A = await (await MockERC20.deploy("Mock A", "A")).deployed();
		mockERC20B = await (await MockERC20.deploy("Mock B", "B")).deployed();

		eTHValueFeed = await (await ETHValueFeedDummy.deploy()).deployed();

		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20A.address, eTHValueFeed.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20B.address, eTHValueFeed.address);

		strategyInteractor = await (await StrategyInteractorDummy.deploy()).deployed();

		/**
		* @notice The owner has to be registered as the EMP deployer so that it can authorize itself as an EMP to access the
		* functions available on the strategy.
		*/
		await registry.v1EMPAmountsValidatorUpdate(owner.address);
		await registry.v1EMPDeployerUpdate(owner.address);
		await registry.v1EMPRegister(owner.address);


		// Set EMP Strategy Deployer on registry
		await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);

		// Deploy EMP Strategy
		await strategyDeployer.deployV1EMPStrategy("Strategy", "S");

		// Attach the deployed V1EMPStrategy address
		strategy = await V1EMPStrategy.attach(
			String(await registry.v1EMPStrategyId_v1EMPStrategy(1))
		);

		strategyTransferUtil = new StrategyTransferUtil(strategy, registry);
	});


	describe("function utilizedERC20Deposit()", async () => {
		let utilizedERC20: string[];
		let b4TotalSupplyStrategy: BigNumber;


		describe("Set Up Process Test", async () => {
			it("[modifier] Should revert if Strategy Interactor is not set..", async () => {
				await expect(strategy.utilizedERC20Deposit(owner.address, [])).to.be.rejectedWith(
					ERROR.STRATEGY.INTERACTOR_NOT_SET
				);
			});

			it("[modifier] Should only authorize authorized caller..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				await expect(
					strategy.connect(badActor).utilizedERC20Deposit(badActor.address, [])
				).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});

			it("Should revert if deposits not open..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				// APPROVE - SI contract to spend tokens on behalf of owner
				await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT);

				// [main-test] Deposit ERC20 tokens into the strategy
				await expect(
					strategy.utilizedERC20Deposit(owner.address, [DEPOSIT_AMOUNT, DEPOSIT_AMOUNT])
				).to.rejectedWith(ERROR.STRATEGY.DEPOSIT_NOT_OPEN);
			});

			it("Should revert if invalid lengthed _utilizedERC20Amount passed..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				// Toggle deposits on
				await strategy.utilizedERC20DepositOpenToggle();

				await expect(strategy.utilizedERC20Deposit(owner.address, [])).to.be.rejectedWith(
					ERROR.STRATEGY.INVAILD_PARAMS_DEPOSIT_LENGTH
				);

			});

			it("Should revert if denominator is 0..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				// Toggle deposits on
				await strategy.utilizedERC20DepositOpenToggle();

				// Set ETH value to ZERO
				await eTHValueFeed.updateETHValue(0);

				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				await expect(
					strategy.utilizedERC20Deposit(owner.address, [DEPOSIT_AMOUNT])
				).to.be.rejectedWith(
					ERROR.NOT_COMPUTED
				);
			});

			it("Should return false if INVALID ERC20 amounts passed..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update(
					[mockERC20A.address, mockERC20B.address],
					[[true, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]]
				);

				await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				// Toggle deposits on
				await strategy.utilizedERC20DepositOpenToggle();

				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				await expect(
					strategy.utilizedERC20Deposit(owner.address, [0, DEPOSIT_AMOUNT])
				).to.be.rejectedWith(
					ERROR.STRATEGY.INVALID_UTILIZED_ERC20_AMOUNT
				);
			});

			it("Should return false if INVALID ERC20 amounts with deposits set to false but non-zero deposit amount passed..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update(
					[mockERC20A.address, mockERC20B.address],
					[[true, true, PERCENT.HUNDRED], [false, true, PERCENT.HUNDRED]]
				);

				await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				// Toggle deposits on
				await strategy.utilizedERC20DepositOpenToggle();

				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				await expect(
					strategy.utilizedERC20Deposit(owner.address, [DEPOSIT_AMOUNT, DEPOSIT_AMOUNT])
				).to.be.rejectedWith(
					ERROR.STRATEGY.UTILIZED_ERC20_AMOUNT_NOT_ZERO
				);
			});
		});

		describe("[SINGLE ERC20]", async () => {
			beforeEach(async () => {
				// Snapshot Total Supply
				b4TotalSupplyStrategy = await strategy.totalSupply();

				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				// Capture utilized ERC20
				utilizedERC20 = await strategy.utilizedERC20();

				// Set SI
				await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				// Toggle deposits on
				await strategy.utilizedERC20DepositOpenToggle();
			});


			describe("Invalid", async () => {
				it("Should revert if invalid _utilizedERC20Amount.length passed..", async () => {
					const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

					// APPROVE - SI contract to spend tokens on behalf of owner
					await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT);

					// [main-test] Deposit ERC20 tokens into the strategy
					await expect(
						strategy.utilizedERC20Deposit(owner.address, [DEPOSIT_AMOUNT, DEPOSIT_AMOUNT])
					).to.rejectedWith(ERROR.STRATEGY.INVALID_AMOUNT_LENGTH);
				});

				it("Should be able to deposit ERC20 into strategy interactor..", async () => {
					const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

					// APPROVE - SI contract to spend tokens on behalf of owner
					await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT);

					// DEPOSIT - ERC20 tokens into the strategy
					await expect(
						strategy.utilizedERC20Deposit(owner.address, [DEPOSIT_AMOUNT])
					).to.be.not.rejected;

					const { totalEthValue } = await strategyTransferUtil.valueOfERC20Deposits([DEPOSIT_AMOUNT]);

					expect(await mockERC20A.balanceOf(strategyInteractor.address)).to.be.equal(totalEthValue);
				});
			});

			describe("Valid", async () => {
				it("Should issue strategy ERC20 tokens upon utilized ERC20 deposit..", async () => {
					const DEPOSIT_AMOUNTS: BigNumber[] = await strategyTransferUtil.calculateERC20Required(
						ethers.utils.parseUnits("1", 18)
					);

					expect(DEPOSIT_AMOUNTS.length).to.be.equal(utilizedERC20.length);

					for (let i: number = 0; i < utilizedERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_IERC20, utilizedERC20[i]);

						// APPROVE - SI contract to spend tokens on behalf of owner
						await IERC20.approve(strategyInteractor.address, DEPOSIT_AMOUNTS[i]);
					}

					// DEPOSIT - ERC20 tokens into the strategy
					await strategy.utilizedERC20Deposit(owner.address, DEPOSIT_AMOUNTS)

					// Get current supply
					const TOTAL_SUPPLY_STRATEGY: BigNumber = await strategy.totalSupply();

					// Calculate minted amount
					const MINTED_STRATEGY_TOKENS: BigNumber = TOTAL_SUPPLY_STRATEGY.sub(b4TotalSupplyStrategy);

					// Get values
					const { totalEthValue } = await strategyTransferUtil.valueOfERC20Deposits(DEPOSIT_AMOUNTS);

					// Expect that the owner received the strategy tokens
					expect(await strategy.balanceOf(owner.address)).to.be.equal(MINTED_STRATEGY_TOKENS);

					// Expect that the strategy token amount issued is equal to the ETH value of the deposits
					expect(await strategy.balanceOf(owner.address)).to.be.equal(totalEthValue);
				});
			});
		});

		describe("[MULTIPLE ERC20]", async () => {
			describe("[50/50]", async () => {
				beforeEach(async () => {
					// Snapshot Total Supply
					b4TotalSupplyStrategy = await strategy.totalSupply();

					// Set strategy ERC20 tokens
					await strategy.utilizedERC20Update(
						[mockERC20A.address, mockERC20B.address],
						[[true, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]]
					);

					// Capture utilized ERC20
					utilizedERC20 = await strategy.utilizedERC20();

					// Set SI
					await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

					// Toggle deposits on
					await strategy.utilizedERC20DepositOpenToggle();
				});


				describe("Invalid", async () => {
					it("Should revert if invalid utilizedERC20Amounts passed..", async () => {
						const INVALID_DEPOSIT_AMOUNT_A: BigNumber = ethers.utils.parseUnits("1", 18);
						const INVALID_DEPOSIT_AMOUNT_B: BigNumber = ethers.utils.parseUnits(".8", 18);

						// APPROVE - SI contract to spend tokens on behalf of owner
						await mockERC20A.approve(strategyInteractor.address, INVALID_DEPOSIT_AMOUNT_A);
						await mockERC20B.approve(strategyInteractor.address, INVALID_DEPOSIT_AMOUNT_B);

						// DEPOSIT - ERC20 tokens into the strategy
						await expect(
							strategy.utilizedERC20Deposit(
								owner.address,
								[INVALID_DEPOSIT_AMOUNT_A, INVALID_DEPOSIT_AMOUNT_B]
							)
						).to.be.rejectedWith(ERROR.STRATEGY.INVALID_UTILIZED_ERC20_AMOUNT);
					});

					it("Should be able to deposit ERC20s into strategy interactor..", async () => {
						const DEPOSIT_AMOUNTS: BigNumber[] = await strategyTransferUtil.calculateERC20Required(
							ethers.utils.parseUnits(".4", 18)
						);

						expect(DEPOSIT_AMOUNTS.length).to.be.equal(utilizedERC20.length);

						for (let i: number = 0; i < utilizedERC20.length; i++)
						{
							const IERC20 = await ethers.getContractAt(LOCATION_IERC20, utilizedERC20[i]);

							// APPROVE - SI contract to spend tokens on behalf of owner
							await IERC20.approve(strategyInteractor.address, DEPOSIT_AMOUNTS[i]);
						}

						// [main-test] Deposit ERC20 tokens into the strategy
						await expect(
							strategy.utilizedERC20Deposit(owner.address, DEPOSIT_AMOUNTS)
						).to.be.not.rejected;

						for (let i: number = 0; i < utilizedERC20.length; i++)
						{
							const IERC20 = await ethers.getContractAt(LOCATION_IERC20, utilizedERC20[i]);

							const BALANCE = await IERC20.balanceOf(strategyInteractor.address);

							// [main-test]
							expect(BALANCE).to.be.equal(DEPOSIT_AMOUNTS[i]);
						}
					});
				});

				describe("Valid", async () => {
					it("Should issue strategy ERC20 tokens upon utilized ERC20 deposit..", async () => {
						const DEPOSIT_AMOUNTS: BigNumber[] = await strategyTransferUtil.calculateERC20Required(
							ethers.utils.parseUnits("2", 18)
						);

						expect(DEPOSIT_AMOUNTS.length).to.be.equal(utilizedERC20.length);

						for (let i: number = 0; i < utilizedERC20.length; i++)
						{
							const IERC20 = await ethers.getContractAt(LOCATION_IERC20, utilizedERC20[i]);

							// APPROVE - SI contract to spend tokens on behalf of owner
							await IERC20.approve(strategyInteractor.address, DEPOSIT_AMOUNTS[i]);
						}

						// [main-test] Deposit ERC20 tokens into the strategy
						await expect(
							strategy.utilizedERC20Deposit(owner.address, DEPOSIT_AMOUNTS)
						).to.be.not.rejected;

						// Get current supply
						const TOTAL_SUPPLY_STRATEGY: BigNumber = await strategy.totalSupply();

						// Calculate minted amount
						const MINTED_STRATEGY_TOKENS: BigNumber = TOTAL_SUPPLY_STRATEGY.sub(b4TotalSupplyStrategy);

						// Get values
						const { totalEthValue } = await strategyTransferUtil.valueOfERC20Deposits(DEPOSIT_AMOUNTS);

						// Expect that the owner received the strategy tokens
						expect(await strategy.balanceOf(owner.address)).to.be.equal(MINTED_STRATEGY_TOKENS);

						// Expect that the strategy token amount issued is equal to the ETH value of the deposits
						expect(await strategy.balanceOf(owner.address)).to.be.equal(totalEthValue);
					});
				});
			});

			describe("[75/25]", async () => {
				beforeEach(async () => {
					// Set strategy ERC20 tokens
					b4TotalSupplyStrategy = await strategy.totalSupply();

					// Snapshot Total Supply
					await strategy.utilizedERC20Update(
						[mockERC20A.address, mockERC20B.address],
						[[true, true, PERCENT.SEVENTY_FIVE], [true, true, PERCENT.TWENTY_FIVE]]
					);

					// Capture utilized ERC20
					utilizedERC20 = await strategy.utilizedERC20();

					// Set SI
					await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

					// Toggle deposits on
					await strategy.utilizedERC20DepositOpenToggle();
				});

				describe("Invalid", async () => {
					it("Should revert if invalid utilizedERC20Amounts passed..", async () => {
						const INVALID_DEPOSIT_AMOUNT_A: BigNumber = ethers.utils.parseUnits(".5", 18);
						const INVALID_DEPOSIT_AMOUNT_B: BigNumber = ethers.utils.parseUnits(".25", 18);

						// APPROVE - SI contract to spend tokens on behalf of owner
						await mockERC20A.approve(strategyInteractor.address, INVALID_DEPOSIT_AMOUNT_A);
						await mockERC20B.approve(strategyInteractor.address, INVALID_DEPOSIT_AMOUNT_B);

						// [main-test] Deposit ERC20 tokens into the strategy
						await expect(
							strategy.utilizedERC20Deposit(
								owner.address,
								[INVALID_DEPOSIT_AMOUNT_A, INVALID_DEPOSIT_AMOUNT_B]
							)
						).to.be.rejectedWith(ERROR.STRATEGY.INVALID_UTILIZED_ERC20_AMOUNT);
					});
				});

				describe("Invalid", async () => {
					let depositAmounts: BigNumber[];


					beforeEach(async () => {
						depositAmounts = await strategyTransferUtil.calculateERC20Required(
							ethers.utils.parseUnits("3", 18)
						);

						expect(depositAmounts.length).to.be.equal(utilizedERC20.length);

						for (let i: number = 0; i < utilizedERC20.length; i++)
						{
							const IERC20 = await ethers.getContractAt(LOCATION_IERC20, utilizedERC20[i]);

							// APPROVE - SI contract to spend tokens on behalf of owner
							await IERC20.approve(strategyInteractor.address, depositAmounts[i]);
						}

						// [main-test] Deposit ERC20 tokens into the strategy
						await expect(strategy.utilizedERC20Deposit(owner.address, depositAmounts)).to.be.not.rejected;
					});


					it("Should be able to deposit ERC20s into strategy interactor..", async () => {
						for (let i: number = 0; i < utilizedERC20.length; i++)
						{
							const IERC20 = await ethers.getContractAt(LOCATION_IERC20, utilizedERC20[i]);

							// [main-test] Check balances of Utilized ERC20 tokens
							expect(await IERC20.balanceOf(strategyInteractor.address)).to.be.equal(
								depositAmounts[i]
							)
						}
					});

					it("Should issue strategy ERC20 tokens upon utilized ERC20 deposit..", async () => {
						// [calculate] YSS balance ETH Value = (a * p(a) / 1e18) + (b * p(b) / 1e18)
						const { totalEthValue } = await strategyTransferUtil.valueOfERC20Deposits(depositAmounts);

						// [main-test]
						expect(await strategy.balanceOf(owner.address)).to.be.equal(totalEthValue);
					});
				});
			});
		});
	});
});
