const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";

import { ERROR, PERCENT } from "../const";
import EMPTransferUtil from "../scripts/EMPTransferUtil";
import StrategyTransferUtil from "../scripts/StrategyTransferUtil";


const LOCATION_MOCKERC20: string = "MockERC20";


describe("[7.1] YieldSyncV1EMP.sol - Depositing Tokens", async () => {
	let arrayUtility: Contract;
	let governance: Contract;
	let eTHValueFeed: Contract;
	let eMP: Contract;
	let eMPDeployer: Contract;
	let eMPUtility: Contract;
	let registry: Contract;
	let strategyDeployer: Contract;
	let strategyInteractor: Contract;
	let strategyUtility: Contract;

	let eMPTransferUtil: EMPTransferUtil;

	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;

	let strategies: {
		contract: Contract,
		strategyTransferUtil: StrategyTransferUtil
	}[] = [];


	beforeEach("[beforeEach] Set up contracts..", async () => {
		/**
		* This beforeEach process does the following:
		* 1) Deploy a registry
		* 2) SEt the utilized tokens for the strats
		* 3) Deploys an EMP Deployer and registers it on the registry
		* 4) Attach the deployed EMP to a local variable (for accessing fn.)
		* 5) Deploy 2 strategies and make them fully operational by doing the following:
		* 	a) Attach the deployed EMP Strategy to a local variable
		* 	b) Set the ETH Value feed
		* 	c) Set the strategy interactor
		* 	d) Set the tokens for the strategy
		* 	e) Toggle on the withdrawals and depositing of tokens
		* 	f) Set the strategies[0].strategyTransferUtil for strategy
		*/
		const [OWNER, MANAGER, TREASURY] = await ethers.getSigners();


		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const YieldSyncV1EMP: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMP");
		const YieldSyncV1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPArrayUtility");
		const YieldSyncV1EMPDeployer: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPDeployer");
		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");
		const YieldSyncV1EMPStrategy: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategy");
		const YieldSyncV1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategyDeployer");
		const YieldSyncV1EMPStrategyUtility: ContractFactory= await ethers.getContractFactory("YieldSyncV1EMPStrategyUtility");
		const YieldSyncV1EMPUtility: ContractFactory= await ethers.getContractFactory("YieldSyncV1EMPUtility");

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");


		// Core contracts
		governance = await (await YieldSyncGovernance.deploy()).deployed();

		await governance.payToUpdate(TREASURY.address);

		arrayUtility = await (await YieldSyncV1EMPArrayUtility.deploy()).deployed();

		registry = await (await YieldSyncV1EMPRegistry.deploy(governance.address)).deployed();

		await registry.yieldSyncV1EMPArrayUtilityUpdate(arrayUtility.address);

		strategyUtility = await (await YieldSyncV1EMPStrategyUtility.deploy(registry.address)).deployed();

		await registry.yieldSyncV1EMPStrategyUtilityUpdate(strategyUtility.address);

		strategyDeployer = await (await YieldSyncV1EMPStrategyDeployer.deploy(registry.address)).deployed();

		await registry.yieldSyncV1EMPStrategyDeployerUpdate(strategyDeployer.address);

		eMPUtility = await (await YieldSyncV1EMPUtility.deploy(registry.address)).deployed();

		await registry.yieldSyncV1EMPUtilityUpdate(eMPUtility.address);

		eMPDeployer = await (await YieldSyncV1EMPDeployer.deploy(registry.address)).deployed();

		await registry.yieldSyncV1EMPDeployerUpdate(eMPDeployer.address);


		// Testing contracts
		mockERC20A = await (await MockERC20.deploy("Mock A", "A")).deployed();
		mockERC20B = await (await MockERC20.deploy("Mock B", "B")).deployed();
		mockERC20C = await (await MockERC20.deploy("Mock C", "C")).deployed();

		eTHValueFeed = await (await ETHValueFeedDummy.deploy()).deployed();

		await registry.eRC20_yieldSyncV1EMPERC20ETHValueFeedUpdate(mockERC20A.address, eTHValueFeed.address);
		await registry.eRC20_yieldSyncV1EMPERC20ETHValueFeedUpdate(mockERC20B.address, eTHValueFeed.address);
		await registry.eRC20_yieldSyncV1EMPERC20ETHValueFeedUpdate(mockERC20C.address, eTHValueFeed.address);

		strategyInteractor = await (await StrategyInteractorDummy.deploy()).deployed();


		/**
		* EMP
		*/
		// Deploy an EMP
		await eMPDeployer.deployYieldSyncV1EMP("EMP Name", "EMP");

		// Verify that a EMP has been registered
		expect(await registry.yieldSyncV1EMPId_yieldSyncV1EMP(1)).to.be.not.equal(ethers.constants.AddressZero);

		// Attach the deployed EMP address to a variable
		eMP = await YieldSyncV1EMP.attach(String(await registry.yieldSyncV1EMPId_yieldSyncV1EMP(1)));

		eMPTransferUtil = new EMPTransferUtil(eMP, registry);


		/**
		* EMP Strategies
		*/
		const deployStrategies = [
			{
				strategyUtilizedERC20: [mockERC20A.address, mockERC20B.address],
				strategyUtilization: [[true, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]]
			},
			{
				strategyUtilizedERC20: [mockERC20C.address],
				strategyUtilization: [[true, true, PERCENT.HUNDRED]],
			},
		];

		for (let i = 0; i < deployStrategies.length; i++)
		{
			// Deploy EMP Strategy
			await strategyDeployer.deployYieldSyncV1EMPStrategy(`EMP Strategy ${i}`, `EMPS${i}`);

			// Attach the deployed YieldSyncV1EMPStrategy address to variable
			let deployedYieldSyncV1EMPStrategy = await YieldSyncV1EMPStrategy.attach(
				String(await registry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(i + 1))
			);

			// Set the Strategy Interactor
			await deployedYieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

			await deployedYieldSyncV1EMPStrategy.utilizedERC20Update(
				deployStrategies[i].strategyUtilizedERC20,
				deployStrategies[i].strategyUtilization
			);

			// Enable Deposits and Withdraws
			await deployedYieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();

			expect(await deployedYieldSyncV1EMPStrategy.utilizedERC20DepositOpen()).to.be.true;

			await deployedYieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();

			expect(await deployedYieldSyncV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.true;

			strategies[i] = {
				contract: deployedYieldSyncV1EMPStrategy,
				strategyTransferUtil: new StrategyTransferUtil(deployedYieldSyncV1EMPStrategy, eTHValueFeed)
			};
		}
	});

	describe("function utilizedERC20Deposit()", async () => {
		describe("Invalid", async () => {
			it("Should NOT allow depositing if not open..", async () => {
				/**
				* @notice This test is to check that depositing must be toggled on in order to call the function properly.
				*/
				const UtilizedEMPStrategy: UtilizedEMPStrategyUpdate = [
					strategies[0].contract.address,
					strategies[1].contract.address,
				];

				const UtilizedEMPStrategyAllocation: UtilizedEMPStrategyAllocationUpdate = [PERCENT.FIFTY, PERCENT.FIFTY];

				// Set the utilzation to 2 different strategies
				await eMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedEMPStrategy, UtilizedEMPStrategyAllocation);

				// Even if utilizedERC20Amounts, the function should revert with reason that deposits are NOT open
				await expect(eMP.utilizedERC20Deposit([])).to.be.rejectedWith(
					ERROR.UTILIZED_YIELD_SYNC_V1_EMP_STRATEGY_DEPOSIT_NOT_OPEN
				);
			});

			it("Should NOT allow invalid length of _utilizedERC20Amount to be passed..", async () => {
				/**
				* @notice This test is to check that if the total amount of strategies is correctly set, then passing in a param
				* with incorrect first dimension of the 2d param will be rejected.
				*/
				const UtilizedEMPStrategy: UtilizedEMPStrategyUpdate = [strategies[0].contract.address];

				const UtilizedEMPStrategyAllocation: UtilizedEMPStrategyAllocationUpdate = [PERCENT.HUNDRED];

				// Set the utilization to 1 strategies
				await eMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedEMPStrategy, UtilizedEMPStrategyAllocation);

				// Open deposits
				await eMP.utilizedYieldSyncV1EMPStrategyDepositOpenToggle();

				// Pass in value for 0 strategies
				const INVALID: UtilizedERC20Amount = [];

				await expect(eMP.utilizedERC20Deposit(INVALID)).to.be.rejectedWith(ERROR.EMP.INVALID_UTILIZED_ERC20_LENGTH);
			});
		});

		describe("Valid", async () => {
			beforeEach(async () => {
				// Set the utilzation to 2 different strategies
				await eMP.utilizedYieldSyncV1EMPStrategyUpdate(
					[strategies[0].contract.address, strategies[1].contract.address] as UtilizedEMPStrategyUpdate,
					[PERCENT.FIFTY, PERCENT.FIFTY] as UtilizedEMPStrategyAllocationUpdate
				);

				// Set the utilzation to 2 different strategies
				await eMP.utilizedYieldSyncV1EMPStrategyDepositOpenToggle();

				eMPTransferUtil = new EMPTransferUtil(eMP, registry);
			});

			it("Should allow user to deposit tokens into the EMP and receive correct amount of ERC20..", async () => {
				/**
				* @notice This test should test that depositing correct amounts should work.
				*/
				const EMP_DEPOSIT_AMOUNTS: UtilizedERC20Amount = await eMPTransferUtil.calculateERC20Required(
					ethers.utils.parseUnits("2", 18)
				);

				const EMP_UTILIZED_ERC20 = await eMP.utilizedERC20();

				// Approve the ERC20 tokens for the strategy interactor
				for (let i = 0; i < EMP_UTILIZED_ERC20.length; i++)
				{
					const IERC20 = await ethers.getContractAt(LOCATION_MOCKERC20, EMP_UTILIZED_ERC20[i]);
					await IERC20.approve(eMP.address, EMP_DEPOSIT_AMOUNTS[i]);
				}

				// [main-test]
				await expect(eMP.utilizedERC20Deposit(EMP_DEPOSIT_AMOUNTS)).to.be.not.rejected;

				// Test SI balances
				for (let i = 0; i < EMP_UTILIZED_ERC20.length; i++)
				{
					const IERC20 = await ethers.getContractAt(LOCATION_MOCKERC20, EMP_UTILIZED_ERC20[i]);

					// [main-test]
					expect(await IERC20.balanceOf(eMP.address)).to.be.equal(EMP_DEPOSIT_AMOUNTS[i]);
				}
			});

			it("Should receive correct amount of ERC20 tokens upon depositing..", async () => {
				/**
				* @notice This test should test that depositing correct amounts should work and the msg.sender receives the
				* the tokens accordingly.
				*/
				const [OWNER] = await ethers.getSigners();

				const EMP_DEPOSIT_AMOUNTS: UtilizedERC20Amount = await eMPTransferUtil.calculateERC20Required(
					ethers.utils.parseUnits("2", 18)
				);

				const EMP_UTILIZED_ERC20 = await eMP.utilizedERC20();

				// Approve the ERC20 tokens for the strategy interactor
				for (let i = 0; i < EMP_UTILIZED_ERC20.length; i++)
				{
					const IERC20 = await ethers.getContractAt(LOCATION_MOCKERC20, EMP_UTILIZED_ERC20[i]);
					await IERC20.approve(eMP.address, EMP_DEPOSIT_AMOUNTS[i]);
				}

				// [main-test]
				await expect(eMP.utilizedERC20Deposit(EMP_DEPOSIT_AMOUNTS)).to.be.not.rejected;

				// Expect that the OWNER address received something
				expect(await eMP.balanceOf(OWNER.address)).to.be.greaterThan(0);

				// Get the total ETH Value of the deposited amount
				const { totalEthValue } = await eMPTransferUtil.valueOfERC20Deposits(EMP_DEPOSIT_AMOUNTS);

				// Expect that the EMP address received correct amount of Strategy tokens
				expect(await eMP.balanceOf(OWNER.address)).to.be.equal(totalEthValue);
			});

			describe("feeRate", async () => {
				it("Manager should receive correct amount of ERC20 if fee is set is greater than 0..", async () => {
					const [OWNER, MANAGER] = await ethers.getSigners();

					/**
					* @notice Because UTILIZED_STRATEGIES has 2 stratgies with a split of 50/50, the same amount (2) is set for
					* each.
					*/

					const STRATEGY_DEPOSIT_AMOUNTS: BigNumber[] = await strategies[0].strategyTransferUtil.calculateERC20Required(
						ethers.utils.parseUnits("2", 18)
					);

					const STRATEGY2_DEPOSIT_AMOUNTS: BigNumber[] = await strategies[1].strategyTransferUtil.calculateERC20Required(
						ethers.utils.parseUnits("2", 18)
					);

					// Pass in value for 2 strategies
					const VALID: UtilizedEMPStrategyERC20Amount = [
						[STRATEGY_DEPOSIT_AMOUNTS[0], STRATEGY_DEPOSIT_AMOUNTS[1]],
						[STRATEGY2_DEPOSIT_AMOUNTS[0]]
					];

					// Approve tokens
					await mockERC20A.approve(strategyInteractor.address, STRATEGY_DEPOSIT_AMOUNTS[0]);
					await mockERC20B.approve(strategyInteractor.address, STRATEGY_DEPOSIT_AMOUNTS[1]);
					await mockERC20C.approve(strategyInteractor.address, STRATEGY2_DEPOSIT_AMOUNTS[0]);

					// Set the fee rate for manager
					await expect(eMP.feeRateManagerUpdate(ethers.utils.parseUnits(".02", 18))).to.be.not.reverted;

					// Set manager fee to 2%
					expect(await eMP.feeRateManager()).to.be.equal(ethers.utils.parseUnits(".02", 18));

					// Set manager to ADDR_1
					await eMP.managerUpdate(MANAGER.address);

					expect(await eMP.manager()).to.be.equal(MANAGER.address);

					// [main-test]
					await expect(eMP.utilizedYieldSyncV1EMPStrategyDeposit(VALID)).to.be.not.reverted;

					// Validate balances
					expect(await mockERC20A.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY_DEPOSIT_AMOUNTS[0]);
					expect(await mockERC20B.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY_DEPOSIT_AMOUNTS[1]);
					expect(await mockERC20C.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY2_DEPOSIT_AMOUNTS[0]);

					// Expect that the OWNER address received something
					expect(await eMP.balanceOf(OWNER.address)).to.be.greaterThan(0);

					const { totalEthValue: strategyDepositEthValue } = await strategies[0].strategyTransferUtil.valueOfERC20Deposits(
						[STRATEGY_DEPOSIT_AMOUNTS[0], STRATEGY_DEPOSIT_AMOUNTS[1]]
					);

					// Expect that the EMP address received correct amount of Strategy tokens
					expect(await strategies[0].contract.balanceOf(eMP.address)).to.be.equal(strategyDepositEthValue);

					// Expect that the OWNER address received something greater than what was put into the 1st strategy
					expect(await eMP.balanceOf(OWNER.address)).to.be.greaterThan(strategyDepositEthValue);

					const { totalEthValue: strategy2DepositETHValue } = await strategies[1].strategyTransferUtil.valueOfERC20Deposits(
						[STRATEGY2_DEPOSIT_AMOUNTS[0]]
					)

					// Expect that the EMP address received correct amount of Strategy tokens
					expect(await strategies[1].contract.balanceOf(eMP.address)).to.be.equal(strategy2DepositETHValue);

					// Add up deposit amounts
					const TOTAL_DEPOSIT_VALUE: BigNumber = strategyDepositEthValue.add(strategy2DepositETHValue);

					// Expect that the OWNER address received something equal to what was deposited into all strategies via EMP
					expect(await eMP.balanceOf(OWNER.address)).to.be.lessThan(TOTAL_DEPOSIT_VALUE);

					// 98% of deposit value
					const VALUE_CUT = TOTAL_DEPOSIT_VALUE.mul(ethers.utils.parseUnits(".02", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the MANAGER address received 98% of the EMP tokens
					expect(await eMP.balanceOf(MANAGER.address)).to.be.equal(VALUE_CUT);

					// 98% of deposit value
					const VALUE_AFTER_CUT = TOTAL_DEPOSIT_VALUE.mul(ethers.utils.parseUnits(".98", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the OWNER address received 98% of the EMP tokens
					expect(await eMP.balanceOf(OWNER.address)).to.be.equal(VALUE_AFTER_CUT);
				});

				it("Yield Sync Governance should receive correct amount of ERC20 if fee is set is greater than 0..", async () => {
					const [OWNER, MANAGER, TREASURY] = await ethers.getSigners();

					/**
					* @notice Because UTILIZED_STRATEGIES has 2 stratgies with a split of 50/50, the same amount (2) is set for
					* each.
					*/

					const STRATEGY_DEPOSIT_AMOUNTS: BigNumber[] = await strategies[0].strategyTransferUtil.calculateERC20Required(
						ethers.utils.parseUnits("2", 18)
					);

					const STRATEGY2_DEPOSIT_AMOUNTS: BigNumber[] = await strategies[1].strategyTransferUtil.calculateERC20Required(
						ethers.utils.parseUnits("2", 18)
					);

					// Pass in value for 2 strategies
					const VALID: UtilizedEMPStrategyERC20Amount = [
						[STRATEGY_DEPOSIT_AMOUNTS[0], STRATEGY_DEPOSIT_AMOUNTS[1]],
						[STRATEGY2_DEPOSIT_AMOUNTS[0]]
					];

					// Approve tokens
					await mockERC20A.approve(strategyInteractor.address, STRATEGY_DEPOSIT_AMOUNTS[0]);
					await mockERC20B.approve(strategyInteractor.address, STRATEGY_DEPOSIT_AMOUNTS[1]);
					await mockERC20C.approve(strategyInteractor.address, STRATEGY2_DEPOSIT_AMOUNTS[0]);

					// Set YS Gov fee to 2%
					await eMP.feeRateYieldSyncGovernanceUpdate(ethers.utils.parseUnits(".02", 18));

					expect(await eMP.feeRateYieldSyncGovernance()).to.be.equal(ethers.utils.parseUnits(".02", 18));


					// [main-test]
					await expect(eMP.utilizedYieldSyncV1EMPStrategyDeposit(VALID)).to.be.not.reverted;

					// Validate balances
					expect(await mockERC20A.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY_DEPOSIT_AMOUNTS[0]);
					expect(await mockERC20B.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY_DEPOSIT_AMOUNTS[1]);
					expect(await mockERC20C.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY2_DEPOSIT_AMOUNTS[0]);

					// Expect that the OWNER address received something
					expect(await eMP.balanceOf(OWNER.address)).to.be.greaterThan(0);

					const { totalEthValue: strategyDepositEthValue } = await strategies[0].strategyTransferUtil.valueOfERC20Deposits(
						[STRATEGY_DEPOSIT_AMOUNTS[0], STRATEGY_DEPOSIT_AMOUNTS[1]]
					);

					// Expect that the EMP address received correct amount of Strategy tokens
					expect(await strategies[0].contract.balanceOf(eMP.address)).to.be.equal(strategyDepositEthValue);

					// Expect that the OWNER address received something greater than what was put into the 1st strategy
					expect(await eMP.balanceOf(OWNER.address)).to.be.greaterThan(strategyDepositEthValue);

					const { totalEthValue: strategy2DepositETHValue } = await strategies[1].strategyTransferUtil.valueOfERC20Deposits(
						[STRATEGY2_DEPOSIT_AMOUNTS[0]]
					)

					// Expect that the EMP address received correct amount of Strategy tokens
					expect(await strategies[1].contract.balanceOf(eMP.address)).to.be.equal(strategy2DepositETHValue);

					// Add up deposit amounts
					const TOTAL_DEPOSIT_VALUE: BigNumber = strategyDepositEthValue.add(strategy2DepositETHValue);

					// Expect that the MANAGER address received 0% of the EMP tokens
					expect(await eMP.balanceOf(MANAGER.address)).to.be.equal(0);

					// 2% of deposit value
					const VALUE_CUT = TOTAL_DEPOSIT_VALUE.mul(ethers.utils.parseUnits(".02", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the TREASURY address received 98% of the EMP tokens
					expect(await eMP.balanceOf(TREASURY.address)).to.be.equal(VALUE_CUT);

					// 98% of deposit value
					const VALUE_AFTER_CUT = TOTAL_DEPOSIT_VALUE.mul(ethers.utils.parseUnits(".98", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the OWNER address received something equal to what was deposited into all strategies via EMP
					expect(await eMP.balanceOf(OWNER.address)).to.be.lessThan(TOTAL_DEPOSIT_VALUE);

					// Expect that the OWNER address received 98% of the EMP tokens
					expect(await eMP.balanceOf(OWNER.address)).to.be.equal(VALUE_AFTER_CUT);
				});

				it("Manager & Yield Sync Governance should receive correct amounts of ERC20 if fees are set to greater than 0..", async () => {
					const [OWNER, MANAGER, TREASURY] = await ethers.getSigners();

					/**
					* @notice Because UTILIZED_STRATEGIES has 2 stratgies with a split of 50/50, the same amount (2) is set for
					* each.
					*/

					const STRATEGY_DEPOSIT_AMOUNTS: BigNumber[] = await strategies[0].strategyTransferUtil.calculateERC20Required(
						ethers.utils.parseUnits("2", 18)
					);

					const STRATEGY2_DEPOSIT_AMOUNTS: BigNumber[] = await strategies[1].strategyTransferUtil.calculateERC20Required(
						ethers.utils.parseUnits("2", 18)
					);

					// Pass in value for 2 strategies
					const VALID: UtilizedEMPStrategyERC20Amount = [
						[STRATEGY_DEPOSIT_AMOUNTS[0], STRATEGY_DEPOSIT_AMOUNTS[1]],
						[STRATEGY2_DEPOSIT_AMOUNTS[0]]
					];

					// Approve tokens
					await mockERC20A.approve(strategyInteractor.address, STRATEGY_DEPOSIT_AMOUNTS[0]);
					await mockERC20B.approve(strategyInteractor.address, STRATEGY_DEPOSIT_AMOUNTS[1]);
					await mockERC20C.approve(strategyInteractor.address, STRATEGY2_DEPOSIT_AMOUNTS[0]);

					// Set manager fee to 2%
					await expect(eMP.feeRateManagerUpdate(ethers.utils.parseUnits(".02", 18))).to.be.not.reverted;

					// Set YS Gov fee to 2%
					await expect(eMP.feeRateYieldSyncGovernanceUpdate(ethers.utils.parseUnits(".02", 18))).to.be.not.reverted;

					expect(await eMP.feeRateManager()).to.be.equal(ethers.utils.parseUnits(".02", 18));

					expect(await eMP.feeRateYieldSyncGovernance()).to.be.equal(ethers.utils.parseUnits(".02", 18));

					// Set manager to ADDR_1
					await eMP.managerUpdate(MANAGER.address);

					expect(await eMP.manager()).to.be.equal(MANAGER.address);

					// [main-test]
					await expect(eMP.utilizedYieldSyncV1EMPStrategyDeposit(VALID)).to.be.not.reverted;

					// Validate balances
					expect(await mockERC20A.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY_DEPOSIT_AMOUNTS[0]);
					expect(await mockERC20B.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY_DEPOSIT_AMOUNTS[1]);
					expect(await mockERC20C.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY2_DEPOSIT_AMOUNTS[0]);

					// Expect that the OWNER address received something
					expect(await eMP.balanceOf(OWNER.address)).to.be.greaterThan(0);

					const { totalEthValue: strategyDepositEthValue } = await strategies[0].strategyTransferUtil.valueOfERC20Deposits(
						[STRATEGY_DEPOSIT_AMOUNTS[0], STRATEGY_DEPOSIT_AMOUNTS[1]]
					);

					// Expect that the EMP address received correct amount of Strategy tokens
					expect(await strategies[0].contract.balanceOf(eMP.address)).to.be.equal(strategyDepositEthValue);

					// Expect that the OWNER address received something greater than what was put into the 1st strategy
					expect(await eMP.balanceOf(OWNER.address)).to.be.greaterThan(strategyDepositEthValue);

					const { totalEthValue: strategy2DepositETHValue } = await strategies[1].strategyTransferUtil.valueOfERC20Deposits(
						[STRATEGY2_DEPOSIT_AMOUNTS[0]]
					)

					// Expect that the EMP address received correct amount of Strategy tokens
					expect(await strategies[1].contract.balanceOf(eMP.address)).to.be.equal(strategy2DepositETHValue);

					// Add up deposit amounts
					const TOTAL_DEPOSIT_VALUE: BigNumber = strategyDepositEthValue.add(strategy2DepositETHValue);

					// 2% of deposit value
					const VALUE_CUT = TOTAL_DEPOSIT_VALUE.mul(ethers.utils.parseUnits(".02", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the MANAGER address received 0% of the EMP tokens
					expect(await eMP.balanceOf(MANAGER.address)).to.be.equal(VALUE_CUT);

					// Expect that the TREASURY address received 98% of the EMP tokens
					expect(await eMP.balanceOf(TREASURY.address)).to.be.equal(VALUE_CUT);

					// 98% of deposit value
					const VALUE_AFTER_CUT = TOTAL_DEPOSIT_VALUE.mul(ethers.utils.parseUnits(".96", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the OWNER address received something equal to what was deposited into all strategies via EMP
					expect(await eMP.balanceOf(OWNER.address)).to.be.lessThan(TOTAL_DEPOSIT_VALUE);

					// Expect that the OWNER address received 98% of the EMP tokens
					expect(await eMP.balanceOf(OWNER.address)).to.be.equal(VALUE_AFTER_CUT);
				});
			});
		});
	});

	describe("function utilizedYieldSyncV1EMPStrategyDeposit()", async () => {
		describe("Invalid", async () => {
			it("Should NOT allow depositing if not open..", async () => {
				/**
				* @notice This test is to check that depositing must be toggled on in order to call the function properly.
				*/
				const UtilizedEMPStrategy: UtilizedEMPStrategyUpdate = [
					strategies[0].contract.address,
					strategies[1].contract.address,
				];

				const UtilizedEMPStrategyAllocation: UtilizedEMPStrategyAllocationUpdate = [PERCENT.FIFTY, PERCENT.FIFTY];

				// Set the utilzation to 2 different strategies
				await eMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedEMPStrategy, UtilizedEMPStrategyAllocation);

				// Even if utilizedERC20Amounts, the function should revert with reason that deposits are NOT open
				await expect(eMP.utilizedYieldSyncV1EMPStrategyDeposit([[], []])).to.be.rejectedWith(
					ERROR.UTILIZED_YIELD_SYNC_V1_EMP_STRATEGY_DEPOSIT_NOT_OPEN
				);
			});

			it("Should NOT allow invalid length of _utilizedYieldSyncV1EMPStrategyERC20Amount to be passed (1D)..", async () => {
				/**
				* @notice This test is to check that if the total amount of strategies is correctly set, then passing in a param
				* with incorrect first dimension of the 2d param will be rejected.
				*/
				const UtilizedEMPStrategy: UtilizedEMPStrategyUpdate = [strategies[0].contract.address];

				const UtilizedEMPStrategyAllocation: UtilizedEMPStrategyAllocationUpdate = [PERCENT.HUNDRED];

				// Set the utilization to a single strategies
				await eMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedEMPStrategy, UtilizedEMPStrategyAllocation);

				// Open deposits
				await eMP.utilizedYieldSyncV1EMPStrategyDepositOpenToggle();

				// Pass in value for 0 strategies
				const INVALID: UtilizedEMPStrategyERC20Amount = [];

				await expect(eMP.utilizedYieldSyncV1EMPStrategyDeposit(INVALID)).to.be.rejectedWith(
					ERROR.INVALID_UTILIZED_ERC20_AMOUNT_EMP
				);

				// Close deposits
				await eMP.utilizedYieldSyncV1EMPStrategyDepositOpenToggle();

				const UtilizedEMPStrategy2: UtilizedEMPStrategyUpdate = [
					strategies[0].contract.address,
					strategies[1].contract.address,
				];

				const UtilizedEMPStrategyAllocation2: UtilizedEMPStrategyAllocationUpdate = [PERCENT.FIFTY, PERCENT.FIFTY];

				// Set the utilization to 2 strategies
				await eMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedEMPStrategy2, UtilizedEMPStrategyAllocation2);

				// Open deposits
				await eMP.utilizedYieldSyncV1EMPStrategyDepositOpenToggle();

				// Pass in value for 1 strategies (should require 2)
				const INVALID2: UtilizedEMPStrategyERC20Amount = [
					[ethers.utils.parseUnits("2", 18), ethers.utils.parseUnits("2", 18)]
				];

				await expect(eMP.utilizedYieldSyncV1EMPStrategyDeposit(INVALID2)).to.be.rejectedWith(
					ERROR.INVALID_UTILIZED_ERC20_AMOUNT_EMP
				);
			});

			it("Should NOT allow invalid length of _utilizedYieldSyncV1EMPStrategyERC20Amount to be passed (2D)..", async () => {
				/**
				* @notice This test should test that depositing the incorrect amounts (within the 2nd dimension of
				* _utilizedERC20Amount) the function should revert.
				*/
				const UTILIZED_STRATEGIES: UtilizedEMPStrategyUpdate = [
					strategies[0].contract.address,
					strategies[1].contract.address,
				];

				const UtilizedEMPStrategyAllocation: UtilizedEMPStrategyAllocationUpdate = [PERCENT.FIFTY, PERCENT.FIFTY];

				// Set the utilzation to 2 different strategies
				await expect(
					eMP.utilizedYieldSyncV1EMPStrategyUpdate(UTILIZED_STRATEGIES, UtilizedEMPStrategyAllocation)
				).to.be.not.reverted;

				// Set the utilzation to 2 different strategies
				await eMP.utilizedYieldSyncV1EMPStrategyDepositOpenToggle();

				/**
				* @notice Because UTILIZED_STRATEGIES has 2 stratgies with a split of 50/50, the same amount (2) is set for
				* each.
				*/

				const STRATEGY_DEPOSIT_AMOUNTS: BigNumber[] = await strategies[0].strategyTransferUtil.calculateERC20Required(
					ethers.utils.parseUnits("2", 18)
				);

				const STRATEGY2_DEPOSIT_AMOUNTS: BigNumber[] = await strategies[1].strategyTransferUtil.calculateERC20Required(
					ethers.utils.parseUnits("2", 18)
				);

				// Pass in value for 2 strategies
				const INVALID: UtilizedEMPStrategyERC20Amount = [
					[STRATEGY_DEPOSIT_AMOUNTS[0], STRATEGY_DEPOSIT_AMOUNTS[1]],
					[STRATEGY2_DEPOSIT_AMOUNTS[0], ethers.utils.parseUnits("1", 18)]
				];

				// Approve tokens
				await mockERC20A.approve(strategyInteractor.address, STRATEGY_DEPOSIT_AMOUNTS[0]);
				await mockERC20B.approve(strategyInteractor.address, STRATEGY_DEPOSIT_AMOUNTS[1]);
				await mockERC20C.approve(strategyInteractor.address, STRATEGY2_DEPOSIT_AMOUNTS[0]);

				await expect(eMP.utilizedYieldSyncV1EMPStrategyDeposit(INVALID)).to.be.rejectedWith(
					ERROR.INVALID_AMOUNT_LENGTH
				);
			});

			it("Should NOT allow invalid _utilizedYieldSyncV1EMPStrategyERC20Amount to be passed (2D)..", async () => {
				/**
				* @notice This test should test that depositing the incorrect amounts (within the 2nd dimension of
				* _utilizedERC20Amount) the function should revert.
				*/
				const UtilizedEMPStrategy: UtilizedEMPStrategyUpdate = [
					strategies[0].contract.address,
					strategies[1].contract.address,
				];

				const UtilizedEMPStrategyAllocation: UtilizedEMPStrategyAllocationUpdate = [PERCENT.FIFTY, PERCENT.FIFTY];

				// Set the utilzation to 2 different strategies
				await eMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedEMPStrategy, UtilizedEMPStrategyAllocation);

				// Set the utilzation to 2 different strategies
				await eMP.utilizedYieldSyncV1EMPStrategyDepositOpenToggle();

				/**
				* @notice Because UTILIZED_STRATEGIES has 2 stratgies with a split of 50/50, the same amount (2) is set for
				* each.
				*/

				const STRATEGY_DEPOSIT_AMOUNTS: BigNumber[] = await strategies[0].strategyTransferUtil.calculateERC20Required(
					ethers.utils.parseUnits("2", 18)
				);

				// Invalid amount. Should be 2
				const STRATEGY2_DEPOSIT_AMOUNTS: BigNumber[] = await strategies[1].strategyTransferUtil.calculateERC20Required(
					ethers.utils.parseUnits("1", 18)
				);

				// Pass in value for 2 strategies
				const INVALID: UtilizedEMPStrategyERC20Amount = [
					[STRATEGY_DEPOSIT_AMOUNTS[0], STRATEGY_DEPOSIT_AMOUNTS[1]],
					[STRATEGY2_DEPOSIT_AMOUNTS[0]]
				];

				// Approve tokens
				await mockERC20A.approve(strategyInteractor.address, STRATEGY_DEPOSIT_AMOUNTS[0]);
				await mockERC20B.approve(strategyInteractor.address, STRATEGY_DEPOSIT_AMOUNTS[1]);
				await mockERC20C.approve(strategyInteractor.address, STRATEGY2_DEPOSIT_AMOUNTS[0]);

				await expect(eMP.utilizedYieldSyncV1EMPStrategyDeposit(INVALID)).to.be.rejectedWith(
					ERROR.UTILIZED_YIELD_SYNC_V1_EMP_STRATEGY_INVAID_DEPOSIT_AMOUNT
				);
			});
		});

		describe("Valid", async () => {
			it("Should allow user to deposit tokens into the EMP and receive correct amount of ERC20..", async () => {
				/**
				* @notice This test should test that depositing correct amounts should work.
				*/
				const UtilizedEMPStrategy: UtilizedEMPStrategyUpdate = [
					strategies[0].contract.address,
					strategies[1].contract.address,
				];

				const UtilizedEMPStrategyAllocation: UtilizedEMPStrategyAllocationUpdate = [PERCENT.FIFTY, PERCENT.FIFTY];

				// Set the utilzation to 2 different strategies
				await eMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedEMPStrategy, UtilizedEMPStrategyAllocation);

				// Set the utilzation to 2 different strategies
				await eMP.utilizedYieldSyncV1EMPStrategyDepositOpenToggle();

				/**
				* @notice Because UTILIZED_STRATEGIES has 2 stratgies with a split of 50/50, the same amount (2) is set for
				* each.
				*/

				const STRATEGY_DEPOSIT_AMOUNTS: BigNumber[] = await strategies[0].strategyTransferUtil.calculateERC20Required(
					ethers.utils.parseUnits("2", 18)
				);

				const STRATEGY2_DEPOSIT_AMOUNTS: BigNumber[] = await strategies[1].strategyTransferUtil.calculateERC20Required(
					ethers.utils.parseUnits("2", 18)
				);

				// Pass in value for 2 strategies
				const VALID: UtilizedEMPStrategyERC20Amount = [
					[STRATEGY_DEPOSIT_AMOUNTS[0], STRATEGY_DEPOSIT_AMOUNTS[1]],
					[STRATEGY2_DEPOSIT_AMOUNTS[0]]
				];

				// Approve tokens
				await mockERC20A.approve(strategyInteractor.address, STRATEGY_DEPOSIT_AMOUNTS[0]);
				await mockERC20B.approve(strategyInteractor.address, STRATEGY_DEPOSIT_AMOUNTS[1]);
				await mockERC20C.approve(strategyInteractor.address, STRATEGY2_DEPOSIT_AMOUNTS[0]);

				// [main-test]
				await expect(eMP.utilizedYieldSyncV1EMPStrategyDeposit(VALID)).to.be.not.reverted;

				// Validate balances
				expect(await mockERC20A.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY_DEPOSIT_AMOUNTS[0]);
				expect(await mockERC20B.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY_DEPOSIT_AMOUNTS[1]);
				expect(await mockERC20C.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY2_DEPOSIT_AMOUNTS[0]);
			});

			it("Should receive correct amount of ERC20 tokens upon depositing..", async () => {
				/**
				* @notice This test should test that depositing correct amounts should work and the msg.sender receives the
				* the tokens accordingly.
				*/
				const [OWNER] = await ethers.getSigners();

				const UtilizedEMPStrategy: UtilizedEMPStrategyUpdate = [
					strategies[0].contract.address,
					strategies[1].contract.address,
				];

				const UtilizedEMPStrategyAllocation: UtilizedEMPStrategyAllocationUpdate = [PERCENT.FIFTY, PERCENT.FIFTY];

				// Set the utilzation to 2 different strategies
				await eMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedEMPStrategy, UtilizedEMPStrategyAllocation);

				// Set the utilzation to 2 different strategies
				await eMP.utilizedYieldSyncV1EMPStrategyDepositOpenToggle();

				/**
				* @notice Because UTILIZED_STRATEGIES has 2 stratgies with a split of 50/50, the same amount (2) is set for
				* each.
				*/

				const STRATEGY_DEPOSIT_AMOUNTS: BigNumber[] = await strategies[0].strategyTransferUtil.calculateERC20Required(
					ethers.utils.parseUnits("2", 18)
				);

				const STRATEGY2_DEPOSIT_AMOUNTS: BigNumber[] = await strategies[1].strategyTransferUtil.calculateERC20Required(
					ethers.utils.parseUnits("2", 18)
				);

				// Pass in value for 2 strategies
				const VALID: UtilizedEMPStrategyERC20Amount = [
					[STRATEGY_DEPOSIT_AMOUNTS[0], STRATEGY_DEPOSIT_AMOUNTS[1]],
					[STRATEGY2_DEPOSIT_AMOUNTS[0]]
				];

				// Approve tokens
				await mockERC20A.approve(strategyInteractor.address, STRATEGY_DEPOSIT_AMOUNTS[0]);
				await mockERC20B.approve(strategyInteractor.address, STRATEGY_DEPOSIT_AMOUNTS[1]);
				await mockERC20C.approve(strategyInteractor.address, STRATEGY2_DEPOSIT_AMOUNTS[0]);

				// [main-test]
				await expect(eMP.utilizedYieldSyncV1EMPStrategyDeposit(VALID)).to.be.not.reverted;

				// Validate balances
				expect(await mockERC20A.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY_DEPOSIT_AMOUNTS[0]);
				expect(await mockERC20B.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY_DEPOSIT_AMOUNTS[1]);
				expect(await mockERC20C.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY2_DEPOSIT_AMOUNTS[0]);

				// Expect that the OWNER address received something
				expect(await eMP.balanceOf(OWNER.address)).to.be.greaterThan(0);

				const { totalEthValue: strategyDepositEthValue } = await strategies[0].strategyTransferUtil.valueOfERC20Deposits(
					[STRATEGY_DEPOSIT_AMOUNTS[0], STRATEGY_DEPOSIT_AMOUNTS[1]]
				);

				// Expect that the EMP address received correct amount of Strategy tokens
				expect(await strategies[0].contract.balanceOf(eMP.address)).to.be.equal(strategyDepositEthValue);

				// Expect that the OWNER address received something greater than what was put into the 1st strategy
				expect(await eMP.balanceOf(OWNER.address)).to.be.greaterThan(strategyDepositEthValue);

				const { totalEthValue: strategy2DepositETHValue } = await strategies[1].strategyTransferUtil.valueOfERC20Deposits(
					[STRATEGY2_DEPOSIT_AMOUNTS[0]]
				)

				// Expect that the EMP address received correct amount of Strategy tokens
				expect(await strategies[1].contract.balanceOf(eMP.address)).to.be.equal(strategy2DepositETHValue);

				// Add up deposit amounts
				const TOTAL_DEPOSIT_VALUE: BigNumber = strategyDepositEthValue.add(strategy2DepositETHValue);

				// Expect that the OWNER address received something equal to what was deposited into all strategies via EMP
				expect(await eMP.balanceOf(OWNER.address)).to.be.equal(TOTAL_DEPOSIT_VALUE);
			});

			describe("feeRate", async () => {
				it("Manager should receive correct amount of ERC20 if fee is set is greater than 0..", async () => {
					const [OWNER, MANAGER] = await ethers.getSigners();

					const UtilizedEMPStrategy: UtilizedEMPStrategyUpdate = [
						strategies[0].contract.address,
						strategies[1].contract.address,
					];

					const UtilizedEMPStrategyAllocation: UtilizedEMPStrategyAllocationUpdate = [PERCENT.FIFTY, PERCENT.FIFTY];

					// Set the utilzation to 2 different strategies
					await eMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedEMPStrategy, UtilizedEMPStrategyAllocation);

					// Set the utilzation to 2 different strategies
					await eMP.utilizedYieldSyncV1EMPStrategyDepositOpenToggle();

					/**
					* @notice Because UTILIZED_STRATEGIES has 2 stratgies with a split of 50/50, the same amount (2) is set for
					* each.
					*/

					const STRATEGY_DEPOSIT_AMOUNTS: BigNumber[] = await strategies[0].strategyTransferUtil.calculateERC20Required(
						ethers.utils.parseUnits("2", 18)
					);

					const STRATEGY2_DEPOSIT_AMOUNTS: BigNumber[] = await strategies[1].strategyTransferUtil.calculateERC20Required(
						ethers.utils.parseUnits("2", 18)
					);

					// Pass in value for 2 strategies
					const VALID: UtilizedEMPStrategyERC20Amount = [
						[STRATEGY_DEPOSIT_AMOUNTS[0], STRATEGY_DEPOSIT_AMOUNTS[1]],
						[STRATEGY2_DEPOSIT_AMOUNTS[0]]
					];

					// Approve tokens
					await mockERC20A.approve(strategyInteractor.address, STRATEGY_DEPOSIT_AMOUNTS[0]);
					await mockERC20B.approve(strategyInteractor.address, STRATEGY_DEPOSIT_AMOUNTS[1]);
					await mockERC20C.approve(strategyInteractor.address, STRATEGY2_DEPOSIT_AMOUNTS[0]);

					// Set the fee rate for manager
					await expect(eMP.feeRateManagerUpdate(ethers.utils.parseUnits(".02", 18))).to.be.not.reverted;

					// Set manager fee to 2%
					expect(await eMP.feeRateManager()).to.be.equal(ethers.utils.parseUnits(".02", 18));

					// Set manager to ADDR_1
					await eMP.managerUpdate(MANAGER.address);

					expect(await eMP.manager()).to.be.equal(MANAGER.address);

					// [main-test]
					await expect(eMP.utilizedYieldSyncV1EMPStrategyDeposit(VALID)).to.be.not.reverted;

					// Validate balances
					expect(await mockERC20A.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY_DEPOSIT_AMOUNTS[0]);
					expect(await mockERC20B.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY_DEPOSIT_AMOUNTS[1]);
					expect(await mockERC20C.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY2_DEPOSIT_AMOUNTS[0]);

					// Expect that the OWNER address received something
					expect(await eMP.balanceOf(OWNER.address)).to.be.greaterThan(0);

					const { totalEthValue: strategyDepositEthValue } = await strategies[0].strategyTransferUtil.valueOfERC20Deposits(
						[STRATEGY_DEPOSIT_AMOUNTS[0], STRATEGY_DEPOSIT_AMOUNTS[1]]
					);

					// Expect that the EMP address received correct amount of Strategy tokens
					expect(await strategies[0].contract.balanceOf(eMP.address)).to.be.equal(strategyDepositEthValue);

					// Expect that the OWNER address received something greater than what was put into the 1st strategy
					expect(await eMP.balanceOf(OWNER.address)).to.be.greaterThan(strategyDepositEthValue);

					const { totalEthValue: strategy2DepositETHValue } = await strategies[1].strategyTransferUtil.valueOfERC20Deposits(
						[STRATEGY2_DEPOSIT_AMOUNTS[0]]
					)

					// Expect that the EMP address received correct amount of Strategy tokens
					expect(await strategies[1].contract.balanceOf(eMP.address)).to.be.equal(strategy2DepositETHValue);

					// Add up deposit amounts
					const TOTAL_DEPOSIT_VALUE: BigNumber = strategyDepositEthValue.add(strategy2DepositETHValue);

					// Expect that the OWNER address received something equal to what was deposited into all strategies via EMP
					expect(await eMP.balanceOf(OWNER.address)).to.be.lessThan(TOTAL_DEPOSIT_VALUE);

					// 98% of deposit value
					const VALUE_CUT = TOTAL_DEPOSIT_VALUE.mul(ethers.utils.parseUnits(".02", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the MANAGER address received 98% of the EMP tokens
					expect(await eMP.balanceOf(MANAGER.address)).to.be.equal(VALUE_CUT);

					// 98% of deposit value
					const VALUE_AFTER_CUT = TOTAL_DEPOSIT_VALUE.mul(ethers.utils.parseUnits(".98", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the OWNER address received 98% of the EMP tokens
					expect(await eMP.balanceOf(OWNER.address)).to.be.equal(VALUE_AFTER_CUT);
				});

				it("Yield Sync Governance should receive correct amount of ERC20 if fee is set is greater than 0..", async () => {
					const [OWNER, MANAGER, TREASURY] = await ethers.getSigners();

					const UtilizedEMPStrategy: UtilizedEMPStrategyUpdate = [
						strategies[0].contract.address,
						strategies[1].contract.address,
					];

					const UtilizedEMPStrategyAllocation: UtilizedEMPStrategyAllocationUpdate = [PERCENT.FIFTY, PERCENT.FIFTY];

					// Set the utilzation to 2 different strategies
					await eMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedEMPStrategy, UtilizedEMPStrategyAllocation);

					// Set the utilzation to 2 different strategies
					await eMP.utilizedYieldSyncV1EMPStrategyDepositOpenToggle();

					/**
					* @notice Because UTILIZED_STRATEGIES has 2 stratgies with a split of 50/50, the same amount (2) is set for
					* each.
					*/

					const STRATEGY_DEPOSIT_AMOUNTS: BigNumber[] = await strategies[0].strategyTransferUtil.calculateERC20Required(
						ethers.utils.parseUnits("2", 18)
					);

					const STRATEGY2_DEPOSIT_AMOUNTS: BigNumber[] = await strategies[1].strategyTransferUtil.calculateERC20Required(
						ethers.utils.parseUnits("2", 18)
					);

					// Pass in value for 2 strategies
					const VALID: UtilizedEMPStrategyERC20Amount = [
						[STRATEGY_DEPOSIT_AMOUNTS[0], STRATEGY_DEPOSIT_AMOUNTS[1]],
						[STRATEGY2_DEPOSIT_AMOUNTS[0]]
					];

					// Approve tokens
					await mockERC20A.approve(strategyInteractor.address, STRATEGY_DEPOSIT_AMOUNTS[0]);
					await mockERC20B.approve(strategyInteractor.address, STRATEGY_DEPOSIT_AMOUNTS[1]);
					await mockERC20C.approve(strategyInteractor.address, STRATEGY2_DEPOSIT_AMOUNTS[0]);

					// Set YS Gov fee to 2%
					await eMP.feeRateYieldSyncGovernanceUpdate(ethers.utils.parseUnits(".02", 18));

					expect(await eMP.feeRateYieldSyncGovernance()).to.be.equal(ethers.utils.parseUnits(".02", 18));


					// [main-test]
					await expect(eMP.utilizedYieldSyncV1EMPStrategyDeposit(VALID)).to.be.not.reverted;

					// Validate balances
					expect(await mockERC20A.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY_DEPOSIT_AMOUNTS[0]);
					expect(await mockERC20B.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY_DEPOSIT_AMOUNTS[1]);
					expect(await mockERC20C.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY2_DEPOSIT_AMOUNTS[0]);

					// Expect that the OWNER address received something
					expect(await eMP.balanceOf(OWNER.address)).to.be.greaterThan(0);

					const { totalEthValue: strategyDepositEthValue } = await strategies[0].strategyTransferUtil.valueOfERC20Deposits(
						[STRATEGY_DEPOSIT_AMOUNTS[0], STRATEGY_DEPOSIT_AMOUNTS[1]]
					);

					// Expect that the EMP address received correct amount of Strategy tokens
					expect(await strategies[0].contract.balanceOf(eMP.address)).to.be.equal(strategyDepositEthValue);

					// Expect that the OWNER address received something greater than what was put into the 1st strategy
					expect(await eMP.balanceOf(OWNER.address)).to.be.greaterThan(strategyDepositEthValue);

					const { totalEthValue: strategy2DepositETHValue } = await strategies[1].strategyTransferUtil.valueOfERC20Deposits(
						[STRATEGY2_DEPOSIT_AMOUNTS[0]]
					)

					// Expect that the EMP address received correct amount of Strategy tokens
					expect(await strategies[1].contract.balanceOf(eMP.address)).to.be.equal(strategy2DepositETHValue);

					// Add up deposit amounts
					const TOTAL_DEPOSIT_VALUE: BigNumber = strategyDepositEthValue.add(strategy2DepositETHValue);

					// Expect that the MANAGER address received 0% of the EMP tokens
					expect(await eMP.balanceOf(MANAGER.address)).to.be.equal(0);

					// 2% of deposit value
					const VALUE_CUT = TOTAL_DEPOSIT_VALUE.mul(ethers.utils.parseUnits(".02", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the TREASURY address received 98% of the EMP tokens
					expect(await eMP.balanceOf(TREASURY.address)).to.be.equal(VALUE_CUT);

					// 98% of deposit value
					const VALUE_AFTER_CUT = TOTAL_DEPOSIT_VALUE.mul(ethers.utils.parseUnits(".98", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the OWNER address received something equal to what was deposited into all strategies via EMP
					expect(await eMP.balanceOf(OWNER.address)).to.be.lessThan(TOTAL_DEPOSIT_VALUE);

					// Expect that the OWNER address received 98% of the EMP tokens
					expect(await eMP.balanceOf(OWNER.address)).to.be.equal(VALUE_AFTER_CUT);
				});

				it("Manager & Yield Sync Governance should receive correct amounts of ERC20 if fees are set to greater than 0..", async () => {
					const [OWNER, MANAGER, TREASURY] = await ethers.getSigners();

					const UtilizedEMPStrategy: UtilizedEMPStrategyUpdate = [
						strategies[0].contract.address,
						strategies[1].contract.address,
					];

					const UtilizedEMPStrategyAllocation: UtilizedEMPStrategyAllocationUpdate = [PERCENT.FIFTY, PERCENT.FIFTY];

					// Set the utilzation to 2 different strategies
					await eMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedEMPStrategy, UtilizedEMPStrategyAllocation);

					// Set the utilzation to 2 different strategies
					await eMP.utilizedYieldSyncV1EMPStrategyDepositOpenToggle();

					/**
					* @notice Because UTILIZED_STRATEGIES has 2 stratgies with a split of 50/50, the same amount (2) is set for
					* each.
					*/

					const STRATEGY_DEPOSIT_AMOUNTS: BigNumber[] = await strategies[0].strategyTransferUtil.calculateERC20Required(
						ethers.utils.parseUnits("2", 18)
					);

					const STRATEGY2_DEPOSIT_AMOUNTS: BigNumber[] = await strategies[1].strategyTransferUtil.calculateERC20Required(
						ethers.utils.parseUnits("2", 18)
					);

					// Pass in value for 2 strategies
					const VALID: UtilizedEMPStrategyERC20Amount = [
						[STRATEGY_DEPOSIT_AMOUNTS[0], STRATEGY_DEPOSIT_AMOUNTS[1]],
						[STRATEGY2_DEPOSIT_AMOUNTS[0]]
					];

					// Approve tokens
					await mockERC20A.approve(strategyInteractor.address, STRATEGY_DEPOSIT_AMOUNTS[0]);
					await mockERC20B.approve(strategyInteractor.address, STRATEGY_DEPOSIT_AMOUNTS[1]);
					await mockERC20C.approve(strategyInteractor.address, STRATEGY2_DEPOSIT_AMOUNTS[0]);

					// Set manager fee to 2%
					await expect(eMP.feeRateManagerUpdate(ethers.utils.parseUnits(".02", 18))).to.be.not.reverted;

					// Set YS Gov fee to 2%
					await expect(eMP.feeRateYieldSyncGovernanceUpdate(ethers.utils.parseUnits(".02", 18))).to.be.not.reverted;

					expect(await eMP.feeRateManager()).to.be.equal(ethers.utils.parseUnits(".02", 18));

					expect(await eMP.feeRateYieldSyncGovernance()).to.be.equal(ethers.utils.parseUnits(".02", 18));

					// Set manager to ADDR_1
					await eMP.managerUpdate(MANAGER.address);

					expect(await eMP.manager()).to.be.equal(MANAGER.address);

					// [main-test]
					await expect(eMP.utilizedYieldSyncV1EMPStrategyDeposit(VALID)).to.be.not.reverted;

					// Validate balances
					expect(await mockERC20A.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY_DEPOSIT_AMOUNTS[0]);
					expect(await mockERC20B.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY_DEPOSIT_AMOUNTS[1]);
					expect(await mockERC20C.balanceOf(strategyInteractor.address)).to.be.equal(STRATEGY2_DEPOSIT_AMOUNTS[0]);

					// Expect that the OWNER address received something
					expect(await eMP.balanceOf(OWNER.address)).to.be.greaterThan(0);

					const { totalEthValue: strategyDepositEthValue } = await strategies[0].strategyTransferUtil.valueOfERC20Deposits(
						[STRATEGY_DEPOSIT_AMOUNTS[0], STRATEGY_DEPOSIT_AMOUNTS[1]]
					);

					// Expect that the EMP address received correct amount of Strategy tokens
					expect(await strategies[0].contract.balanceOf(eMP.address)).to.be.equal(strategyDepositEthValue);

					// Expect that the OWNER address received something greater than what was put into the 1st strategy
					expect(await eMP.balanceOf(OWNER.address)).to.be.greaterThan(strategyDepositEthValue);

					const { totalEthValue: strategy2DepositETHValue } = await strategies[1].strategyTransferUtil.valueOfERC20Deposits(
						[STRATEGY2_DEPOSIT_AMOUNTS[0]]
					)

					// Expect that the EMP address received correct amount of Strategy tokens
					expect(await strategies[1].contract.balanceOf(eMP.address)).to.be.equal(strategy2DepositETHValue);

					// Add up deposit amounts
					const TOTAL_DEPOSIT_VALUE: BigNumber = strategyDepositEthValue.add(strategy2DepositETHValue);

					// 2% of deposit value
					const VALUE_CUT = TOTAL_DEPOSIT_VALUE.mul(ethers.utils.parseUnits(".02", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the MANAGER address received 0% of the EMP tokens
					expect(await eMP.balanceOf(MANAGER.address)).to.be.equal(VALUE_CUT);

					// Expect that the TREASURY address received 98% of the EMP tokens
					expect(await eMP.balanceOf(TREASURY.address)).to.be.equal(VALUE_CUT);

					// 98% of deposit value
					const VALUE_AFTER_CUT = TOTAL_DEPOSIT_VALUE.mul(ethers.utils.parseUnits(".96", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the OWNER address received something equal to what was deposited into all strategies via EMP
					expect(await eMP.balanceOf(OWNER.address)).to.be.lessThan(TOTAL_DEPOSIT_VALUE);

					// Expect that the OWNER address received 98% of the EMP tokens
					expect(await eMP.balanceOf(OWNER.address)).to.be.equal(VALUE_AFTER_CUT);
				});
			});
		});
	});
});
