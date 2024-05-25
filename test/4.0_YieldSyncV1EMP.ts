const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";

import { ERROR, PERCENT } from "../const";
import StrategyTransferUtil from "../scripts/StrategyTransferUtil";


describe("[4.0] YieldSyncV1EMP.sol - Setup", async () => {
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;
	let yieldSyncUtilityV1Array: Contract;
	let yieldSyncGovernance: Contract;
	let eTHValueFeed: Contract;
	let strategyInteractor: Contract;
	let yieldSyncV1EMP: Contract;
	let yieldSyncV1EMPDeployer: Contract;
	let yieldSyncV1EMPRegistry: Contract;
	let yieldSyncV1EMPStrategy: Contract;
	let yieldSyncV1EMPStrategy2: Contract;
	let yieldSyncV1EMPStrategyDeployer: Contract;

	let strategyUtilizedERC20: StrategyUtiliziedERC20;
	let strategyUtilization: StrategyUtilization;

	let strategy2UtilizedERC20: StrategyUtiliziedERC20;
	let strategy2Utilization: StrategyUtilization;

	let strategyTransferUtil: StrategyTransferUtil;
	let strategyTransferUtil2: StrategyTransferUtil;


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
		* 	f) Set the strategyTransferUtil for strategy
		*/
		const [OWNER, MANAGER, TREASURY] = await ethers.getSigners();

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");
		const YieldSyncV1EMP: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMP");
		const YieldSyncUtilityV1Array: ContractFactory = await ethers.getContractFactory("YieldSyncUtilityV1Array");
		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");
		const YieldSyncV1EMPDeployer: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPDeployer");
		const YieldSyncV1EMPStrategy: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategy");
		const YieldSyncV1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory(
			"YieldSyncV1EMPStrategyDeployer"
		);

		mockERC20A = await (await MockERC20.deploy()).deployed();
		mockERC20B = await (await MockERC20.deploy()).deployed();
		mockERC20C = await (await MockERC20.deploy()).deployed();
		eTHValueFeed = await (await ETHValueFeedDummy.deploy()).deployed();
		strategyInteractor = await (await StrategyInteractorDummy.deploy()).deployed();
		yieldSyncUtilityV1Array = await (await YieldSyncUtilityV1Array.deploy()).deployed();
		yieldSyncGovernance = await (await YieldSyncGovernance.deploy()).deployed();
		yieldSyncV1EMPRegistry = await (await YieldSyncV1EMPRegistry.deploy(yieldSyncGovernance.address)).deployed();
		yieldSyncV1EMPDeployer = await (await YieldSyncV1EMPDeployer.deploy(yieldSyncV1EMPRegistry.address)).deployed();
		yieldSyncV1EMPStrategyDeployer = await (
			await YieldSyncV1EMPStrategyDeployer.deploy(yieldSyncV1EMPRegistry.address, yieldSyncUtilityV1Array.address)
		).deployed();

		// Set Treasury
		await expect(yieldSyncGovernance.payToUpdate(TREASURY.address)).to.be.not.reverted;

		// Set the EMP Deployer on registry
		await expect(yieldSyncV1EMPRegistry.yieldSyncV1EMPDeployerUpdate(yieldSyncV1EMPDeployer.address)).to.be.not.reverted;

		// Set the EMP Strategy Deployer on registry
		await expect(
			yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyDeployerUpdate(yieldSyncV1EMPStrategyDeployer.address)
		).to.be.not.reverted;

		strategyUtilizedERC20 = [mockERC20A.address, mockERC20B.address];
		strategyUtilization = [[true, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]];

		strategy2UtilizedERC20 = [mockERC20C.address];
		strategy2Utilization = [[true, true, PERCENT.HUNDRED]];

		/**
		* EMP
		*/
		// Deploy an EMP
		await expect(yieldSyncV1EMPDeployer.deployYieldSyncV1EMP("EMP Name", "EMP")).to.be.not.reverted;

		// Verify that a EMP has been registered
		expect(await yieldSyncV1EMPRegistry.yieldSyncV1EMPId_yieldSyncV1EMP(1)).to.be.not.equal(
			ethers.constants.AddressZero
		);

		// Attach the deployed EMP address to a variable
		yieldSyncV1EMP = await YieldSyncV1EMP.attach(
			String(await yieldSyncV1EMPRegistry.yieldSyncV1EMPId_yieldSyncV1EMP(1))
		);

		/**
		* EMP Strategies 1
		*/
		// Deploy EMP Strategy
		await expect(
			yieldSyncV1EMPStrategyDeployer.deployYieldSyncV1EMPStrategy("EMP Strategy Name", "EMPS")
		).to.be.not.reverted;

		// Verify that a EMP Strategy has been registered
		expect(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(1)).to.be.not.equal(
			ethers.constants.AddressZero
		);

		// Attach the deployed YieldSyncV1EMPStrategy address to variable
		yieldSyncV1EMPStrategy = await YieldSyncV1EMPStrategy.attach(
			String(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(1))
		);

		// Set the ETH Value Feed
		await expect(
			yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address)
		).to.be.not.reverted;

		// Set the Strategy Interactor
		await expect(
			yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address)
		).to.be.not.reverted;

		await expect(
			yieldSyncV1EMPStrategy.utilizedERC20Update(strategyUtilizedERC20, strategyUtilization)
		).to.be.not.reverted;

		// Enable Deposits and Withdraws
		await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();

		expect(await yieldSyncV1EMPStrategy.utilizedERC20DepositOpen()).to.be.true;

		await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();

		expect(await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.true;

		// Set strategyTransferUtil
		strategyTransferUtil = new StrategyTransferUtil(yieldSyncV1EMPStrategy, eTHValueFeed)

		/**
		* EMP Strategies 2
		*/
		// Deploy EMP Strategy
		await expect(
			yieldSyncV1EMPStrategyDeployer.deployYieldSyncV1EMPStrategy("EMP Strategy 2 Name", "EMPS2")
		).to.be.not.reverted;

		// Verify that a 2nd EMP Strategy has been registered
		expect(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(2)).to.be.not.equal(
			ethers.constants.AddressZero
		);

		// Attach the 2nd deployed YieldSyncV1EMPStrategy address to a variable
		yieldSyncV1EMPStrategy2 = await YieldSyncV1EMPStrategy.attach(
			String(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(2))
		);

		// Set the ETH Value Feed on 2nd strategy
		await expect(
			yieldSyncV1EMPStrategy2.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address)
		).to.be.not.reverted;

		// Set the Strategy Interactor on 2nd strategy
		await expect(
			yieldSyncV1EMPStrategy2.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address)
		).to.be.not.reverted;

		await expect(
			yieldSyncV1EMPStrategy2.utilizedERC20Update(strategy2UtilizedERC20, strategy2Utilization)
		).to.be.not.reverted;

		// Enable Deposits and Withdraws
		await expect(yieldSyncV1EMPStrategy2.utilizedERC20DepositOpenToggle()).to.be.not.reverted;
		await expect(yieldSyncV1EMPStrategy2.utilizedERC20WithdrawOpenToggle()).to.be.not.reverted;

		// Set strategyTransferUtil
		strategyTransferUtil2 = new StrategyTransferUtil(yieldSyncV1EMPStrategy2, eTHValueFeed)
	});


	describe("function feeRateManagerUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			await expect(yieldSyncV1EMP.connect(ADDR_1).feeRateManagerUpdate(ADDR_1.address)).to.be.rejectedWith(
				ERROR.NOT_AUTHORIZED
			);
		});

		it("Should allow feeRateManager to be changed..", async () => {
			await expect(yieldSyncV1EMP.feeRateManagerUpdate(1)).to.be.not.reverted;

			expect(await yieldSyncV1EMP.feeRateManager()).to.be.equal(1);
		});
	});

	describe("function feeRateYieldSyncGovernanceUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			await expect(
				yieldSyncV1EMP.connect(ADDR_1).feeRateYieldSyncGovernanceUpdate(ADDR_1.address)
			).to.be.rejectedWith(
				ERROR.NOT_AUTHORIZED
			);
		});

		it("Should allow feeRateManager to be changed..", async () => {
			await expect(yieldSyncV1EMP.feeRateYieldSyncGovernanceUpdate(1)).to.be.not.reverted;

			expect(await yieldSyncV1EMP.feeRateYieldSyncGovernance()).to.be.equal(1);
		});
	});

	describe("function utilizedYieldSyncV1EMPStrategyUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			const UtilizedEMPStrategy: UtilizedEMPStrategyUpdate = [];

			await expect(
				yieldSyncV1EMP.connect(ADDR_1).utilizedYieldSyncV1EMPStrategyUpdate(UtilizedEMPStrategy)
			).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
		});

		it("Should NOT allow strategies that add up to more than 100% to EMP..", async () => {
			const UtilizedEMPStrategy: UtilizedEMPStrategyUpdate = [
				[yieldSyncV1EMPStrategy.address, PERCENT.HUNDRED],
				[yieldSyncV1EMPStrategy2.address, PERCENT.FIFTY],
			];

			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedEMPStrategy)).to.be.rejectedWith(
				ERROR.INVALID_ALLOCATION_STRATEGY
			);
		});

		it("Should allow attaching Strategy to EMP..", async () => {
			const UtilizedEMPStrategy: [string, string][] = [
				[yieldSyncV1EMPStrategy.address, PERCENT.HUNDRED]
			];

			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedEMPStrategy)).to.be.not.reverted;

			const strategies: UtilizedEMPStrategy[] = await yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategy();

			expect(strategies.length).to.be.equal(UtilizedEMPStrategy.length);

			expect(strategies[0].yieldSyncV1EMPStrategy).to.be.equal(yieldSyncV1EMPStrategy.address);
			expect(strategies[0].allocation).to.be.equal(PERCENT.HUNDRED);
		});

		it("Should allow attaching multiple Strategies to EMP..", async () => {
			const UtilizedEMPStrategy: [string, string][] = [
				[yieldSyncV1EMPStrategy.address, PERCENT.FIFTY],
				[yieldSyncV1EMPStrategy2.address, PERCENT.FIFTY],
			];

			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedEMPStrategy)).to.be.not.reverted;

			const strategies: UtilizedEMPStrategy[] = await yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategy();

			expect(strategies.length).to.be.equal(UtilizedEMPStrategy.length);

			for (let i = 0; i < strategies.length; i++)
			{
				expect(strategies[i].yieldSyncV1EMPStrategy).to.be.equal(UtilizedEMPStrategy[i][0]);
				expect(strategies[i].allocation).to.be.equal(UtilizedEMPStrategy[i][1]);
			}
		});
	});

	describe("function managerUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			await expect(yieldSyncV1EMP.connect(ADDR_1).managerUpdate(ADDR_1.address)).to.be.rejectedWith(
				ERROR.NOT_AUTHORIZED
			);
		});

		it("Should allow manager to be changed..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			await expect(
				yieldSyncV1EMP.managerUpdate(ADDR_1.address)
			).to.be.not.reverted;

			expect(await yieldSyncV1EMP.manager()).to.be.equal(ADDR_1.address);
		});
	});
});
