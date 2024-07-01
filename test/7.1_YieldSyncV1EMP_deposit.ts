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

				// Update the EMP transfer Util
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
					await (await ethers.getContractAt(LOCATION_MOCKERC20, EMP_UTILIZED_ERC20[i])).approve(
						eMP.address,
						EMP_DEPOSIT_AMOUNTS[i]
					);
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
					await (await ethers.getContractAt(LOCATION_MOCKERC20, EMP_UTILIZED_ERC20[i])).approve(
						eMP.address,
						EMP_DEPOSIT_AMOUNTS[i]
					);
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

					const DEPOSIT_ETH_VALUE = ethers.utils.parseUnits("2", 18);

					const EMP_DEPOSIT_AMOUNTS: UtilizedERC20Amount = await eMPTransferUtil.calculateERC20Required(
						DEPOSIT_ETH_VALUE
					);

					const EMP_UTILIZED_ERC20 = await eMP.utilizedERC20();

					// Approve the ERC20 tokens for the strategy interactor
					for (let i = 0; i < EMP_UTILIZED_ERC20.length; i++)
					{
						await (await ethers.getContractAt(LOCATION_MOCKERC20, EMP_UTILIZED_ERC20[i])).approve(
							eMP.address,
							EMP_DEPOSIT_AMOUNTS[i]
						);
					}

					// Set manager fee to 2%
					await eMP.feeRateManagerUpdate(ethers.utils.parseUnits(".02", 18));

					// Set manager
					await eMP.managerUpdate(MANAGER.address);

					await eMP.utilizedERC20Deposit(EMP_DEPOSIT_AMOUNTS);

					// Expect that the OWNER address received something
					expect(await eMP.balanceOf(OWNER.address)).to.be.greaterThan(0);

					// Calculate the EMP tokens that the OWNER should receive
					const EXPECTED_EMP_AMOUNT_OWNER = DEPOSIT_ETH_VALUE.mul(ethers.utils.parseUnits(".98", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the OWNER recieved 98% of the deposit value
					expect(await eMP.balanceOf(OWNER.address)).to.be.equal(EXPECTED_EMP_AMOUNT_OWNER);

					// Expect that the MANAGER address received something
					expect(await eMP.balanceOf(MANAGER.address)).to.be.greaterThan(0);

					// Calculate the EMP tokens that the MANAGER should receive
					const EXPECTED_EMP_AMOUNT_MANAGER = DEPOSIT_ETH_VALUE.mul(ethers.utils.parseUnits(".02", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the OWNER recieved 2% of the deposit value
					expect(await eMP.balanceOf(MANAGER.address)).to.be.equal(EXPECTED_EMP_AMOUNT_MANAGER);
				});

				it("Yield Sync Governance Treasury should receive correct amount of ERC20 if fee is set is greater than 0..", async () => {
					const [OWNER, MANAGER, TREASURY] = await ethers.getSigners();

					const DEPOSIT_ETH_VALUE = ethers.utils.parseUnits("2", 18);

					const EMP_DEPOSIT_AMOUNTS: UtilizedERC20Amount = await eMPTransferUtil.calculateERC20Required(
						DEPOSIT_ETH_VALUE
					);

					const EMP_UTILIZED_ERC20 = await eMP.utilizedERC20();

					// Approve the ERC20 tokens for the strategy interactor
					for (let i = 0; i < EMP_UTILIZED_ERC20.length; i++)
					{
						await (await ethers.getContractAt(LOCATION_MOCKERC20, EMP_UTILIZED_ERC20[i])).approve(
							eMP.address,
							EMP_DEPOSIT_AMOUNTS[i]
						);
					}

					// Set manager
					await eMP.managerUpdate(MANAGER.address);

					// Set YS Gov fee to 2%
					await eMP.feeRateYieldSyncGovernanceUpdate(ethers.utils.parseUnits(".02", 18));

					await eMP.utilizedERC20Deposit(EMP_DEPOSIT_AMOUNTS);

					// Expect that the MANAGER address received 0% of the EMP tokens
					expect(await eMP.balanceOf(MANAGER.address)).to.be.equal(0);

					// Expect that the OWNER address received something
					expect(await eMP.balanceOf(OWNER.address)).to.be.greaterThan(0);

					// Calculate the EMP tokens that the OWNER should receive
					const EXPECTED_EMP_AMOUNT_OWNER = DEPOSIT_ETH_VALUE.mul(ethers.utils.parseUnits(".98", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the OWNER recieved 98% of the deposit value
					expect(await eMP.balanceOf(OWNER.address)).to.be.equal(EXPECTED_EMP_AMOUNT_OWNER);

					// Expect that the TREASURY address received something
					expect(await eMP.balanceOf(TREASURY.address)).to.be.greaterThan(0);

					// Calculate the EMP tokens that the TREASURY should receive
					const EXPECTED_EMP_AMOUNT_TREASURY = DEPOSIT_ETH_VALUE.mul(ethers.utils.parseUnits(".02", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the OWNER recieved 2% of the deposit value
					expect(await eMP.balanceOf(TREASURY.address)).to.be.equal(EXPECTED_EMP_AMOUNT_TREASURY);
				});

				it("Manager & Yield Sync Governance should receive correct amounts of ERC20 if fees are set to greater than 0..", async () => {
					const [OWNER, MANAGER, TREASURY] = await ethers.getSigners();

					const DEPOSIT_ETH_VALUE = ethers.utils.parseUnits("2", 18);

					const EMP_DEPOSIT_AMOUNTS: UtilizedERC20Amount = await eMPTransferUtil.calculateERC20Required(
						DEPOSIT_ETH_VALUE
					);

					const EMP_UTILIZED_ERC20 = await eMP.utilizedERC20();

					// Approve the ERC20 tokens for the strategy interactor
					for (let i = 0; i < EMP_UTILIZED_ERC20.length; i++)
					{
						await (await ethers.getContractAt(LOCATION_MOCKERC20, EMP_UTILIZED_ERC20[i])).approve(
							eMP.address,
							EMP_DEPOSIT_AMOUNTS[i]
						);
					}

					// Set manager
					await eMP.managerUpdate(MANAGER.address);

					// Set manager fee to 2%
					await eMP.feeRateManagerUpdate(ethers.utils.parseUnits(".02", 18));

					// Set YS Gov fee to 2%
					await eMP.feeRateYieldSyncGovernanceUpdate(ethers.utils.parseUnits(".02", 18));

					// Deposit
					await eMP.utilizedERC20Deposit(EMP_DEPOSIT_AMOUNTS);


					// Expect that the MANAGER address received something
					expect(await eMP.balanceOf(MANAGER.address)).to.be.greaterThan(0);

					// Calculate the EMP tokens that the MANAGER should receive
					const EXPECTED_EMP_AMOUNT_MANAGER = DEPOSIT_ETH_VALUE.mul(ethers.utils.parseUnits(".02", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the MANAGER recieved 2% of the deposit value
					expect(await eMP.balanceOf(MANAGER.address)).to.be.equal(EXPECTED_EMP_AMOUNT_MANAGER);


					// Expect that the TREASURY address received something
					expect(await eMP.balanceOf(TREASURY.address)).to.be.greaterThan(0);

					// Calculate the EMP tokens that the TREASURY should receive
					const EXPECTED_EMP_AMOUNT_TREASURY = DEPOSIT_ETH_VALUE.mul(ethers.utils.parseUnits(".02", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the OWNER recieved 2% of the deposit value
					expect(await eMP.balanceOf(TREASURY.address)).to.be.equal(EXPECTED_EMP_AMOUNT_TREASURY);


					// Expect that the OWNER address received something
					expect(await eMP.balanceOf(OWNER.address)).to.be.greaterThan(0);

					// Calculate the EMP tokens that the OWNER should receive
					const EXPECTED_EMP_AMOUNT_OWNER = DEPOSIT_ETH_VALUE.mul(ethers.utils.parseUnits(".96", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the OWNER recieved 98% of the deposit value
					expect(await eMP.balanceOf(OWNER.address)).to.be.equal(EXPECTED_EMP_AMOUNT_OWNER);
				});
			});
		});
	});
});
