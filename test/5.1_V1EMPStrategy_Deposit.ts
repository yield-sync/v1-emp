const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory, VoidSigner } from "ethers";

import { ERROR, PERCENT, D_18 } from "../const";
import StrategyTransferUtil from "../util/StrategyTransferUtil";


const LOCATION_IERC20: string = "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20";


describe("[5.1] V1EMPStrategy.sol - Depositing Tokens", async () => {
	let arrayUtility: Contract;
	let governance: Contract;
	let eTHValueFeed: Contract;
	let eTHValueFeedC: Contract;
	let strategyInteractor: Contract;
	let registry: Contract;
	let strategy: Contract;
	let strategyDeployer: Contract;
	let strategyUtility: Contract;
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;
	let mockERC20D: Contract;

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
		const V1EMPStrategyUtility: ContractFactory = await ethers.getContractFactory("V1EMPStrategyUtility");

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");


		governance = await (await YieldSyncGovernance.deploy()).deployed();

		await governance.payToUpdate(treasury.address);

		arrayUtility = await (await V1EMPArrayUtility.deploy()).deployed();

		registry = await (await V1EMPRegistry.deploy(governance.address)).deployed();

		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

		strategyUtility = await (await V1EMPStrategyUtility.deploy(registry.address)).deployed();

		await registry.v1EMPStrategyUtilityUpdate(strategyUtility.address);

		strategyDeployer = await (await V1EMPStrategyDeployer.deploy(registry.address)).deployed();

		mockERC20A = await (await MockERC20.deploy("Mock A", "A", 18)).deployed();
		mockERC20B = await (await MockERC20.deploy("Mock B", "B", 18)).deployed();
		mockERC20C = await (await MockERC20.deploy("Mock C", "C", 6)).deployed();
		mockERC20D = await (await MockERC20.deploy("Mock D", "D", 18)).deployed();

		eTHValueFeed = await (await ETHValueFeedDummy.deploy(18)).deployed();
		eTHValueFeedC = await (await ETHValueFeedDummy.deploy(6)).deployed();

		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20A.address, eTHValueFeed.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20B.address, eTHValueFeed.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20C.address, eTHValueFeedC.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20D.address, eTHValueFeed.address);

		strategyInteractor = await (await StrategyInteractorDummy.deploy()).deployed();

		/**
		* @notice The owner has to be registered as the EMP deployer so that it can authorize itself as an EMP to access the
		* functions available on the strategy.
		*/
		await registry.v1EMPUtilityUpdate(owner.address);
		await registry.v1EMPDeployerUpdate(owner.address);
		await registry.v1EMPRegister(owner.address);


		// Set EMP Strategy Deployer on registry
		await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);

		// Deploy EMP Strategy
		await strategyDeployer.deployV1EMPStrategy();

		// Attach the deployed V1EMPStrategy address
		strategy = await V1EMPStrategy.attach(String(await registry.v1EMPStrategyId_v1EMPStrategy(1)));

		strategyTransferUtil = new StrategyTransferUtil(strategy, registry);
	});


	describe("function utilizedERC20Deposit()", async () => {
		let utilizedERC20: string[];
		let b4TotalSupplyStrategy: BigNumber;


		describe("Modifier", async () => {
			it("[modifier] Should revert if Strategy Interactor is not set..", async () => {
				await expect(strategy.utilizedERC20Deposit([])).to.be.rejectedWith(
					ERROR.STRATEGY.INTERACTOR_NOT_SET
				);
			});

			it("[modifier] Should only authorize authorized caller..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				await expect(strategy.connect(badActor).utilizedERC20Deposit([])).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});
		});

		describe("Expected Failure", async () => {
			it("Should revert if deposits not open..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				// APPROVE - SI contract to spend tokens on behalf of owner
				await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT);

				// [main-test] Deposit ERC20 tokens into the strategy
				await expect(
					strategy.utilizedERC20Deposit([DEPOSIT_AMOUNT, DEPOSIT_AMOUNT])
				).to.rejectedWith(ERROR.STRATEGY.DEPOSIT_NOT_OPEN);
			});

			it("Should revert if invalid lengthed _utilizedERC20Amount passed..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				// Toggle deposits on
				await strategy.utilizedERC20DepositOpenToggle();

				await expect(strategy.utilizedERC20Deposit([])).to.be.rejectedWith(
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

				await expect(strategy.utilizedERC20Deposit([DEPOSIT_AMOUNT])).to.be.rejectedWith(
					ERROR.NOT_COMPUTED
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
					strategy.utilizedERC20Deposit([DEPOSIT_AMOUNT, DEPOSIT_AMOUNT])
				).to.be.rejectedWith(
					ERROR.STRATEGY.UTILIZED_ERC20_AMOUNT_NOT_ZERO
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

				await expect(strategy.utilizedERC20Deposit([0, DEPOSIT_AMOUNT])).to.be.rejectedWith(
					ERROR.STRATEGY.INVALID_UTILIZED_ERC20_AMOUNT
				);
			});
		});

		describe("[SINGLE ERC20]", async () => {
			beforeEach(async () => {
				// Snapshot Total Supply
				b4TotalSupplyStrategy = await strategy.sharesTotal();

				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				// Capture utilized ERC20
				utilizedERC20 = await strategy.utilizedERC20();

				// Set SI
				await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				// Toggle deposits on
				await strategy.utilizedERC20DepositOpenToggle();
			});


			describe("Expected Success", async () => {
				it("Should be able to deposit ERC20 into strategy interactor..", async () => {
					const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

					// APPROVE - SI contract to spend tokens on behalf of owner
					await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT);

					// DEPOSIT - ERC20 tokens into the strategy
					await expect(strategy.utilizedERC20Deposit([DEPOSIT_AMOUNT])).to.be.not.rejected;

					const { totalEthValue } = await strategyTransferUtil.valueOfERC20Deposits([DEPOSIT_AMOUNT]);

					expect(await mockERC20A.balanceOf(strategyInteractor.address)).to.be.equal(totalEthValue);
				});

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
					await strategy.utilizedERC20Deposit(DEPOSIT_AMOUNTS)

					// Get current supply
					const TOTAL_SUPPLY_STRATEGY: BigNumber = await strategy.sharesTotal();

					// Calculate minted amount
					const MINTED_STRATEGY_TOKENS: BigNumber = TOTAL_SUPPLY_STRATEGY.sub(b4TotalSupplyStrategy);

					// Get values
					const { totalEthValue } = await strategyTransferUtil.valueOfERC20Deposits(DEPOSIT_AMOUNTS);

					// Expect that the owner received the strategy tokens
					expect(await strategy.eMP_shares(owner.address)).to.be.equal(MINTED_STRATEGY_TOKENS);

					// Expect that the strategy token amount issued is equal to the ETH value of the deposits
					expect(await strategy.eMP_shares(owner.address)).to.be.equal(totalEthValue);
				});
			});
		});

		describe("[MULTIPLE ERC20] - A 40%, B 25%, C 25%, D 10%", async () => {
			beforeEach(async () => {
				// Set strategy ERC20 tokens
				b4TotalSupplyStrategy = await strategy.sharesTotal();

				// Snapshot Total Supply
				await strategy.utilizedERC20Update(
					[
						mockERC20A.address,
						mockERC20B.address,
						mockERC20C.address,
						mockERC20D.address,
					],
					[
						[true, true, PERCENT.FORTY],
						[true, true, PERCENT.TWENTY_FIVE],
						[true, true, PERCENT.TWENTY_FIVE],
						[true, true, PERCENT.TEN],
					]
				);

				// Capture utilized ERC20
				utilizedERC20 = await strategy.utilizedERC20();

				// Set SI
				await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				// Toggle deposits on
				await strategy.utilizedERC20DepositOpenToggle();
			});


			describe("Expected Failure", async () => {
				it("Should revert if invalid utilizedERC20Amounts passed..", async () => {
					const INVALID_DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits(".5", 18);

					// APPROVE - SI contract to spend tokens on behalf of owner
					await mockERC20A.approve(strategyInteractor.address, INVALID_DEPOSIT_AMOUNT);
					await mockERC20B.approve(strategyInteractor.address, INVALID_DEPOSIT_AMOUNT);
					await mockERC20C.approve(strategyInteractor.address, INVALID_DEPOSIT_AMOUNT);
					await mockERC20D.approve(strategyInteractor.address, INVALID_DEPOSIT_AMOUNT);

					// [main-test] Deposit ERC20 tokens into the strategy
					await expect(
						strategy.utilizedERC20Deposit(
							[
								INVALID_DEPOSIT_AMOUNT,
								INVALID_DEPOSIT_AMOUNT,
								INVALID_DEPOSIT_AMOUNT,
								INVALID_DEPOSIT_AMOUNT,
							]
						)
					).to.be.rejectedWith(
						ERROR.STRATEGY.INVALID_UTILIZED_ERC20_AMOUNT
					);
				});
			});

			describe("Expected Success", async () => {
				let depositAmounts: BigNumber[];


				beforeEach(async () => {
					depositAmounts = await strategyTransferUtil.calculateERC20Required(ethers.utils.parseUnits("3", 18));

					expect(depositAmounts.length).to.be.equal(utilizedERC20.length);

					for (let i: number = 0; i < utilizedERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_IERC20, utilizedERC20[i]);

						// APPROVE - SI contract to spend tokens on behalf of owner
						await IERC20.approve(strategyInteractor.address, depositAmounts[i]);
					}

					// [main-test] Deposit ERC20 tokens into the strategy
					await expect(strategy.utilizedERC20Deposit(depositAmounts)).to.be.not.rejected;
				});


				it("Should be able to deposit ERC20s into strategy interactor..", async () => {
					for (let i: number = 0; i < utilizedERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_IERC20, utilizedERC20[i]);

						// [main-test] Check balances of Utilized ERC20 tokens
						expect(await IERC20.balanceOf(strategyInteractor.address)).to.be.equal(depositAmounts[i]);
					}
				});

				it("Should issue strategy ERC20 tokens upon utilized ERC20 deposit..", async () => {
					const { totalEthValue } = await strategyTransferUtil.valueOfERC20Deposits(depositAmounts);

					// [main-test]
					expect(await strategy.eMP_shares(owner.address)).to.be.equal(totalEthValue);
				});
			});
		});
	});
});
