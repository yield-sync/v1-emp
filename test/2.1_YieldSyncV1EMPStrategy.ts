const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";

import { ERROR, PERCENT, D_18 } from "../const";
import StrategyTransferUtil from "../scripts/StrategyTransferUtil";


const LOCATION_IERC20: string = "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20";


describe("[2.1] YieldSyncV1EMPStrategy.sol - Depositing Tokens", async () => {
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

		// Deploy a strategy
		await expect(yieldSyncV1EMPStrategyDeployer.deployYieldSyncV1EMPStrategy("Strategy", "S")).to.be.not.reverted;

		// Expect that an address for the deployed strategy can be found on the registry
		expect(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(1)).to.be.not.equal(
			ethers.constants.AddressZero
		);

		// Attach the deployed YieldSyncV1EMPStrategy address
		yieldSyncV1EMPStrategy = await YieldSyncV1EMPStrategy.attach(
			String(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(1))
		);

		strategyTransferUtil = new StrategyTransferUtil(yieldSyncV1EMPStrategy, eTHValueFeed);
	});


	describe("function utilizedERC20Deposit()", async () => {
		describe("Set Up Process Test", async () => {
			it("[modifier] Should revert if ETH FEED is not set..", async () => {
				const [OWNER] = await ethers.getSigners();

				await expect(yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [])).to.be.rejectedWith(
					ERROR.ETH_FEED_NOT_SET
				);
			});

			it("[modifier] Should revert if strategy is not set..", async () => {
				const [OWNER] = await ethers.getSigners();

				await yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address);

				await expect(yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [])).to.be.rejectedWith(
					ERROR.STRATEGY_NOT_SET
				);
			});

			it("[modifier] Should only authorize authorized caller..", async () => {
				const [, ADDR_1] = await ethers.getSigners();

				// Set strategy ERC20 tokens
				await yieldSyncV1EMPStrategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address);

				await yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				await expect(
					yieldSyncV1EMPStrategy.connect(ADDR_1).utilizedERC20Deposit(ADDR_1.address, [])
				).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});

			it("Should revert if deposits not open..", async () => {
				const [OWNER] = await ethers.getSigners();

				// Set strategy ERC20 tokens
				await yieldSyncV1EMPStrategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address);

				await yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				// APPROVE - SI contract to spend tokens on behalf of OWNER
				await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT);

				// [main-test] Deposit ERC20 tokens into the strategy
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT, DEPOSIT_AMOUNT])
				).to.revertedWith(ERROR.DEPOSIT_NOT_OPEN);
			});

			it("Should revert if denominator is 0..", async () => {
				const [OWNER] = await ethers.getSigners();

				// Set strategy ERC20 tokens
				await yieldSyncV1EMPStrategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address);

				await yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				// Toggle deposits on
				await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();

				// Set ETH value to ZERO
				await eTHValueFeed.updateETHValue(0);

				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT])
				).to.be.revertedWith(
					ERROR.NOT_COMPUTED
				);
			});

			it("Should return false if INVALID ERC20 amounts passed..", async () => {
				const [OWNER] = await ethers.getSigners();

				// Set strategy ERC20 tokens
				await yieldSyncV1EMPStrategy.utilizedERC20Update(
					[mockERC20A.address, mockERC20B.address],
					[[true, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]]
				);

				await yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address);

				await yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				// Toggle deposits on
				await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();

				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [0, DEPOSIT_AMOUNT])
				).to.be.revertedWith(
					ERROR.INVALID_UTILIZED_ERC20_AMOUNT
				);
			});

			it("Should return false if INVALID ERC20 amounts with deposits set to false but non-zero deposit amount passed..", async () => {
				const [OWNER] = await ethers.getSigners();

				// Set strategy ERC20 tokens
				await yieldSyncV1EMPStrategy.utilizedERC20Update(
					[mockERC20A.address, mockERC20B.address],
					[[true, true, PERCENT.HUNDRED], [false, true, PERCENT.HUNDRED]]
				);

				await yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address);

				await yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				// Toggle deposits on
				await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();

				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT, DEPOSIT_AMOUNT])
				).to.be.revertedWith(
					ERROR.INVALID_UTILIZED_ERC20_AMOUNT_DEPOSIT_FALSE_AND_NON_ZERO_DEPOSIT
				);
			});
		});

		describe("[SINGLE ERC20]", async () => {
			let b4TotalSupplyStrategy: BigNumber;
			let utilizedERC20: string[];

			beforeEach(async () => {
				// Snapshot Total Supply
				b4TotalSupplyStrategy = await yieldSyncV1EMPStrategy.totalSupply();

				// Set strategy ERC20 tokens
				await yieldSyncV1EMPStrategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				// Capture utilized ERC20
				utilizedERC20 = await yieldSyncV1EMPStrategy.utilizedERC20();

				// Set value feed
				await yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address);

				// Set SI
				await yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				// Toggle deposits on
				await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
			});

			it("Should revert if invalid _utilizedERC20Amount.length passed..", async () => {
				const [OWNER] = await ethers.getSigners();

				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				// APPROVE - SI contract to spend tokens on behalf of OWNER
				await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT);

				// [main-test] Deposit ERC20 tokens into the strategy
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT, DEPOSIT_AMOUNT])
				).to.revertedWith(ERROR.INVALID_AMOUNT_LENGTH);
			});

			it("Should be able to deposit ERC20 into strategy interactor..", async () => {
				const [OWNER] = await ethers.getSigners();

				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				// APPROVE - SI contract to spend tokens on behalf of OWNER
				await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT);

				// DEPOSIT - ERC20 tokens into the strategy
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT])
				).to.be.not.reverted;

				const { totalEthValue } = await strategyTransferUtil.valueOfERC20Deposits([DEPOSIT_AMOUNT]);

				expect(await mockERC20A.balanceOf(strategyInteractor.address)).to.be.equal(totalEthValue);
			});

			it("Should issue strategy ERC20 tokens upon utilized ERC20 deposit..", async () => {
				const [OWNER] = await ethers.getSigners();

				const DEPOSIT_AMOUNTS: BigNumber[] = await strategyTransferUtil.calculateERC20RequiredByTotalAmount(
					ethers.utils.parseUnits("1", 18)
				);

				expect(DEPOSIT_AMOUNTS.length).to.be.equal(utilizedERC20.length);

				for (let i: number = 0; i < utilizedERC20.length; i++)
				{
					const IERC20 = await ethers.getContractAt(LOCATION_IERC20, utilizedERC20[i]);

					// APPROVE - SI contract to spend tokens on behalf of OWNER
					await IERC20.approve(strategyInteractor.address, DEPOSIT_AMOUNTS[i]);
				}

				// DEPOSIT - ERC20 tokens into the strategy
				await yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, DEPOSIT_AMOUNTS)

				// Get current supply
				const TOTAL_SUPPLY_STRATEGY: BigNumber = await yieldSyncV1EMPStrategy.totalSupply();

				// Calculate minted amount
				const MINTED_STRATEGY_TOKENS: BigNumber = TOTAL_SUPPLY_STRATEGY.sub(b4TotalSupplyStrategy);

				// Get values
				const { totalEthValue } = await strategyTransferUtil.valueOfERC20Deposits(DEPOSIT_AMOUNTS);

				// Expect that the OWNER received the strategy tokens
				expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(MINTED_STRATEGY_TOKENS);

				// Expect that the strategy token amount issued is equal to the ETH value of the deposits
				expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(totalEthValue);
			});
		});

		describe("[MULTIPLE ERC20]", async () => {
			let utilizedERC20: string[];
			let b4TotalSupplyStrategy: BigNumber;

			describe("[50/50]", async () => {
				beforeEach(async () => {
					// Snapshot Total Supply
					b4TotalSupplyStrategy = await yieldSyncV1EMPStrategy.totalSupply();

					// Set strategy ERC20 tokens
					await yieldSyncV1EMPStrategy.utilizedERC20Update(
						[mockERC20A.address, mockERC20B.address],
						[[true, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]]
					);

					// Capture utilized ERC20
					utilizedERC20 = await yieldSyncV1EMPStrategy.utilizedERC20();

					// Set value feed
					await yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address);

					// Set SI
					await yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

					// Toggle deposits on
					await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
				});

				it("Should revert if invalid utilizedERC20Amounts passed..", async () => {
					const [OWNER] = await ethers.getSigners();

					const INVALID_DEPOSIT_AMOUNT_A: BigNumber = ethers.utils.parseUnits("1", 18);
					const INVALID_DEPOSIT_AMOUNT_B: BigNumber = ethers.utils.parseUnits(".8", 18);

					// APPROVE - SI contract to spend tokens on behalf of OWNER
					await mockERC20A.approve(strategyInteractor.address, INVALID_DEPOSIT_AMOUNT_A);
					await mockERC20B.approve(strategyInteractor.address, INVALID_DEPOSIT_AMOUNT_B);

					// DEPOSIT - ERC20 tokens into the strategy
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Deposit(
							OWNER.address,
							[INVALID_DEPOSIT_AMOUNT_A, INVALID_DEPOSIT_AMOUNT_B]
						)
					).to.be.revertedWith(ERROR.INVALID_UTILIZED_ERC20_AMOUNT);
				});

				it("Should be able to deposit ERC20s into strategy interactor..", async () => {
					const [OWNER] = await ethers.getSigners();

					const DEPOSIT_AMOUNTS: BigNumber[] = await strategyTransferUtil.calculateERC20RequiredByTotalAmount(
						ethers.utils.parseUnits(".4", 18)
					);

					expect(DEPOSIT_AMOUNTS.length).to.be.equal(utilizedERC20.length);

					for (let i: number = 0; i < utilizedERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_IERC20, utilizedERC20[i]);

						// APPROVE - SI contract to spend tokens on behalf of OWNER
						await IERC20.approve(strategyInteractor.address, DEPOSIT_AMOUNTS[i]);
					}

					// [main-test] Deposit ERC20 tokens into the strategy
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, DEPOSIT_AMOUNTS)
					).to.be.not.reverted;

					for (let i: number = 0; i < utilizedERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_IERC20, utilizedERC20[i]);

						const BALANCE = await IERC20.balanceOf(strategyInteractor.address);

						// [main-test]
						expect(BALANCE).to.be.equal(DEPOSIT_AMOUNTS[i]);
					}
				});

				it("Should issue strategy ERC20 tokens upon utilized ERC20 deposit..", async () => {
					const [OWNER] = await ethers.getSigners();

					const DEPOSIT_AMOUNTS: BigNumber[] = await strategyTransferUtil.calculateERC20RequiredByTotalAmount(
						ethers.utils.parseUnits("2", 18)
					);

					expect(DEPOSIT_AMOUNTS.length).to.be.equal(utilizedERC20.length);

					for (let i: number = 0; i < utilizedERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_IERC20, utilizedERC20[i]);

						// APPROVE - SI contract to spend tokens on behalf of OWNER
						await IERC20.approve(strategyInteractor.address, DEPOSIT_AMOUNTS[i]);
					}

					// [main-test] Deposit ERC20 tokens into the strategy
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, DEPOSIT_AMOUNTS)
					).to.be.not.reverted;

					// Get current supply
					const TOTAL_SUPPLY_STRATEGY: BigNumber = await yieldSyncV1EMPStrategy.totalSupply();

					// Calculate minted amount
					const MINTED_STRATEGY_TOKENS: BigNumber = TOTAL_SUPPLY_STRATEGY.sub(b4TotalSupplyStrategy);

					// Get values
					const { totalEthValue } = await strategyTransferUtil.valueOfERC20Deposits(DEPOSIT_AMOUNTS);

					// Expect that the OWNER received the strategy tokens
					expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(MINTED_STRATEGY_TOKENS);

					// Expect that the strategy token amount issued is equal to the ETH value of the deposits
					expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(totalEthValue);
				});
			});

			describe("[75/25]", async () => {
				beforeEach(async () => {
					// Set strategy ERC20 tokens
					b4TotalSupplyStrategy = await yieldSyncV1EMPStrategy.totalSupply();

					// Snapshot Total Supply
					await yieldSyncV1EMPStrategy.utilizedERC20Update(
						[mockERC20A.address, mockERC20B.address],
						[[true, true, PERCENT.SEVENTY_FIVE], [true, true, PERCENT.TWENTY_FIVE]]
					);

					// Capture utilized ERC20
					utilizedERC20 = await yieldSyncV1EMPStrategy.utilizedERC20();

					// Set value feed
					await yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address);

					// Set SI
					await yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

					// Toggle deposits on
					await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
				});

				it("Should revert if invalid utilizedERC20Amounts passed..", async () => {
					const [OWNER] = await ethers.getSigners();

					const INVALID_DEPOSIT_AMOUNT_A: BigNumber = ethers.utils.parseUnits(".5", 18);
					const INVALID_DEPOSIT_AMOUNT_B: BigNumber = ethers.utils.parseUnits(".25", 18);

					// APPROVE - SI contract to spend tokens on behalf of OWNER
					await mockERC20A.approve(strategyInteractor.address, INVALID_DEPOSIT_AMOUNT_A);
					await mockERC20B.approve(strategyInteractor.address, INVALID_DEPOSIT_AMOUNT_B);

					// [main-test] Deposit ERC20 tokens into the strategy
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Deposit(
							OWNER.address,
							[INVALID_DEPOSIT_AMOUNT_A, INVALID_DEPOSIT_AMOUNT_B]
						)
					).to.be.revertedWith(ERROR.INVALID_UTILIZED_ERC20_AMOUNT);
				});

				it("Should be able to deposit ERC20s into strategy interactor..", async () => {
					const [OWNER] = await ethers.getSigners();

					const DEPOSIT_AMOUNTS: BigNumber[] = await strategyTransferUtil.calculateERC20RequiredByTotalAmount(
						ethers.utils.parseUnits("3", 18)
					);

					expect(DEPOSIT_AMOUNTS.length).to.be.equal(utilizedERC20.length);

					for (let i: number = 0; i < utilizedERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_IERC20, utilizedERC20[i]);

						// APPROVE - SI contract to spend tokens on behalf of OWNER
						await IERC20.approve(strategyInteractor.address, DEPOSIT_AMOUNTS[i]);
					}

					// [main-test] Deposit ERC20 tokens into the strategy
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, DEPOSIT_AMOUNTS)
					).to.be.not.reverted;

					for (let i: number = 0; i < utilizedERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_IERC20, utilizedERC20[i]);

						// [main-test] Check balances of Utilized ERC20 tokens
						expect(await IERC20.balanceOf(strategyInteractor.address)).to.be.equal(
							DEPOSIT_AMOUNTS[i]
						)
					}
				});

				it("Should issue strategy ERC20 tokens upon utilized ERC20 deposit..", async () => {
					const [OWNER] = await ethers.getSigners();

					const DEPOSIT_AMOUNTS: BigNumber[] = await strategyTransferUtil.calculateERC20RequiredByTotalAmount(
						ethers.utils.parseUnits("1", 18)
					);

					expect(DEPOSIT_AMOUNTS.length).to.be.equal(utilizedERC20.length);

					for (let i: number = 0; i < utilizedERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_IERC20, utilizedERC20[i]);

						// APPROVE - SI contract to spend tokens on behalf of OWNER
						await IERC20.approve(strategyInteractor.address, DEPOSIT_AMOUNTS[i]);
					}

					// DEPOSIT - ERC20 tokens into the strategy
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, DEPOSIT_AMOUNTS)
					).to.be.not.reverted;

					// [calculate] YSS balance ETH Value = (a * p(a) / 1e18) + (b * p(b) / 1e18)
					const { totalEthValue } = await strategyTransferUtil.valueOfERC20Deposits(DEPOSIT_AMOUNTS);

					// [main-test]
					expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(totalEthValue);
				});
			});
		});
	});
});
