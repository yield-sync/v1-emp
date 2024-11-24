const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory, VoidSigner } from "ethers";

import { approveTokens, deployContract, deployEMP, deployStrategies } from "./Scripts";
import { D_18, ERROR, PERCENT } from "../const";


const LOCATION_MOCKERC20: string = "MockERC20";
const LOCATION_STRATGY: string = "V1EMPStrategy";


describe("[7.1] V1EMP.sol - Depositing Tokens", async () => {
	let eTHValueEMPDepositAmount: BigNumber = ethers.utils.parseUnits("1", 18);

	let arrayUtility: Contract;
	let governance: Contract;
	let eTHValueFeed: Contract;
	let eTHValueFeedC: Contract;
	let eMPDeployer: Contract;
	let eMPUtility: Contract;
	let registry: Contract;
	let strategyDeployer: Contract;
	let strategyUtility: Contract;
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;
	let strategyInteractor: Contract;
	let strategyInteractor2: Contract;

	let owner: VoidSigner;
	let manager: VoidSigner;
	let treasury: VoidSigner;

	let eMPs: TestEMP[] = [];

	let strategies: TestStrategy[] = [];


	beforeEach("[beforeEach] Set up contracts..", async () => {
		[owner, manager, treasury] = await ethers.getSigners();


		governance = await deployContract("YieldSyncGovernance");

		await governance.payToUpdate(treasury.address);

		arrayUtility = await deployContract("V1EMPArrayUtility");

		registry = await deployContract("V1EMPRegistry", [governance.address]);

		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

		strategyUtility = await deployContract("V1EMPStrategyUtility", [registry.address]);

		await registry.v1EMPStrategyUtilityUpdate(strategyUtility.address);

		strategyDeployer = await deployContract("V1EMPStrategyDeployer", [registry.address]);

		await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);

		eMPUtility = await deployContract("V1EMPUtility", [registry.address]);

		await registry.v1EMPUtilityUpdate(eMPUtility.address);

		eMPDeployer = await deployContract("V1EMPDeployer", [registry.address]);

		await registry.v1EMPDeployerUpdate(eMPDeployer.address);

		strategyInteractor = await deployContract("StrategyInteractorDummy");
		strategyInteractor2 = await deployContract("StrategyInteractorDummy");

		mockERC20A = await deployContract("MockERC20", ["Mock A", "A", 18]);
		mockERC20B = await deployContract("MockERC20", ["Mock B", "B", 18]);
		mockERC20C = await deployContract("MockERC20", ["Mock C", "C", 6]);

		eTHValueFeed = await deployContract("ETHValueFeedDummy", [18]);
		eTHValueFeedC = await deployContract("ETHValueFeedDummy", [6]);

		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20A.address, eTHValueFeed.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20B.address, eTHValueFeed.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20C.address, eTHValueFeedC.address);

		/**
		* EMP Strategies
		*/
		strategies = await deployStrategies(
			registry,
			strategyDeployer,
			await ethers.getContractFactory("V1EMPStrategy"),
			[
				{
					strategyUtilizedERC20: [mockERC20A.address, mockERC20B.address],
					strategyUtilization: [[true, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]],
					strategyInteractor: strategyInteractor.address
				},
				{
					strategyUtilizedERC20: [mockERC20C.address],
					strategyUtilization: [[true, true, PERCENT.HUNDRED]],
					strategyInteractor: strategyInteractor2.address
				},
			]
		);

		/**
		* EMP
		*/
		eMPs = await deployEMP(
			manager.address,
			registry,
			eMPDeployer,
			eMPUtility,
			[
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
			]
		);
	});

	describe("EMP with uninitialized Strategies", async () => {
		let eMPDepositAmounts: UtilizedERC20Amount;
		let depositAmount: UtilizedERC20Amount = [];

		let _eMPs: TestEMP[] = [];

		let _strategies: TestStrategy[] = [];


		beforeEach(async () => {
			// Deploy Strategies
			_strategies = await deployStrategies(
				registry,
				strategyDeployer,
				await ethers.getContractFactory("V1EMPStrategy"),
				[
					{
						strategyUtilizedERC20: [mockERC20A.address, mockERC20B.address],
						strategyUtilization: [[true, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]]
					},
					{
						strategyUtilizedERC20: [mockERC20C.address],
						strategyUtilization: [[true, true, PERCENT.HUNDRED]]
					},
				]
			);

			// Deploy EMPa
			_eMPs = await deployEMP(
				manager.address,
				registry,
				eMPDeployer,
				eMPUtility,
				[
					{
						name: "EMP 1",
						ticker: "EMP1",
						utilizedEMPStrategyUpdate: [_strategies[0].contract.address, _strategies[1].contract.address],
						utilizedEMPStrategyAllocationUpdate: [PERCENT.FIFTY, PERCENT.FIFTY],
					},
				]
			);
		});


		it("Should allow setting utilizedERC20 on EMP..", async () => {
			let utilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(_eMPs[0].contract.address);

			let myUtilizedERC20 = await arrayUtility.sort([mockERC20A.address, mockERC20B.address, mockERC20C.address])

			for (let i = 0; i < utilizedERC20.length; i++)
			{
				expect(utilizedERC20[i]).to.be.equal(myUtilizedERC20[i]);
			}

			// Reorder the ERC20
			for (let i = 0; i < utilizedERC20.length; i++)
			{
				let utilization = await eMPUtility.v1EMP_utilizedERC20_utilizationERC20(
					eMPs[0].contract.address,
					utilizedERC20[i]
				);

				switch (utilizedERC20[i])
				{
					case mockERC20A.address:
						expect(utilization.allocation).to.be.equal(PERCENT.TWENTY_FIVE);
						break;
					case mockERC20B.address:
						expect(utilization.allocation).to.be.equal(PERCENT.TWENTY_FIVE);
						break;
					case mockERC20C.address:
						expect(utilization.allocation).to.be.equal(PERCENT.FIFTY);
						break;
					default:
						break;
				}
			}
		});

		it("Should allow depositing of tokens..", async () => {
			// This test is significant because
			eMPDepositAmounts = await _eMPs[0].eMPTransferUtil.calculatedUtilizedERC20Amount(eTHValueEMPDepositAmount);

			// Approve tokens
			await approveTokens(
				_eMPs[0].contract.address,
				await eMPUtility.v1EMP_utilizedERC20(_eMPs[0].contract.address),
				eMPDepositAmounts
			);

			// Deposit the utilized ERC20 tokens into EMP
			await _eMPs[0].contract.utilizedERC20Deposit(eMPDepositAmounts);

			depositAmount[0] = await _strategies[0].strategyTransferUtil.calculateERC20Required(
				eTHValueEMPDepositAmount.mul(PERCENT.FIFTY).div(D_18)
			);

			depositAmount[1] = await _strategies[1].strategyTransferUtil.calculateERC20Required(
				eTHValueEMPDepositAmount.mul(PERCENT.FIFTY).div(D_18)
			);

			// Expect that the owner address received something
			expect(await _eMPs[0].contract.balanceOf(owner.address)).to.be.greaterThan(0);
		});
	});


	describe("function utilizedERC20Deposit()", async () => {
		describe("Expected Failure", async () => {
			it("Should NOT allow depositing if not open..", async () => {
				/**
				* @notice This test is to check that depositing must be on in order to call the function properly.
				*/

				// Close deposits
				await eMPs[0].contract.utilizedERC20DepositOpenUpdate(false);

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

				eMPDepositAmounts = await eMPs[0].eMPTransferUtil.calculatedUtilizedERC20Amount(eTHValueEMPDepositAmount);

				const utilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);

				await approveTokens(eMPs[0].contract.address, utilizedERC20, eMPDepositAmounts);

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

				eMPDepositAmounts = await eMPs[0].eMPTransferUtil.calculatedUtilizedERC20Amount(eTHValueEMPDepositAmount);

				const utilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);

				await approveTokens(eMPs[0].contract.address, utilizedERC20, eMPDepositAmounts);
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

					await strategies[0].contract.utilizedERC20DepositOpenUpdate(false);

					await strategies[0].contract.utilizedERC20WithdrawOpenUpdate(false);

					// Update the utilized tokens for the first strategy..
					await strategies[0].contract.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);
				});


				it("Should be reverted if using old eMPDepositAmounts..", async () => {
					await expect(eMPs[0].contract.utilizedERC20Deposit(eMPDepositAmounts)).to.be.revertedWith(
						ERROR.EMP.INVALID_UTILIZED_ERC20_LENGTH
					);
				});

				it("Should update EMP's utilizedERC20 array to be a union of the strategy's utilizedERC20s..", async () => {
					/**
					* @dev The expectation is that the utilizd ERC20s are updated the next time the user tries to deposit
					* the required tokens
					*/

					let result = await eMPs[0].eMPTransferUtil.calculatedUtilizedERC20AmountExpected(
						eTHValueEMPDepositAmount
					);

					utilizedERC20 = result.updatedUtilizedERC20;
					eMPDepositAmounts = result.calculatedERC20Required;

					await approveTokens(eMPs[0].contract.address, utilizedERC20, eMPDepositAmounts);

					await expect(eMPs[0].contract.utilizedERC20Deposit(eMPDepositAmounts)).to.be.not.reverted;

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

			eMPDepositAmounts = await eMPs[0].eMPTransferUtil.calculatedUtilizedERC20Amount(eTHValueEMPDepositAmount);

			utilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);

			await approveTokens(eMPs[0].contract.address, utilizedERC20, eMPDepositAmounts);

			await eMPs[0].contract.utilizedERC20Deposit(eMPDepositAmounts);
		});


		it("Should return the holdings of the EMP..", async () => {
			const EMP_ERC20_BALANCES = await eMPs[0].contract.utilizedERC20TotalBalance();

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

			eMPDepositAmounts = await eMPs[0].eMPTransferUtil.calculatedUtilizedERC20Amount(eTHValueEMPDepositAmount);

			utilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);

			await approveTokens(eMPs[0].contract.address, utilizedERC20, eMPDepositAmounts);

			// Deposit the utilized ERC20 tokens into EMP
			await eMPs[0].contract.utilizedERC20Deposit(eMPDepositAmounts);
		});


		describe("Expected Failure", async () => {
			it("Should NOT allow depositing into strategies if not open..", async () => {
				// Close deposits
				await eMPs[0].contract.utilizedERC20DepositOpenUpdate(false);

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

					expect(await strategy.eMP_shares(eMPs[0].contract.address)).to.be.equal(
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

			eMPDepositAmounts = await eMPs[0].eMPTransferUtil.calculatedUtilizedERC20Amount(eTHValueEMPDepositAmount);

			utilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);

			await approveTokens(eMPs[0].contract.address, utilizedERC20, eMPDepositAmounts);

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
			const EMP_ERC20_BALANCES = await eMPs[0].contract.utilizedERC20TotalBalance();

			for (let i = 0; i < utilizedERC20.length; i++)
			{
				expect(EMP_ERC20_BALANCES[i]).to.equal(eMPDepositAmounts[i]);
			}
		});
	});

	describe("Multiple EMPs using single Strategy", async () => {
		describe("Expected Success", async () => {
			let eTHValueEMPDepositAmount: BigNumber = ethers.utils.parseUnits("2", 18);

			let eMPDepositAmounts: UtilizedERC20Amount;
			let eMP2DepositAmounts: UtilizedERC20Amount;

			let depositAmountEMP: BigNumber[][] = [];
			let depositAmounteMP2: BigNumber[][] = [];
			let utilizedERC20EMP1: string[];
			let utilizedERC20EMP2: string[];


			beforeEach(async () => {
				eMPDepositAmounts = await eMPs[0].eMPTransferUtil.calculatedUtilizedERC20Amount(eTHValueEMPDepositAmount);
				eMP2DepositAmounts = await eMPs[1].eMPTransferUtil.calculatedUtilizedERC20Amount(eTHValueEMPDepositAmount);

				utilizedERC20EMP1 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);
				utilizedERC20EMP2 = await eMPUtility.v1EMP_utilizedERC20(eMPs[1].contract.address);

				await approveTokens(eMPs[0].contract.address, utilizedERC20EMP1, eMPDepositAmounts);
				await approveTokens(eMPs[1].contract.address, utilizedERC20EMP2, eMP2DepositAmounts);

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

				expect(await strategies[0].contract.sharesTotal()).to.be.equal(STRATEGY_1_DEPOSIT_AMOUNT);

				expect(await strategies[1].contract.sharesTotal()).to.be.equal(STRATEGY_2_DEPOSIT_AMOUNT);
			});

			it("Should distribute the strategy tokens fairely to multiple EMP depositing into it..", async () => {
				const TOTAL_STRATEGY_TOKENS = eTHValueEMPDepositAmount.mul(2).sub(
					await strategies[0].contract.eMP_shares(eMPs[0].contract.address)
				).sub(
					await strategies[1].contract.eMP_shares(eMPs[0].contract.address)
				).sub(
					await strategies[0].contract.eMP_shares(eMPs[1].contract.address)
				).sub(
					await strategies[1].contract.eMP_shares(eMPs[1].contract.address)
				);

				expect(TOTAL_STRATEGY_TOKENS).to.be.equal(ethers.utils.parseUnits("0", 18));
			});
		});
	});
});
