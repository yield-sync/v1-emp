const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory, VoidSigner } from "ethers";

import { D_18, ERROR, PERCENT } from "../const";
import EMPTransferUtil from "../scripts/EMPTransferUtil";
import StrategyTransferUtil from "../scripts/StrategyTransferUtil";


const LOCATION_MOCKERC20: string = "MockERC20";
const LOCATION_STRATGY: string = "V1EMPStrategy";


describe("[7.1] V1EMP.sol - Depositing Tokens", async () => {
	let eMPUtilizedERC20: string[];

	let arrayUtility: Contract;
	let governance: Contract;
	let eTHValueFeed: Contract;
	let eMP: Contract;
	let eMPDeployer: Contract;
	let eMPUtility: Contract;
	let registry: Contract;
	let strategyDeployer: Contract;
	let strategyUtility: Contract;

	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;

	let eMPTransferUtil: EMPTransferUtil;

	let owner: VoidSigner;
	let manager: VoidSigner;
	let treasury: VoidSigner;

	let strategies: {
		contract: Contract,
		strategyTransferUtil: StrategyTransferUtil
	}[] = [];


	beforeEach("[beforeEach] Set up contracts..", async () => {
		/**
		* @notice
		* This beforeEach process does the following:
		* 1) Deploy a registry
		* 2) SEt the utilized tokens for the strats
		* 3) Deploys an EMP Deployer and registers it on the registry
		* 4) Attach the deployed EMP to a local variable (for accessing fn.)
		* 5) Set the manager
		* 6) Update the EMP Transfer Util
		* 7) Deploy 2 strategies and make them fully operational by doing the following:
		* 	a) Attach the deployed EMP Strategy to a local variable
		* 	b) Set the ETH Value feed
		* 	c) Set the strategy interactor
		* 	d) Set the tokens for the strategy
		* 	e) Toggle on the withdrawals and depositing of tokens
		* 	f) Set the strategies[0].strategyTransferUtil for strategy
		* 8) Set the stratgies on the EMP
		* 9) Store the utilized ERC20 tokens
		*/

		[owner, manager, treasury] = await ethers.getSigners();

		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const V1EMP: ContractFactory = await ethers.getContractFactory("V1EMP");
		const V1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("V1EMPArrayUtility");
		const V1EMPDeployer: ContractFactory = await ethers.getContractFactory("V1EMPDeployer");
		const V1EMPRegistry: ContractFactory = await ethers.getContractFactory("V1EMPRegistry");
		const V1EMPStrategy: ContractFactory = await ethers.getContractFactory("V1EMPStrategy");
		const V1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("V1EMPStrategyDeployer");
		const V1EMPAmountsValidator: ContractFactory= await ethers.getContractFactory("V1EMPAmountsValidator");

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");


		// Core contracts
		governance = await (await YieldSyncGovernance.deploy()).deployed();

		await governance.payToUpdate(treasury.address);

		arrayUtility = await (await V1EMPArrayUtility.deploy()).deployed();

		registry = await (await V1EMPRegistry.deploy(governance.address)).deployed();

		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

		strategyDeployer = await (await V1EMPStrategyDeployer.deploy(registry.address)).deployed();

		await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);

		eMPUtility = await (await V1EMPAmountsValidator.deploy(registry.address)).deployed();

		await registry.v1EMPAmountsValidatorUpdate(eMPUtility.address);

		eMPDeployer = await (await V1EMPDeployer.deploy(registry.address)).deployed();

		await registry.v1EMPDeployerUpdate(eMPDeployer.address);


		// Testing contracts
		mockERC20A = await (await MockERC20.deploy("Mock A", "A")).deployed();
		mockERC20B = await (await MockERC20.deploy("Mock B", "B")).deployed();
		mockERC20C = await (await MockERC20.deploy("Mock C", "C")).deployed();

		eTHValueFeed = await (await ETHValueFeedDummy.deploy()).deployed();

		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20A.address, eTHValueFeed.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20B.address, eTHValueFeed.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20C.address, eTHValueFeed.address);


		/**
		* EMP
		*/
		// Deploy an EMP
		await eMPDeployer.deployV1EMP("EMP Name", "EMP");

		// Verify that a EMP has been registered
		expect(await registry.v1EMPId_v1EMP(1)).to.be.not.equal(ethers.constants.AddressZero);

		// Attach the deployed EMP address to a variable
		eMP = await V1EMP.attach(String(await registry.v1EMPId_v1EMP(1)));

		// Set the Manager
		await eMP.managerUpdate(manager.address);

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

		for (let i: number = 0; i < deployStrategies.length; i++)
		{
			let strategyInteractor: Contract = await (await StrategyInteractorDummy.deploy()).deployed();

			// Deploy EMP Strategy
			await strategyDeployer.deployV1EMPStrategy(`EMP Strategy ${i}`, `EMPS${i}`);

			// Attach the deployed V1EMPStrategy address to variable
			let deployedV1EMPStrategy = await V1EMPStrategy.attach(
				String(await registry.v1EMPStrategyId_v1EMPStrategy(i + 1))
			);

			// Set the Strategy Interactor
			await deployedV1EMPStrategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

			await deployedV1EMPStrategy.utilizedERC20Update(
				deployStrategies[i].strategyUtilizedERC20,
				deployStrategies[i].strategyUtilization
			);

			// Enable Deposits and Withdraws
			await deployedV1EMPStrategy.utilizedERC20DepositOpenToggle();

			expect(await deployedV1EMPStrategy.utilizedERC20DepositOpen()).to.be.true;

			await deployedV1EMPStrategy.utilizedERC20WithdrawOpenToggle();

			expect(await deployedV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.true;

			strategies[i] = {
				contract: deployedV1EMPStrategy,
				strategyTransferUtil: new StrategyTransferUtil(deployedV1EMPStrategy, eTHValueFeed)
			};
		}

		// Set the utilzation to 2 different strategies
		await eMP.utilizedV1EMPStrategyUpdate(
			[strategies[0].contract.address, strategies[1].contract.address] as UtilizedEMPStrategyUpdate,
			[PERCENT.FIFTY, PERCENT.FIFTY] as UtilizedEMPStrategyAllocationUpdate
		);

		// Store the utilized ERC20 tokens
		eMPUtilizedERC20 = await eMP.utilizedERC20();

		// Open deposits
		await eMP.utilizedERC20DepositOpenToggle();

		// Open Deposits
		expect(await eMP.utilizedERC20DepositOpen()).to.be.true;
	});


	describe("function utilizedERC20Deposit()", async () => {
		describe("Invalid", async () => {
			it("Should NOT allow depositing if not open..", async () => {
				/**
				* @notice This test is to check that depositing must be toggled on in order to call the function properly.
				*/

				// Close deposits
				await eMP.utilizedERC20DepositOpenToggle();

				expect(await eMP.utilizedERC20DepositOpen()).to.be.false;

				// Even if utilizedERC20Amounts, the function should revert with reason that deposits are NOT open
				await expect(eMP.utilizedERC20Deposit([])).to.be.rejectedWith(ERROR.STRATEGY.DEPOSIT_NOT_OPEN);
			});

			it("Should NOT allow invalid lengthed _utilizedERC20Amount to be passed..", async () => {
				/**
				* @notice This test is to check that if the total amount of strategies is correctly set, then passing in a param
				* with incorrect first dimension of the 2d param will be rejected.
				*/

				// Pass in value for 0 strategies
				const INVALID: UtilizedERC20Amount = [];

				await expect(eMP.utilizedERC20Deposit(INVALID)).to.be.rejectedWith(ERROR.EMP.INVALID_UTILIZED_ERC20_LENGTH);
			});

			it("Should revert if invalid _utilizedERC20Amount passed..");
		});

		describe("Valid", async () => {
			let eTHValueEMPDepositAmount: BigNumber = ethers.utils.parseUnits("2", 18);
			let eMPDepositAmounts: UtilizedERC20Amount;


			beforeEach(async () => {
				/**
				* @notice
				* 1) Calculate EMP Deposit Amounts
				* 2) Approve the tokens
				*/

				eMPDepositAmounts = await eMPTransferUtil.calculateERC20Required(eTHValueEMPDepositAmount);

				// Approve the ERC20 tokens for the strategy interactor
				for (let i: number = 0; i < eMPUtilizedERC20.length; i++)
				{
					await (await ethers.getContractAt(LOCATION_MOCKERC20, eMPUtilizedERC20[i])).approve(
						eMP.address,
						eMPDepositAmounts[i]
					);
				}
			});


			describe("No Fee Rate", async () => {
				beforeEach(async () => {
					/**
					* @notice
					* 1) Deposit ERC20 tokens
					*/

					await eMP.utilizedERC20Deposit(eMPDepositAmounts);
				});


				it("Should allow user to deposit tokens into the EMP and receive correct amount of ERC20..", async () => {
					/**
					* @notice This test should test that depositing correct amounts should work.
					*/

					// Test SI balances
					for (let i: number = 0; i < eMPUtilizedERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_MOCKERC20, eMPUtilizedERC20[i]);

						// [main-test]
						expect(await IERC20.balanceOf(eMP.address)).to.be.equal(eMPDepositAmounts[i]);
					}
				});

				it("Should receive correct amount of ERC20 tokens upon depositing..", async () => {
					/**
					* @notice This test should test that depositing correct amounts should work and the msg.sender receives the
					* the tokens accordingly.
					*/

					// Expect that the owner address received something
					expect(await eMP.balanceOf(owner.address)).to.be.greaterThan(0);

					// Get the total ETH Value of the deposited amount
					const { totalEthValue } = await eMPTransferUtil.valueOfERC20Deposits(eMPDepositAmounts);

					// Expect that the EMP address received correct amount of Strategy tokens
					expect(await eMP.balanceOf(owner.address)).to.be.equal(totalEthValue);
				});
			});

			describe("Fee Rate", async () => {
				const DEPOSIT_ETH_VALUE: BigNumber = ethers.utils.parseUnits("2", 18);;


				it("Manager should receive correct amount of ERC20 if fee is set is greater than 0..", async () => {
					// Set manager fee to 2%
					await eMP.feeRateManagerUpdate(ethers.utils.parseUnits(".02", 18));

					await eMP.utilizedERC20Deposit(eMPDepositAmounts);

					// Expect that the owner address received something
					expect(await eMP.balanceOf(owner.address)).to.be.greaterThan(0);

					// Calculate the EMP tokens that the owner should receive
					const EXPECTED_EMP_AMOUNT_OWNER = DEPOSIT_ETH_VALUE.mul(ethers.utils.parseUnits(".98", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the owner recieved 98% of the deposit value
					expect(await eMP.balanceOf(owner.address)).to.be.equal(EXPECTED_EMP_AMOUNT_OWNER);

					// Expect that the manager address received something
					expect(await eMP.balanceOf(manager.address)).to.be.greaterThan(0);

					// Calculate the EMP tokens that the manager should receive
					const EXPECTED_EMP_AMOUNT_MANAGER = DEPOSIT_ETH_VALUE.mul(ethers.utils.parseUnits(".02", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the owner recieved 2% of the deposit value
					expect(await eMP.balanceOf(manager.address)).to.be.equal(EXPECTED_EMP_AMOUNT_MANAGER);
				});

				it("Governance Treasury should receive correct amount of ERC20 if fee is set is greater than 0..", async () => {
					// Set YS Gov fee to 2%
					await eMP.feeRateGovernanceUpdate(ethers.utils.parseUnits(".02", 18));

					await eMP.utilizedERC20Deposit(eMPDepositAmounts);

					// Expect that the manager address received 0% of the EMP tokens
					expect(await eMP.balanceOf(manager.address)).to.be.equal(0);

					// Expect that the owner address received something
					expect(await eMP.balanceOf(owner.address)).to.be.greaterThan(0);

					// Calculate the EMP tokens that the owner should receive
					const EXPECTED_EMP_AMOUNT_OWNER = DEPOSIT_ETH_VALUE.mul(ethers.utils.parseUnits(".98", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the owner recieved 98% of the deposit value
					expect(await eMP.balanceOf(owner.address)).to.be.equal(EXPECTED_EMP_AMOUNT_OWNER);

					// Expect that the treasury address received something
					expect(await eMP.balanceOf(treasury.address)).to.be.greaterThan(0);

					// Calculate the EMP tokens that the treasury should receive
					const EXPECTED_EMP_AMOUNT_TREASURY = DEPOSIT_ETH_VALUE.mul(ethers.utils.parseUnits(".02", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the owner recieved 2% of the deposit value
					expect(await eMP.balanceOf(treasury.address)).to.be.equal(EXPECTED_EMP_AMOUNT_TREASURY);
				});

				it("Manager & Governance should receive correct amounts of ERC20 if fees are set to greater than 0..", async () => {
					// Set manager fee to 2%
					await eMP.feeRateManagerUpdate(ethers.utils.parseUnits(".02", 18));

					// Set YS Gov fee to 2%
					await eMP.feeRateGovernanceUpdate(ethers.utils.parseUnits(".02", 18));

					// Deposit
					await eMP.utilizedERC20Deposit(eMPDepositAmounts);

					// Expect that the manager address received something
					expect(await eMP.balanceOf(manager.address)).to.be.greaterThan(0);

					// Calculate the EMP tokens that the manager should receive
					const EXPECTED_EMP_AMOUNT_MANAGER = DEPOSIT_ETH_VALUE.mul(ethers.utils.parseUnits(".02", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the manager recieved 2% of the deposit value
					expect(await eMP.balanceOf(manager.address)).to.be.equal(EXPECTED_EMP_AMOUNT_MANAGER);


					// Expect that the treasury address received something
					expect(await eMP.balanceOf(treasury.address)).to.be.greaterThan(0);

					// Calculate the EMP tokens that the treasury should receive
					const EXPECTED_EMP_AMOUNT_TREASURY = DEPOSIT_ETH_VALUE.mul(ethers.utils.parseUnits(".02", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the owner recieved 2% of the deposit value
					expect(await eMP.balanceOf(treasury.address)).to.be.equal(EXPECTED_EMP_AMOUNT_TREASURY);


					// Expect that the owner address received something
					expect(await eMP.balanceOf(owner.address)).to.be.greaterThan(0);

					// Calculate the EMP tokens that the owner should receive
					const EXPECTED_EMP_AMOUNT_OWNER = DEPOSIT_ETH_VALUE.mul(ethers.utils.parseUnits(".96", 18)).div(
						ethers.utils.parseUnits("1", 18)
					);

					// Expect that the owner recieved 98% of the deposit value
					expect(await eMP.balanceOf(owner.address)).to.be.equal(EXPECTED_EMP_AMOUNT_OWNER);
				});
			});

			describe("[indirect-call] function utilizedERC20Update() - Utilized ERC20 tokens changed..", async () => {
				let eMPUtilizedERC20: string[];


				beforeEach(async () => {
					eMPUtilizedERC20 = await eMP.utilizedERC20();

					expect(eMPUtilizedERC20.length).to.be.equal(3);

					if (await strategies[0].contract.utilizedERC20DepositOpen())
					{
						await strategies[0].contract.utilizedERC20DepositOpenToggle();
					}

					if (await strategies[0].contract.utilizedERC20WithdrawOpen())
					{
						await strategies[0].contract.utilizedERC20WithdrawOpenToggle();
					}

					await strategies[0].contract.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);
				});


				it("Should be reverted if using old eMPDepositAmounts..", async () => {
					await expect(eMP.utilizedERC20Deposit(eMPDepositAmounts)).to.be.revertedWith(
						ERROR.EMP.INVALID_UTILIZED_ERC20_LENGTH
					);
				});

				it("Should update EMP's utilizedERC20 array to be a union of the strategy's utilizedERC20s..", async () => {
					await expect(
						eMP.utilizedERC20Deposit([ethers.utils.parseUnits(".5", 18), ethers.utils.parseUnits(".5", 18)])
					).to.be.not.reverted;

					eMPUtilizedERC20 = await eMP.utilizedERC20();

					expect(eMPUtilizedERC20.length).to.be.equal(2);
				});
			})
		});
	});

	describe("function utilizedV1EMPStrategyDeposit()", async () => {
		let eTHValueEMPDepositAmount: BigNumber = ethers.utils.parseUnits("2", 18);
		let eMPDepositAmounts: UtilizedERC20Amount;


		beforeEach(async () => {
			/**
			* @notice
			* 1) Calculate EMP Deposit Amounts
			* 2) Approve the tokens
			* 3) Deposit ERC20 tokens into EMP
			*/

			eMPDepositAmounts = await eMPTransferUtil.calculateERC20Required(eTHValueEMPDepositAmount);

			// Approve the ERC20 tokens for the strategy interactor
			for (let i: number = 0; i < eMPUtilizedERC20.length; i++)
			{
				await (await ethers.getContractAt(LOCATION_MOCKERC20, eMPUtilizedERC20[i])).approve(
					eMP.address,
					eMPDepositAmounts[i]
				);
			}

			// Deposit the utilized ERC20 tokens into EMP
			await eMP.utilizedERC20Deposit(eMPDepositAmounts);
		});


		describe("Invalid", async () => {
			it("Should NOT allow depositing into strategies if not open..", async () => {
				// Close deposits
				await eMP.utilizedERC20DepositOpenToggle();

				// Expect deposit to be closed
				expect(await eMP.utilizedERC20DepositOpen()).to.be.false;

				// Attempt to deposit the tokens
				await expect(eMP.utilizedV1EMPStrategyDeposit([])).to.be.rejectedWith(ERROR.EMP.DEPOSIT_NOT_OPEN);
			});

			it("Should revert if invalid lengthed _v1EMPStrategyUtilizedERC20Amount passed..", async () => {
				// Pass incorrect length of deposit amounts
				await expect(eMP.utilizedV1EMPStrategyDeposit([])).to.be.rejectedWith(
					ERROR.EMP.INVALID_STRATEGY_UTILIZED_ERC20_AMOUNT_LENGTH
				);
			});

			it("Should revert if invalid _v1EMPStrategyUtilizedERC20Amount passed..", async () => {
				let depositAmount: BigNumber[][] = [];

				depositAmount[0] = await strategies[0].strategyTransferUtil.calculateERC20Required(
					eTHValueEMPDepositAmount.mul(PERCENT.FIFTY).div(D_18)
				);

				depositAmount[1] = await strategies[1].strategyTransferUtil.calculateERC20Required(
					eTHValueEMPDepositAmount.mul(PERCENT.FIFTY).div(D_18)
				);

				// Make value invalid
				depositAmount[0][0] = depositAmount[0][0].add(ethers.utils.parseUnits("1", 18)),

				await expect(eMP.utilizedV1EMPStrategyDeposit([depositAmount[0], depositAmount[1]])).to.be.revertedWith(
					ERROR.EMP.AMOUNTS_VALIDATOR_FAILURE
				);
			});
		});

		describe("Valid", async () => {
			let depositAmount: BigNumber[][] = [];


			beforeEach(async () => {
				/**
				* @notice
				* 1) Calculate deposit amounts for both strategies by doing the following:
				* 	a) Multiply the ETH value deposited into the EMP by the allocation
				* 2) Deposit tokens into EMP
				*/

				depositAmount[0] = await strategies[0].strategyTransferUtil.calculateERC20Required(
					eTHValueEMPDepositAmount.mul(PERCENT.FIFTY).div(D_18)
				);

				depositAmount[1] = await strategies[1].strategyTransferUtil.calculateERC20Required(
					eTHValueEMPDepositAmount.mul(PERCENT.FIFTY).div(D_18)
				);

				await eMP.utilizedV1EMPStrategyDeposit([depositAmount[0], depositAmount[1]]);
			});


			it("Should give correct amount of Strategy tokens to the EMP..", async () => {
				for (let i = 0; i < strategies.length; i++)
				{
					const strategy = strategies[i].contract;

					expect(await strategy.balanceOf(eMP.address)).to.be.equal(
						eTHValueEMPDepositAmount.mul(PERCENT.FIFTY).div(D_18)
					);
				}
			});

			it("Should deposit correct amount of ERC20 tokens into Strategy Interactors..", async () => {
				const STRATEGIES: string[] = await eMP.utilizedV1EMPStrategy();

				// For each strategy..
				for (let i = 0; i < STRATEGIES.length; i++)
				{
					// Create readable stragy contract
					const STRATEGY: Contract = await ethers.getContractAt(LOCATION_STRATGY, STRATEGIES[i]);

					// Get the strategy interactor contract
					const STRATEGY_INTERACTOR: Contract = await STRATEGY.iV1EMPStrategyInteractor();

					// Get the array of utilized ERC20 tokens for the specified strategy
					const UTILIZED_ERC20: string[] = await STRATEGY.utilizedERC20();

					// For each stratgie's utilized ERC20..
					for (let ii = 0; ii < UTILIZED_ERC20.length; ii++)
					{
						// Create IERC20 interfaceo for the utilized ERC20
						const IERC20 = await ethers.getContractAt(LOCATION_MOCKERC20, UTILIZED_ERC20[ii]);

						// Retrieve the balance of the Strategy Interactor
						const BALANCE: BigNumber = await IERC20.balanceOf(STRATEGY_INTERACTOR);

						// Validate the balance of the Stragegy Interactor
						expect(BALANCE).to.be.equal(depositAmount[i][ii]);
					}
				}
			});
		});
	});
});
