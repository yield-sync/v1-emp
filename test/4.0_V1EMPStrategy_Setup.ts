const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory, VoidSigner } from "ethers";

import { ERROR, PERCENT } from "../const";


describe("[4.0] V1EMPStrategy.sol - Setup", async () => {
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
	let mockERC20C: Contract;

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
		*/
		[owner, manager, treasury, badActor] = await ethers.getSigners();


		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const V1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("V1EMPArrayUtility");
		const V1EMPRegistry: ContractFactory = await ethers.getContractFactory("V1EMPRegistry");
		const V1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("V1EMPStrategyDeployer");

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const V1EMPStrategy: ContractFactory = await ethers.getContractFactory("V1EMPStrategy");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");


		// Core contracts
		governance = await (await YieldSyncGovernance.deploy()).deployed();

		await governance.payToUpdate(treasury.address);

		arrayUtility = await (await V1EMPArrayUtility.deploy()).deployed();

		registry = await (await V1EMPRegistry.deploy(governance.address)).deployed();

		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

		strategyDeployer = await (await V1EMPStrategyDeployer.deploy(registry.address)).deployed();

		// Testing contracts
		strategyInteractor = await (await StrategyInteractorDummy.deploy()).deployed();
		mockERC20A = await (await MockERC20.deploy("Mock A", "A")).deployed();
		mockERC20B = await (await MockERC20.deploy("Mock B", "B")).deployed();
		mockERC20C = await (await MockERC20.deploy("Mock C", "C")).deployed();

		eTHValueFeed = await (await ETHValueFeedDummy.deploy()).deployed();

		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20A.address, eTHValueFeed.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20B.address, eTHValueFeed.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20C.address, eTHValueFeed.address);


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
		strategy = await V1EMPStrategy.attach(String(await registry.v1EMPStrategyId_v1EMPStrategy(1)));
	});


	describe("function managerUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			await expect(strategy.connect(badActor).managerUpdate(badActor.address)).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
		});

		it("Should allow manager to be changed..", async () => {
			await expect(strategy.managerUpdate(manager.address)).to.be.not.rejected;

			expect(await strategy.manager()).to.be.equal(manager.address);
		});
	});

	describe("function utilizedERC20Update() (1/2)", async () => {
		describe("Expected Failure", async () => {
			it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
				await expect(
					strategy.connect(badActor).utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]])
				).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});

			it("Should revert if different lengths for __utilizedERC20 and _utilizationERC2 passed..", async () => {
				await expect(strategy.utilizedERC20Update([mockERC20A.address], [])).to.be.rejectedWith(
					ERROR.STRATEGY.INVALID_PARAMS_UPDATE_LENGTHS
				);
			});

			it("Should revert if array contains duplicates..", async () => {
				await expect(
					strategy.utilizedERC20Update(
						[mockERC20A.address, mockERC20A.address],
						[
							[true, true, PERCENT.FIFTY],
							[true, true, PERCENT.FIFTY],
						]
					)
				).to.be.rejectedWith(
					ERROR.STRATEGY.INVALID_PARAMS_UPDATE_CONTAINS_DUPLCIATES
				);
			});

			it("Should revert if no ETH Value feed set for the utilized ERC20..", async () => {
				const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");

				let mockERC20D: Contract = await (await MockERC20.deploy("Mock D", "D")).deployed();

				await expect(
					strategy.utilizedERC20Update([mockERC20D.address], [[true, true, PERCENT.HUNDRED]])
				).to.be.rejectedWith(ERROR.STRATEGY.ERC20_NO_ETH_VALUE_FEED_AVAILABLE);
			});

			it("Should revert when INVALID allocation passed..", async () => {
				const INVALID_ALLOCATION: StrategyUtilizedERC20Update[] = [
					{
						utilizedERC20: [mockERC20A.address],
						utilization: [[true, true, PERCENT.FIFTY]]
					},
					{
						utilizedERC20: [mockERC20A.address],
						utilization: [[true, false, PERCENT.FIFTY]]
					},
					{
						utilizedERC20: [mockERC20A.address],
						utilization: [[false, false, PERCENT.FIFTY]]
					},
					{
						utilizedERC20: [mockERC20A.address],
						utilization: [[false, true, PERCENT.HUNDRED]]
					},
					{
						utilizedERC20: [mockERC20A.address],
						utilization: [[false, false, PERCENT.HUNDRED]]
					},
					{
						utilizedERC20: [mockERC20A.address, mockERC20B.address],
						utilization: [[true, true, PERCENT.FIFTY], [true, true, PERCENT.TWENTY_FIVE]],
					},
					{
						utilizedERC20: [mockERC20A.address, mockERC20B.address],
						utilization: [[false, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]]
					},
				];

				for (let i: number = 0; i < INVALID_ALLOCATION.length; i++)
				{
					// Deploy a temporary contract
					const _YSS = await (
						await (await ethers.getContractFactory("V1EMPStrategy")).deploy(
							owner.address,
							registry.address,
							"Exampe",
							"EX"
						)
					).deployed();

					await expect(
						_YSS.utilizedERC20Update(INVALID_ALLOCATION[i].utilizedERC20, INVALID_ALLOCATION[i].utilization)
					).to.be.rejectedWith(
						ERROR.STRATEGY.INVALID_ERC20_ALLOCATION_TOTAL
					);
				}
			});
		});

		describe("Expected Success", async () => {
			it("Should not revert when VALID allocation passed..", async () => {
				const VALID_INPUTS: StrategyUtilizedERC20Update[] = [
					{
						utilizedERC20: [mockERC20A.address],
						utilization: [[true, true, PERCENT.HUNDRED]]
					},
					{
						utilizedERC20: [mockERC20A.address, mockERC20B.address, mockERC20C.address],
						utilization: [[false, true, PERCENT.ZERO], [true, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]],
					},
					// Even if withdraw token is set to 100% it should be accepted
					{
						utilizedERC20: [mockERC20A.address, mockERC20B.address, mockERC20C.address],
						utilization: [
							[false, true, PERCENT.HUNDRED],
							[true, true, PERCENT.FIFTY],
							[true, true, PERCENT.FIFTY],
						]
					},
				];

				for (let i: number = 0; i < VALID_INPUTS.length; i++)
				{
					const INPUT = VALID_INPUTS[i];

					const _YSS = await (
						await (await ethers.getContractFactory("V1EMPStrategy")).deploy(
							owner.address,
							registry.address,
							"Exampe",
							"EX"
						)
					).deployed();

					await expect(_YSS.utilizedERC20Update(INPUT.utilizedERC20, INPUT.utilization)).to.be.not.rejected;

					/**
					* NOTE: The array is expected to be reordered by this point so this test will have to map the VALID_INPUT
					* to what is in the array returned from the Contract. There is a chance that this test will fail.
					*/

					const utilizedERC20 = await _YSS.utilizedERC20();

					await expect(utilizedERC20.length).to.be.equal(INPUT.utilizedERC20.length);

					// Validate allocation
					for (let ii: number = 0; ii < INPUT.utilizedERC20.length; ii++)
					{
						const allocation = await _YSS.utilizedERC20_utilizationERC20(INPUT.utilizedERC20[ii]);

						expect(INPUT.utilization[ii][0]).to.be.equal(allocation[0]);
						expect(INPUT.utilization[ii][1]).to.be.equal(allocation[1]);

						expect(allocation[2].eq(INPUT.utilization[ii][2])).to.be.true;
					}
				}
			});
		});
	});

	describe("function iV1EMPStrategyInteractorUpdate() (1/2)", async () => {

		/**
		 * @notice
		 * This is split up because the next tests for Deposits/Withdrawals toggle functions is dependant on the SI to be
		 * set. Part 2 is dependant the Deposits/Withdrawals toggle to be functional.
		*/

		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () => {
				await expect(
					strategy.connect(badActor).iV1EMPStrategyInteractorUpdate(strategyInteractor.address)
				).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			}
		);

		it(
			"Should be able to set iV1EMPStrategyInteractor..",
			async () => {
				await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				expect(await strategy.iV1EMPStrategyInteractor()).to.be.equal(strategyInteractor.address);
			}
		);
	});

	describe("function utilizedERC20DepositOpenToggle()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			await expect(strategy.connect(badActor).utilizedERC20DepositOpenToggle()).to.be.rejectedWith(
				ERROR.NOT_AUTHORIZED
			);
		});

		it("[modifier] Should revert if Strategy Interactor is not set..", async () => {
			await expect(strategy.utilizedERC20DepositOpenToggle()).to.be.rejectedWith(ERROR.STRATEGY.INTERACTOR_NOT_SET);
		});

		it("Should toggle utilizedERC20DepositOpen..", async () => {
			// Set strategy ERC20 tokens
			await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

			// Set SI
			await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

			expect(await strategy.utilizedERC20DepositOpen()).to.be.false;

			await expect(strategy.utilizedERC20DepositOpenToggle()).to.be.not.rejected;

			expect(await strategy.utilizedERC20DepositOpen()).to.be.true;
		});
	});

	describe("function utilizedERC20WithdrawOpenToggle()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			await expect(
				strategy.connect(badActor).utilizedERC20WithdrawOpenToggle()
			).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
		});

		it("[modifier] Should revert if Strategy Interactor is not set..", async () => {
			await expect(strategy.utilizedERC20WithdrawOpenToggle()).to.be.rejectedWith(ERROR.STRATEGY.INTERACTOR_NOT_SET);
		});

		it("Should toggle utilizedERC20WithdrawOpen..", async () => {
			// Set strategy ERC20 tokens
			await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

			// Set SI
			await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.false;

			await expect(strategy.utilizedERC20WithdrawOpenToggle()).to.be.not.rejected;

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.true;
		});
	});

	describe("function utilizedERC20Update() (2/2)", async () => {
		beforeEach(async () => {
			// Set strategy ERC20 tokens
			await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

			// Set SI
			await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

			expect(await strategy.utilizedERC20DepositOpen()).to.be.false;

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.false;
		});


		it("Should not be able to set update utilized ERC20 when utilizedERC20DepositOpen is true..", async () => {
			await strategy.utilizedERC20DepositOpenToggle();

			expect(await strategy.utilizedERC20DepositOpen()).to.be.true;

			await expect(
				strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]])
			).to.be.rejectedWith(
				ERROR.STRATEGY.UTILIZED_ERC20_TRANSFERS_OPEN
			);
		});
	});

	describe("function iV1EMPStrategyInteractorUpdate() (2/2)", async () => {
		beforeEach(async () => {
			// Set strategy ERC20 tokens
			await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

			// Set SI
			await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

			expect(await strategy.utilizedERC20DepositOpen()).to.be.false;

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.false;
		});


		it("Should not be able to set iV1EMPStrategyInteractor when utilizedERC20DepositOpen is true..", async () => {
			await expect(strategy.utilizedERC20DepositOpenToggle()).to.be.not.rejected;

			expect(await strategy.utilizedERC20DepositOpen()).to.be.true;

			await expect(strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address)).to.be.rejectedWith(
				ERROR.STRATEGY.UTILIZED_ERC20_TRANSFERS_OPEN
			);
		});

		it("Should not be able to set iV1EMPStrategyInteractor when utilizedERC20WithdrawOpen is true..", async () => {
			await expect(strategy.utilizedERC20WithdrawOpenToggle()).to.be.not.rejected;

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.true;

			await expect(strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address)).to.be.rejectedWith(
				ERROR.STRATEGY.UTILIZED_ERC20_TRANSFERS_OPEN
			);
		});
	});
});
