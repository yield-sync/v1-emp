const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory, VoidSigner } from "ethers";

import { D_18, ERROR, PERCENT } from "../const";
import EMPTransferUtil from "../util/EMPTransferUtil";
import StrategyTransferUtil from "../util/StrategyTransferUtil";


const LOCATION_MOCKERC20: string = "MockERC20";
const LOCATION_STRATGY: string = "V1EMPStrategy";


describe("[7.1] V1EMP.sol - Depositing Tokens", async () => {
	let arrayUtility: Contract;
	let governance: Contract;
	let eTHValueFeed: Contract;
	let eMPDeployer: Contract;
	let eMPUtility: Contract;
	let registry: Contract;
	let strategyDeployer: Contract;
	let strategyUtility: Contract;
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;

	let owner: VoidSigner;
	let manager: VoidSigner;
	let treasury: VoidSigner;

	let eMPs: {
		contract: Contract,
		eMPTransferUtil: EMPTransferUtil
	}[] = [];

	let strategies: {
		contract: Contract,
		strategyTransferUtil: StrategyTransferUtil
	}[] = [];


	beforeEach("[beforeEach] Set up contracts..", async () => {
		[owner, manager, treasury] = await ethers.getSigners();

		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const V1EMP: ContractFactory = await ethers.getContractFactory("V1EMP");
		const V1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("V1EMPArrayUtility");
		const V1EMPDeployer: ContractFactory = await ethers.getContractFactory("V1EMPDeployer");
		const V1EMPRegistry: ContractFactory = await ethers.getContractFactory("V1EMPRegistry");
		const V1EMPStrategy: ContractFactory = await ethers.getContractFactory("V1EMPStrategy");
		const V1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("V1EMPStrategyDeployer");
		const V1EMPStrategyUtility: ContractFactory = await ethers.getContractFactory("V1EMPStrategyUtility");
		const V1EMPUtility: ContractFactory= await ethers.getContractFactory("V1EMPUtility");

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");


		// Core contracts
		governance = await (await YieldSyncGovernance.deploy()).deployed();

		await governance.payToUpdate(treasury.address);

		arrayUtility = await (await V1EMPArrayUtility.deploy()).deployed();

		registry = await (await V1EMPRegistry.deploy(governance.address)).deployed();

		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

		strategyUtility = await (await V1EMPStrategyUtility.deploy(registry.address)).deployed();

		await registry.v1EMPStrategyUtilityUpdate(strategyUtility.address);

		strategyDeployer = await (await V1EMPStrategyDeployer.deploy(registry.address)).deployed();

		await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);

		eMPUtility = await (await V1EMPUtility.deploy(registry.address)).deployed();

		await registry.v1EMPUtilityUpdate(eMPUtility.address);

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
		* EMP Strategies
		*/
		const deployStrategies: {
			strategyUtilizedERC20: StrategyUtiliziedERC20,
			strategyUtilization: StrategyUtilization,
		}[] = [
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
			await strategyDeployer.deployV1EMPStrategy();

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
				strategyTransferUtil: new StrategyTransferUtil(deployedV1EMPStrategy, registry)
			};
		}


		/**
		* EMP
		*/
		const deployEMPs: {
			name: string,
			ticker: string,
			utilizedEMPStrategyUpdate: UtilizedEMPStrategyUpdate,
			utilizedEMPStrategyAllocationUpdate: UtilizedEMPStrategyAllocationUpdate
		}[] = [
			{
				name: "EMP 1",
				ticker: "EMP1",
				utilizedEMPStrategyUpdate: [strategies[0].contract.address, strategies[1].contract.address],
				utilizedEMPStrategyAllocationUpdate: [PERCENT.FIFTY, PERCENT.FIFTY],
			},
			{
				name: "EMP 2",
				ticker: "EMP2",
				utilizedEMPStrategyUpdate: [strategies[0].contract.address, strategies[1].contract.address],
				utilizedEMPStrategyAllocationUpdate: [PERCENT.SEVENTY_FIVE, PERCENT.TWENTY_FIVE],
			},
		];

		for (let i: number = 0; i < deployEMPs.length; i++)
		{
			// Deploy EMPs
			await eMPDeployer.deployV1EMP(false, deployEMPs[i].name, deployEMPs[i].ticker);

			// Get address from registry
			let registryResults = await registry.v1EMPId_v1EMP(i + 1);

			// Verify that a EMP has been registered
			expect(String(registryResults)).to.be.not.equal(ethers.constants.AddressZero);

			const eMPContract = await V1EMP.attach(String(registryResults));

			eMPs[i] = ({
				contract: eMPContract,
				eMPTransferUtil: new EMPTransferUtil(eMPContract, registry, eMPUtility),
			});

			// Set the Manager
			await eMPs[i].contract.managerUpdate(manager.address);

			expect(await eMPs[i].contract.utilizedERC20DepositOpen()).to.be.false;

			expect(await eMPs[i].contract.utilizedERC20WithdrawOpen()).to.be.false;

			// Set the utilzation to 2 different strategies
			await eMPs[i].contract.utilizedV1EMPStrategyUpdate(
				deployEMPs[i].utilizedEMPStrategyUpdate,
				deployEMPs[i].utilizedEMPStrategyAllocationUpdate
			);

			// Open deposits
			await eMPs[i].contract.utilizedERC20DepositOpenToggle();

			// Open Deposits
			expect(await eMPs[i].contract.utilizedERC20DepositOpen()).to.be.true;
		}
	});


	describe("function utilizedERC20Deposit()", async () => {
		describe("Expected Failure", async () => {
			it("Should NOT allow depositing if not open..", async () => {
				/**
				* @notice This test is to check that depositing must be toggled on in order to call the function properly.
				*/

				// Close deposits
				await eMPs[0].contract.utilizedERC20DepositOpenToggle();

				expect(await eMPs[0].contract.utilizedERC20DepositOpen()).to.be.false;

				// Even if utilizedERC20Amounts, the function should revert with reason that deposits are NOT open
				await expect(eMPs[0].contract.utilizedERC20Deposit([])).to.be.rejectedWith(ERROR.STRATEGY.DEPOSIT_NOT_OPEN);
			});

			it("Should NOT allow invalid lengthed _utilizedERC20Amount to be passed..", async () => {
				/**
				* @notice This test is to check that if the total amount of strategies is correctly set, then passing in a param
				* with incorrect first dimension of the 2d param will be rejected.
				*/

				// Pass in value for 0 strategies
				const INVALID: UtilizedERC20Amount = [];

				await expect(eMPs[0].contract.utilizedERC20Deposit(INVALID)).to.be.rejectedWith(
					ERROR.EMP.INVALID_UTILIZED_ERC20_LENGTH
				);
			});

			it("Should revert if invalid _utilizedERC20Amount passed..", async () => {
				let eTHValueEMPDepositAmount: BigNumber = ethers.utils.parseUnits("2", 18);
				let eMPDepositAmounts: UtilizedERC20Amount;

				eMPDepositAmounts = await eMPs[0].eMPTransferUtil.calculateERC20Required(eTHValueEMPDepositAmount);

				const utilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);

				// Approve the ERC20 tokens for the strategy interactor
				for (let i: number = 0; i < utilizedERC20.length; i++)
				{
					await (await ethers.getContractAt(LOCATION_MOCKERC20, utilizedERC20[i])).approve(
						eMPs[0].contract.address,
						eMPDepositAmounts[i]
					);
				}

				// Make invalid for expected failure
				eMPDepositAmounts[0] = eMPDepositAmounts[0].sub(eMPDepositAmounts[0]);

				await expect(eMPs[0].contract.utilizedERC20Deposit(eMPDepositAmounts)).to.be.revertedWith(
					ERROR.EMP_UTILITY.INVALID_ALLOCATION
				);
			});
		});

		describe("Expected Success", async () => {
			let eTHValueEMPDepositAmount: BigNumber = ethers.utils.parseUnits("2", 18);
			let eMPDepositAmounts: UtilizedERC20Amount;


			beforeEach(async () => {
				/**
				* @notice
				* 1) Calculate EMP Deposit Amounts
				* 2) Approve the tokens
				*/

				eMPDepositAmounts = await eMPs[0].eMPTransferUtil.calculateERC20Required(eTHValueEMPDepositAmount);

				const utilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);

				// Approve the ERC20 tokens for the strategy interactor
				for (let i: number = 0; i < utilizedERC20.length; i++)
				{
					await (await ethers.getContractAt(LOCATION_MOCKERC20, utilizedERC20[i])).approve(
						eMPs[0].contract.address,
						eMPDepositAmounts[i]
					);
				}
			});


			describe("No Fee Rate", async () => {
				beforeEach(async () => {
					/**
					* @notice
					* 1) Deposit ERC20 tokens into EMP
					*/

					await eMPs[0].contract.utilizedERC20Deposit(eMPDepositAmounts);
				});


				it("Should allow user to deposit tokens into the EMP and receive correct amount of ERC20..", async () => {
					/**
					* @notice This test should test that depositing correct amounts should work.
					*/

					const utilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);
					// Test SI balances
					for (let i: number = 0; i < utilizedERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_MOCKERC20, utilizedERC20[i]);

						// [main-test]
						expect(await IERC20.balanceOf(eMPs[0].contract.address)).to.be.equal(eMPDepositAmounts[i]);
					}
				});

				it("Should receive correct amount of ERC20 tokens upon depositing..", async () => {
					/**
					* @notice This test should test that depositing correct amounts should work and the msg.sender receives
					* the tokens accordingly.
					*/

					// Expect that the owner address received something
					expect(await eMPs[0].contract.balanceOf(owner.address)).to.be.greaterThan(0);

					// Get the total ETH Value of the deposited amount
					const { totalEthValue } = await eMPs[0].eMPTransferUtil.valueOfERC20Deposits(eMPDepositAmounts);

					// Expect that the EMP address received correct amount of Strategy tokens
					expect(await eMPs[0].contract.balanceOf(owner.address)).to.be.equal(totalEthValue);
				});
			});

			describe("Fee Rate", async () => {
				const feeRateTests: {
					description: string,
					managerFee: BigNumber,
					governanceFee: BigNumber,
					expectedOwnerAmount: BigNumber,
					expectedAmountManager: BigNumber,
					expectedAmountGovernance: BigNumber,
				}[] = [
					{
						description: "Manager should receive correct fee if fee greater than 0..",
						managerFee: ethers.utils.parseUnits(".02", 18),
						governanceFee: ethers.utils.parseUnits("0", 18),
						expectedOwnerAmount: eTHValueEMPDepositAmount.mul(ethers.utils.parseUnits(".98", 18)).div(
							ethers.utils.parseUnits("1", 18)
						),
						expectedAmountManager: eTHValueEMPDepositAmount.mul(ethers.utils.parseUnits(".02", 18)).div(
							ethers.utils.parseUnits("1", 18)
						),
						expectedAmountGovernance: ethers.utils.parseUnits("0", 18),
					},
					{
						description: "Governance Treasury should receive correct fee if fee greater than 0..",
						managerFee: ethers.utils.parseUnits("0", 18),
						governanceFee: ethers.utils.parseUnits(".02", 18),
						expectedOwnerAmount: eTHValueEMPDepositAmount.mul(ethers.utils.parseUnits(".98", 18)).div(
							ethers.utils.parseUnits("1", 18)
						),
						expectedAmountManager: ethers.utils.parseUnits("0", 18),
						expectedAmountGovernance: eTHValueEMPDepositAmount.mul(ethers.utils.parseUnits(".02", 18)).div(
							ethers.utils.parseUnits("1", 18)
						),
					},
					{
						description: "Manager & Governance should receive correct fees if fees set to greater than 0..",
						managerFee: ethers.utils.parseUnits(".02", 18),
						governanceFee: ethers.utils.parseUnits(".02", 18),
						expectedOwnerAmount: eTHValueEMPDepositAmount.mul(ethers.utils.parseUnits(".96", 18)).div(
							ethers.utils.parseUnits("1", 18)
						),
						expectedAmountManager: eTHValueEMPDepositAmount.mul(ethers.utils.parseUnits(".02", 18)).div(
							ethers.utils.parseUnits("1", 18)
						),
						expectedAmountGovernance: eTHValueEMPDepositAmount.mul(ethers.utils.parseUnits(".02", 18)).div(
							ethers.utils.parseUnits("1", 18)
						),
					}
				];

				for (let i = 0; i < feeRateTests.length; i++) {
					it(`Fee Rate Test ${i + 1} - ` + feeRateTests[i].description, async () => {
						// Set manager fee to 2%
						await eMPs[0].contract.feeRateManagerUpdate(feeRateTests[i].managerFee);

						expect(await eMPs[0].contract.feeRateManager()).to.be.equal(feeRateTests[i].managerFee);

						// Set YS Gov fee to 2%
						await eMPs[0].contract.feeRateGovernanceUpdate(feeRateTests[i].governanceFee);

						expect(await eMPs[0].contract.feeRateGovernance()).to.be.equal(feeRateTests[i].governanceFee);

						// Deposit the tokens
						await eMPs[0].contract.utilizedERC20Deposit(eMPDepositAmounts);

						// Expect that the owner recieved 98% of the deposit value
						expect(await eMPs[0].contract.balanceOf(owner.address)).to.be.equal(
							feeRateTests[i].expectedOwnerAmount
						);

						// Expect that the owner recieved 2% of the deposit value
						expect(await eMPs[0].contract.balanceOf(manager.address)).to.be.equal(
							feeRateTests[i].expectedAmountManager
						);

						// Expect that the owner recieved 2% of the deposit value
						expect(await eMPs[0].contract.balanceOf(treasury.address)).to.be.equal(
							feeRateTests[i].expectedAmountGovernance
						);
					});
				}
			});

			describe("[indirect-call] function utilizedERC20Update() - Utilized ERC20 tokens changed..", async () => {
				let utilizedERC20: string[];


				beforeEach(async () => {
					utilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);

					expect(utilizedERC20.length).to.be.equal(3);

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
					await expect(eMPs[0].contract.utilizedERC20Deposit(eMPDepositAmounts)).to.be.revertedWith(
						ERROR.EMP.INVALID_UTILIZED_ERC20_LENGTH
					);
				});

				it("Should update EMP's utilizedERC20 array to be a union of the strategy's utilizedERC20s..", async () => {
					await expect(
						eMPs[0].contract.utilizedERC20Deposit(
							[ethers.utils.parseUnits(".5", 18), ethers.utils.parseUnits(".5", 18)]
						)
					).to.be.not.reverted;

					utilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);

					expect(utilizedERC20.length).to.be.equal(2);
				});
			})
		});
	});

	describe("function utilizedERC20TotalBalance() (1/2)", async () => {
		let eTHValueEMPDepositAmount: BigNumber = ethers.utils.parseUnits("2", 18);
		let eMPDepositAmounts: UtilizedERC20Amount;
		let utilizedERC20: string[];


		beforeEach(async () => {
			/**
			* @notice
			* 1) Calculate EMP Deposit Amounts
			* 2) Approve the tokens
			* 3) Deposit ERC20 tokens into EMP
			*/

			eMPDepositAmounts = await eMPs[0].eMPTransferUtil.calculateERC20Required(eTHValueEMPDepositAmount);

			utilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);

			// Approve the ERC20 tokens for the strategy interactor
			for (let i: number = 0; i < utilizedERC20.length; i++)
			{
				await (await ethers.getContractAt(LOCATION_MOCKERC20, utilizedERC20[i])).approve(
					eMPs[0].contract.address,
					eMPDepositAmounts[i]
				);
			}

			await eMPs[0].contract.utilizedERC20Deposit(eMPDepositAmounts);
		});


		it("Should return the holdings of the EMP..", async () => {
			const EMP_ERC20_BALANCES = await eMPUtility.utilizedERC20TotalBalance(eMPs[0].contract.address);

			for (let i = 0; i < utilizedERC20.length; i++)
			{
				expect(EMP_ERC20_BALANCES[i]).to.equal(eMPDepositAmounts[i]);
			}
		});
	});

	describe("function utilizedV1EMPStrategyDeposit()", async () => {
		let eTHValueEMPDepositAmount: BigNumber = ethers.utils.parseUnits("2", 18);
		let eMPDepositAmounts: UtilizedERC20Amount;
		let utilizedERC20: string[] = [];


		beforeEach(async () => {
			/**
			* @notice
			* 1) Calculate EMP Deposit Amounts
			* 2) Approve the tokens
			* 3) Deposit ERC20 tokens into EMP
			*/

			eMPDepositAmounts = await eMPs[0].eMPTransferUtil.calculateERC20Required(eTHValueEMPDepositAmount);

			utilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);

			// Approve the ERC20 tokens for the strategy interactor
			for (let i: number = 0; i < utilizedERC20.length; i++)
			{
				await (await ethers.getContractAt(LOCATION_MOCKERC20, utilizedERC20[i])).approve(
					eMPs[0].contract.address,
					eMPDepositAmounts[i]
				);
			}

			// Deposit the utilized ERC20 tokens into EMP
			await eMPs[0].contract.utilizedERC20Deposit(eMPDepositAmounts);
		});


		describe("Expected Failure", async () => {
			it("Should NOT allow depositing into strategies if not open..", async () => {
				// Close deposits
				await eMPs[0].contract.utilizedERC20DepositOpenToggle();

				// Expect deposit to be closed
				expect(await eMPs[0].contract.utilizedERC20DepositOpen()).to.be.false;

				// Attempt to deposit the tokens
				await expect(eMPs[0].contract.utilizedV1EMPStrategyDeposit([])).to.be.rejectedWith(
					ERROR.EMP.DEPOSIT_NOT_OPEN
				);
			});

			it("Should revert if invalid lengthed _v1EMPStrategyUtilizedERC20Amount passed..", async () => {
				// Pass incorrect length of deposit amounts
				await expect(eMPs[0].contract.utilizedV1EMPStrategyDeposit([])).to.be.rejectedWith(
					ERROR.EMP.INVALID_UTILIZED_ERC20_AMOUNT_LENGTH
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

				await expect(
					eMPs[0].contract.utilizedV1EMPStrategyDeposit([depositAmount[0], depositAmount[1]])
				).to.be.revertedWith(
					ERROR.EMP.INVALID_UTILIZED_STRATEGY_ALLOCAITON
				);
			});
		});

		describe("Expected Success", async () => {
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

				await eMPs[0].contract.utilizedV1EMPStrategyDeposit([depositAmount[0], depositAmount[1]]);
			});


			it("Should give correct amount of Strategy tokens to the EMP..", async () => {
				for (let i = 0; i < strategies.length; i++)
				{
					const strategy = strategies[i].contract;

					expect(await strategy.eMP_equity(eMPs[0].contract.address)).to.be.equal(
						eTHValueEMPDepositAmount.mul(PERCENT.FIFTY).div(D_18)
					);
				}
			});

			it("Should deposit correct amount of ERC20 tokens into Strategy Interactors..", async () => {
				const STRATEGIES: string[] = await eMPs[0].contract.utilizedV1EMPStrategy();

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

						// Validate the balance of the strategy Interactor
						expect(BALANCE).to.be.equal(depositAmount[i][ii]);
					}
				}
			});
		});
	});

	describe("function utilizedERC20TotalBalance() (2/2)", async () => {
		let eTHValueEMPDepositAmount: BigNumber = ethers.utils.parseUnits("2", 18);
		let eMPDepositAmounts: UtilizedERC20Amount;
		let depositAmount: BigNumber[][] = [];
		let utilizedERC20: string[] = []

		beforeEach(async () => {
			/**
			* @notice
			* 1) Calculate EMP Deposit Amounts
			* 2) Approve the tokens
			* 3) Deposit ERC20 tokens into EMP
			* 4) Calculate deposit amounts for both strategies by doing the following:
			* 	a) Multiply the ETH value deposited into the EMP by the allocation
			* 5) Deposit tokens into EMP
			*/

			eMPDepositAmounts = await eMPs[0].eMPTransferUtil.calculateERC20Required(eTHValueEMPDepositAmount);

			utilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);

			// Approve the ERC20 tokens for the strategy interactor
			for (let i: number = 0; i < utilizedERC20.length; i++)
			{
				await (await ethers.getContractAt(LOCATION_MOCKERC20, utilizedERC20[i])).approve(
					eMPs[0].contract.address,
					eMPDepositAmounts[i]
				);
			}

			await eMPs[0].contract.utilizedERC20Deposit(eMPDepositAmounts);

			depositAmount[0] = await strategies[0].strategyTransferUtil.calculateERC20Required(
				eTHValueEMPDepositAmount.mul(PERCENT.FIFTY).div(D_18)
			);

			depositAmount[1] = await strategies[1].strategyTransferUtil.calculateERC20Required(
				eTHValueEMPDepositAmount.mul(PERCENT.FIFTY).div(D_18)
			);

			await eMPs[0].contract.utilizedV1EMPStrategyDeposit([depositAmount[0], depositAmount[1]]);
		});


		it("Should return the holdings of the EMP..", async () => {
			const EMP_ERC20_BALANCES = await eMPUtility.utilizedERC20TotalBalance(eMPs[0].contract.address);

			for (let i = 0; i < utilizedERC20.length; i++)
			{
				expect(EMP_ERC20_BALANCES[i]).to.equal(eMPDepositAmounts[i]);
			}
		});
	});

	describe("Multiple EMPs using single Strategy", async () => {
		describe("Expected Success", async () => {
			let eMPDepositAmounts: UtilizedERC20Amount;
			let eMP2DepositAmounts: UtilizedERC20Amount;
			let eTHValueEMPDepositAmount: BigNumber = ethers.utils.parseUnits("2", 18);
			let depositAmountEMP: BigNumber[][] = [];
			let depositAmounteMP2: BigNumber[][] = [];
			let utilizedERC20: string[];


			beforeEach(async () => {
				eMPDepositAmounts = await eMPs[0].eMPTransferUtil.calculateERC20Required(eTHValueEMPDepositAmount);
				eMP2DepositAmounts = await eMPs[1].eMPTransferUtil.calculateERC20Required(eTHValueEMPDepositAmount);

				utilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);
				for (let i: number = 0; i < utilizedERC20.length; i++)
				{
					await (await ethers.getContractAt(LOCATION_MOCKERC20, utilizedERC20[i])).approve(
						eMPs[0].contract.address,
						eMPDepositAmounts[i]
					);
				}

				for (let i: number = 0; i < (await eMPUtility.v1EMP_utilizedERC20(eMPs[1].contract.address)).length; i++)
				{
					await (
						await ethers.getContractAt(LOCATION_MOCKERC20, (await eMPUtility.v1EMP_utilizedERC20(eMPs[1].contract.address))[i])
					).approve(
						eMPs[1].contract.address,
						eMP2DepositAmounts[i]
					);
				}

				await eMPs[0].contract.utilizedERC20Deposit(eMPDepositAmounts);
				await eMPs[1].contract.utilizedERC20Deposit(eMP2DepositAmounts);

				depositAmountEMP[0] = await strategies[0].strategyTransferUtil.calculateERC20Required(
					eTHValueEMPDepositAmount.mul(PERCENT.FIFTY).div(D_18)
				);

				depositAmountEMP[1] = await strategies[1].strategyTransferUtil.calculateERC20Required(
					eTHValueEMPDepositAmount.mul(PERCENT.FIFTY).div(D_18)
				);

				depositAmounteMP2[0] = await strategies[0].strategyTransferUtil.calculateERC20Required(
					eTHValueEMPDepositAmount.mul(PERCENT.SEVENTY_FIVE).div(D_18)
				);

				depositAmounteMP2[1] = await strategies[1].strategyTransferUtil.calculateERC20Required(
					eTHValueEMPDepositAmount.mul(PERCENT.TWENTY_FIVE).div(D_18)
				);

				await eMPs[0].contract.utilizedV1EMPStrategyDeposit([depositAmountEMP[0], depositAmountEMP[1]]);
				await eMPs[1].contract.utilizedV1EMPStrategyDeposit([depositAmounteMP2[0], depositAmounteMP2[1]]);
			});


			it("Expect strategy token supply to add up to what was deposited..", async () => {
				const STRATEGY_1_DEPOSIT_AMOUNT: BigNumber = eTHValueEMPDepositAmount.mul(PERCENT.SEVENTY_FIVE).div(
					D_18
				).add(
					eTHValueEMPDepositAmount.mul(PERCENT.FIFTY).div(D_18)
				);

				const STRATEGY_2_DEPOSIT_AMOUNT: BigNumber = eTHValueEMPDepositAmount.mul(PERCENT.TWENTY_FIVE).div(
					D_18
				).add(
					eTHValueEMPDepositAmount.mul(PERCENT.FIFTY).div(D_18)
				);

				expect(await strategies[0].contract.equityTotal()).to.be.equal(STRATEGY_1_DEPOSIT_AMOUNT);

				expect(await strategies[1].contract.equityTotal()).to.be.equal(STRATEGY_2_DEPOSIT_AMOUNT);
			});

			it("Should distribute the strategy tokens fairely to multiple EMP depositing into it..", async () => {
				const TOTAL_STRATEGY_TOKENS = eTHValueEMPDepositAmount.mul(2).sub(
					await strategies[0].contract.eMP_equity(eMPs[0].contract.address)
				).sub(
					await strategies[1].contract.eMP_equity(eMPs[0].contract.address)
				).sub(
					await strategies[0].contract.eMP_equity(eMPs[1].contract.address)
				).sub(
					await strategies[1].contract.eMP_equity(eMPs[1].contract.address)
				);

				expect(TOTAL_STRATEGY_TOKENS).to.be.equal(ethers.utils.parseUnits("0", 18));
			});
		});
	});
});
