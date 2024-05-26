const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

import { ERROR, PERCENT } from "../const";


describe("[2.0] YieldSyncV1EMPStrategy.sol - Setup", async () => {
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;
	let yieldSyncUtilityV1Array: Contract;
	let yieldSyncGovernance: Contract;
	let eTHValueFeed: Contract;
	let strategyInteractor: Contract;
	let yieldSyncV1EMPRegistry: Contract;
	let yieldSyncV1EMPStrategy: Contract;
	let yieldSyncV1EMPStrategyDeployer: Contract;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		/**
		* This process mocks the OWNER address to be an EMP to give authorization to access the functions of a strategy.
		*/
		const [OWNER, MANAGER, TREASURY] = await ethers.getSigners();

		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const YieldSyncUtilityV1Array: ContractFactory = await ethers.getContractFactory("YieldSyncUtilityV1Array");
		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");
		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");
		const YieldSyncV1EMPStrategy: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategy");
		const YieldSyncV1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategyDeployer");

		mockERC20A = await (await MockERC20.deploy()).deployed();
		mockERC20B = await (await MockERC20.deploy()).deployed();
		mockERC20C = await (await MockERC20.deploy()).deployed();
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

		await expect(yieldSyncV1EMPStrategyDeployer.deployYieldSyncV1EMPStrategy("Strategy", "S")).to.be.not.reverted;

		expect(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(1)).to.be.not.equal(
			ethers.constants.AddressZero
		);

		// Attach the deployed YieldSyncV1EMPStrategy address
		yieldSyncV1EMPStrategy = await YieldSyncV1EMPStrategy.attach(
			String(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(1))
		);
	});


	describe("function managerUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			await expect(
				yieldSyncV1EMPStrategy.connect(ADDR_1).managerUpdate(ADDR_1.address)
			).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
		});

		it("Should allow manager to be changed..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			await expect(yieldSyncV1EMPStrategy.managerUpdate(ADDR_1.address)).to.be.not.reverted;

			expect(await yieldSyncV1EMPStrategy.manager()).to.be.equal(ADDR_1.address);
		});
	});

	describe("function utilizedERC20Update()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			await expect(
				yieldSyncV1EMPStrategy.connect(ADDR_1).utilizedERC20Update(
					[mockERC20A.address],
					[[true, true, PERCENT.HUNDRED]]
				)
			).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
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
						yieldSyncUtilityV1Array.address,
						yieldSyncV1EMPRegistry.address,
						"Exampe",
						"EX"
					)
				).deployed();

				await expect(
					_YSS.utilizedERC20Update(INVALID_ALLOCATION[i].utilizedERC20, INVALID_ALLOCATION[i].utilization)
				).to.be.rejectedWith(
					ERROR.INVALID_ALLOCATION
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
				const _YSS = await (
					await (await ethers.getContractFactory("YieldSyncV1EMPStrategy")).deploy(
						OWNER.address,
						yieldSyncUtilityV1Array.address,
						yieldSyncV1EMPRegistry.address,
						"Exampe",
						"EX"
					)
				).deployed();

				await expect(
					_YSS.utilizedERC20Update(VALID_INPUTS[i].utilizedERC20, VALID_INPUTS[i].utilization)
				).to.be.not.reverted;

				// Its important to note that the array gets reordered by this point

				const utilizedERC20 = await _YSS.utilizedERC20();

				await expect(utilizedERC20.length).to.be.equal(VALID_INPUTS[i].utilizedERC20.length);

				// Validate allocation
				for (let ii: number = 0; ii < VALID_INPUTS[i].utilizedERC20.length; ii++)
				{
					const allocation = await _YSS.utilizedERC20_utilization(VALID_INPUTS[i].utilizedERC20[ii]);

					expect(VALID_INPUTS[i].utilization[ii][0]).to.be.equal(allocation[0]);
					expect(VALID_INPUTS[i].utilization[ii][1]).to.be.equal(allocation[1]);
					expect(allocation[2].eq(VALID_INPUTS[i].utilization[ii][2])).to.be.true;
				}
			}
		});
	});

	describe("function iYieldSyncV1EMPETHValueFeedUpdate()", async () => {
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () => {
				const [, ADDR_1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.connect(ADDR_1).iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address)
				).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
			}
		);

		it(
			"Should be able to set yieldSyncV1EMPETHValueFeed..",
			async () => {
				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address)
				).to.be.not.reverted;

				expect(await yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeed()).to.be.equal(eTHValueFeed.address);
			}
		);
	});

	describe("function iYieldSyncV1EMPStrategyInteractorUpdate()", async () => {
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () => {
				const [, ADDR_1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.connect(ADDR_1).iYieldSyncV1EMPStrategyInteractorUpdate(
						strategyInteractor.address
					)
				).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
			}
		);

		it(
			"Should be able to set iYieldSyncV1EMPStrategyInteractor..",
			async () => {
				await yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				expect(await yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractor()).to.be.equal(
					strategyInteractor.address
				);
			}
		);
	});

	describe("function utilizedERC20DepositOpenToggle()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			await expect(
				yieldSyncV1EMPStrategy.connect(ADDR_1).utilizedERC20DepositOpenToggle()
			).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
		});

		it("[modifier] Should revert if ETH FEED is not set..", async () => {
			await expect(
				yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()
			).to.be.rejectedWith(ERROR.ETH_FEED_NOT_SET);
		});

		it("[modifier] Should revert if Strategy is not set..", async () => {
			await expect(
				yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address)
			).to.be.not.reverted;

			await expect(
				yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()
			).to.be.rejectedWith(ERROR.STRATEGY_NOT_SET);
		});

		it("Should toggle utilizedERC20DepositOpen..", async () => {
			// Set strategy ERC20 tokens

			await yieldSyncV1EMPStrategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

			// Set value feed
			await yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address);

			// Set SI
			await yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

			expect(await yieldSyncV1EMPStrategy.utilizedERC20DepositOpen()).to.be.false;

			await expect(yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()).to.be.not.reverted;

			expect(await yieldSyncV1EMPStrategy.utilizedERC20DepositOpen()).to.be.true;
		});
	});

	describe("function utilizedERC20WithdrawOpenToggle()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			await expect(
				yieldSyncV1EMPStrategy.connect(ADDR_1).utilizedERC20WithdrawOpenToggle()
			).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
		});

		it("[modifier] Should revert if ETH FEED is not set..", async () => {
			await expect(
				yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle()
			).to.be.rejectedWith(ERROR.ETH_FEED_NOT_SET);
		});

		it("[modifier] Should revert if strategy is not set..", async () => {
			await yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address);

			await expect(
				yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle()
			).to.be.rejectedWith(ERROR.STRATEGY_NOT_SET);
		});

		it("Should toggle utilizedERC20WithdrawOpen..", async () => {
			// Set strategy ERC20 tokens
			await yieldSyncV1EMPStrategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

			// Set value feed
			await yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address);

			// Set SI
			await yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

			expect(await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.false;

			await expect(yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle()).to.be.not.reverted;

			expect(await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.true;
		});
	});

	describe("function iYieldSyncV1EMPETHValueFeedUpdate() AND function iYieldSyncV1EMPStrategyInteractorUpdate()", async () => {
		beforeEach(async () => {
			// Set strategy ERC20 tokens
			await yieldSyncV1EMPStrategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

			// Set value feed
			await yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address);

			// Set SI
			await yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

			expect(await yieldSyncV1EMPStrategy.utilizedERC20DepositOpen()).to.be.false;

			expect(await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.false;
		});


		it("Should not be able to set iYieldSyncV1EMPETHValueFeed when utilizedERC20DepositOpen is true..", async () => {
			await expect(yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()).to.be.not.reverted;

			expect(await yieldSyncV1EMPStrategy.utilizedERC20DepositOpen()).to.be.true;

			await expect(
				yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(strategyInteractor.address)
			).to.be.revertedWith(ERROR.UTILIZED_ERC20_TRANSFERS_OPEN);
		});

		it("Should not be able to set iYieldSyncV1EMPETHValueFeed when utilizedERC20WithdrawOpen is true..", async () => {
			await expect(yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle()).to.be.not.reverted;

			expect(await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.true;

			await expect(
				yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(strategyInteractor.address)
			).to.be.revertedWith(ERROR.UTILIZED_ERC20_TRANSFERS_OPEN);
		});

		it("Should not be able to set iYieldSyncV1EMPStrategyInteractor when utilizedERC20DepositOpen is true..", async () => {
			await expect(yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()).to.be.not.reverted;

			expect(await yieldSyncV1EMPStrategy.utilizedERC20DepositOpen()).to.be.true;

			await expect(
				yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address)
			).to.be.revertedWith(ERROR.UTILIZED_ERC20_TRANSFERS_OPEN);
		});

		it("Should not be able to set iYieldSyncV1EMPStrategyInteractor when utilizedERC20WithdrawOpen is true..", async () => {
			await expect(yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle()).to.be.not.reverted;

			expect(await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.true;

			await expect(
				yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address)
			).to.be.revertedWith(ERROR.UTILIZED_ERC20_TRANSFERS_OPEN);
		});
	});
});
