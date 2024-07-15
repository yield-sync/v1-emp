const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

import { ERROR, PERCENT } from "../const";


describe("[4.0] YieldSyncV1EMPStrategy.sol - Setup", async () => {
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
		const [OWNER, MANAGER, TREASURY] = await ethers.getSigners();


		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const YieldSyncV1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPArrayUtility");
		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");
		const YieldSyncV1EMPStrategyUtility: ContractFactory= await ethers.getContractFactory("YieldSyncV1EMPStrategyUtility");
		const YieldSyncV1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategyDeployer");

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const YieldSyncV1EMPStrategy: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategy");
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

		// Testing contracts
		strategyInteractor = await (await StrategyInteractorDummy.deploy()).deployed();
		mockERC20A = await (await MockERC20.deploy("Mock A", "A")).deployed();
		mockERC20B = await (await MockERC20.deploy("Mock B", "B")).deployed();
		mockERC20C = await (await MockERC20.deploy("Mock C", "C")).deployed();

		eTHValueFeed = await (await ETHValueFeedDummy.deploy()).deployed();

		await registry.eRC20_yieldSyncV1EMPERC20ETHValueFeedUpdate(mockERC20A.address, eTHValueFeed.address);
		await registry.eRC20_yieldSyncV1EMPERC20ETHValueFeedUpdate(mockERC20B.address, eTHValueFeed.address);
		await registry.eRC20_yieldSyncV1EMPERC20ETHValueFeedUpdate(mockERC20C.address, eTHValueFeed.address);


		/**
		* @notice The owner has to be registered as the EMP deployer so that it can authorize itself as an EMP to access the
		* functions available on the strategy.
		*/
		await registry.yieldSyncV1EMPUtilityUpdate(OWNER.address);
		await registry.yieldSyncV1EMPDeployerUpdate(OWNER.address);
		await registry.yieldSyncV1EMPRegister(OWNER.address);


		// Set EMP Strategy Deployer on registry
		await registry.yieldSyncV1EMPStrategyDeployerUpdate(strategyDeployer.address);

		// Deploy EMP Strategy
		await strategyDeployer.deployYieldSyncV1EMPStrategy("Strategy", "S");

		// Attach the deployed YieldSyncV1EMPStrategy address
		strategy = await YieldSyncV1EMPStrategy.attach(
			String(await registry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(1))
		);
	});


	describe("function managerUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			await expect(strategy.connect(ADDR_1).managerUpdate(ADDR_1.address)).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
		});

		it("Should allow manager to be changed..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			await expect(strategy.managerUpdate(ADDR_1.address)).to.be.not.rejected;

			expect(await strategy.manager()).to.be.equal(ADDR_1.address);
		});
	});

	describe("function utilizedERC20Update()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			await expect(
				strategy.connect(ADDR_1).utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]])
			).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
		});

		it("Should revert if no ETH Value feed set for the utilized ERC20..", async () => {
			const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");

			let mockERC20C: Contract = await (await MockERC20.deploy("Mock D", "D")).deployed();

			await expect(
				strategy.utilizedERC20Update([mockERC20C.address], [[true, true, PERCENT.HUNDRED]])
			).to.be.rejectedWith(ERROR.STRATEGY.ERC20_NO_ETH_VALUE_FEED_AVAILABLE);
		});

		it("Should revert when INVALID allocation passed..", async () => {
			const [OWNER] = await ethers.getSigners();

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
					await (await ethers.getContractFactory("YieldSyncV1EMPStrategy")).deploy(
						OWNER.address,
						registry.address,
						"Exampe",
						"EX"
					)
				).deployed();

				await expect(
					_YSS.utilizedERC20Update(INVALID_ALLOCATION[i].utilizedERC20, INVALID_ALLOCATION[i].utilization)
				).to.be.rejectedWith(
					ERROR.STRATEGY.INVALID_ALLOCATION
				);
			}
		});

		it("Should not revert when VALID allocation passed..", async () => {
			const [OWNER] = await ethers.getSigners();

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
					await (await ethers.getContractFactory("YieldSyncV1EMPStrategy")).deploy(
						OWNER.address,
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

	describe("function iYieldSyncV1EMPStrategyInteractorUpdate() (Part 1)", async () => {
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () => {
				const [, ADDR_1] = await ethers.getSigners();

				await expect(
					strategy.connect(ADDR_1).iYieldSyncV1EMPStrategyInteractorUpdate(
						strategyInteractor.address
					)
				).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
			}
		);

		it(
			"Should be able to set iYieldSyncV1EMPStrategyInteractor..",
			async () => {
				await strategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				expect(await strategy.iYieldSyncV1EMPStrategyInteractor()).to.be.equal(
					strategyInteractor.address
				);
			}
		);
	});

	describe("function utilizedERC20DepositOpenToggle()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			await expect(strategy.connect(ADDR_1).utilizedERC20DepositOpenToggle()).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
		});

		it("[modifier] Should revert if Strategy Interactor is not set..", async () => {
			await expect(strategy.utilizedERC20DepositOpenToggle()).to.be.rejectedWith(ERROR.STRATEGY.INTERACTOR_NOT_SET);
		});

		it("Should toggle utilizedERC20DepositOpen..", async () => {
			// Set strategy ERC20 tokens
			await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

			// Set SI
			await strategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

			expect(await strategy.utilizedERC20DepositOpen()).to.be.false;

			await expect(strategy.utilizedERC20DepositOpenToggle()).to.be.not.rejected;

			expect(await strategy.utilizedERC20DepositOpen()).to.be.true;
		});
	});

	describe("function utilizedERC20WithdrawOpenToggle()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			await expect(
				strategy.connect(ADDR_1).utilizedERC20WithdrawOpenToggle()
			).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
		});

		it("[modifier] Should revert if Strategy Interactor is not set..", async () => {
			await expect(strategy.utilizedERC20WithdrawOpenToggle()).to.be.rejectedWith(ERROR.STRATEGY.INTERACTOR_NOT_SET);
		});

		it("Should toggle utilizedERC20WithdrawOpen..", async () => {
			// Set strategy ERC20 tokens
			await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

			// Set SI
			await strategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.false;

			await expect(strategy.utilizedERC20WithdrawOpenToggle()).to.be.not.rejected;

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.true;
		});
	});

	describe("function iYieldSyncV1EMPStrategyInteractorUpdate() (Part 2)", async () => {
		beforeEach(async () => {
			// Set strategy ERC20 tokens
			await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

			// Set SI
			await strategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

			expect(await strategy.utilizedERC20DepositOpen()).to.be.false;

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.false;
		});

		it("Should not be able to set iYieldSyncV1EMPStrategyInteractor when utilizedERC20DepositOpen is true..", async () => {
			await expect(strategy.utilizedERC20DepositOpenToggle()).to.be.not.rejected;

			expect(await strategy.utilizedERC20DepositOpen()).to.be.true;

			await expect(
				strategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address)
			).to.be.rejectedWith(ERROR.STRATEGY.UTILIZED_ERC20_TRANSFERS_OPEN);
		});

		it("Should not be able to set iYieldSyncV1EMPStrategyInteractor when utilizedERC20WithdrawOpen is true..", async () => {
			await expect(strategy.utilizedERC20WithdrawOpenToggle()).to.be.not.rejected;

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.true;

			await expect(
				strategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address)
			).to.be.rejectedWith(ERROR.STRATEGY.UTILIZED_ERC20_TRANSFERS_OPEN);
		});
	});
});
