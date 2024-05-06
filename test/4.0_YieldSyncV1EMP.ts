const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";

import { ERROR, PERCENT } from "../const";
import StrategyTransferUtil from "../scripts/StrategyTransferUtil";


describe("[4.0] YieldSyncV1EMP.sol - Setup", async () => {
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;
	let mockYieldSyncGovernance: Contract;
	let eTHValueFeedDummy: Contract;
	let strategyInteractorDummy: Contract;
	let yieldSyncV1EMP: Contract;
	let yieldSyncV1EMPDeployer: Contract;
	let yieldSyncV1EMPRegistry: Contract;
	let yieldSyncV1EMPStrategy: Contract;
	let yieldSyncV1EMPStrategy2: Contract;
	let yieldSyncV1EMPStrategyDeployer: Contract;
	let strategyTransferUtil: StrategyTransferUtil;
	let strategyTransferUtil2: StrategyTransferUtil;
	let strategyUtilizedERC20: StrategyUtilizedERC20;
	let strategy2UtilizedERC20: StrategyUtilizedERC20;


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
		const MockYieldSyncGovernance: ContractFactory = await ethers.getContractFactory("MockYieldSyncGovernance");
		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");
		const YieldSyncV1EMPDeployer: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPDeployer");
		const YieldSyncV1EMPStrategy: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategy");
		const YieldSyncV1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory(
			"YieldSyncV1EMPStrategyDeployer"
		);

		mockERC20A = await (await MockERC20.deploy()).deployed();
		mockERC20B = await (await MockERC20.deploy()).deployed();
		mockERC20C = await (await MockERC20.deploy()).deployed();
		eTHValueFeedDummy = await (await ETHValueFeedDummy.deploy()).deployed();
		strategyInteractorDummy = await (await StrategyInteractorDummy.deploy()).deployed();
		mockYieldSyncGovernance = await (await MockYieldSyncGovernance.deploy()).deployed();
		yieldSyncV1EMPRegistry = await (await YieldSyncV1EMPRegistry.deploy(mockYieldSyncGovernance.address)).deployed();
		yieldSyncV1EMPDeployer = await (await YieldSyncV1EMPDeployer.deploy(yieldSyncV1EMPRegistry.address)).deployed();
		yieldSyncV1EMPStrategyDeployer = await (
			await YieldSyncV1EMPStrategyDeployer.deploy(yieldSyncV1EMPRegistry.address)
		).deployed();

		// Set Treasury
		await expect(mockYieldSyncGovernance.payToUpdate(TREASURY.address)).to.not.be.reverted;

		// Set the EMP Deployer on registry
		await expect(yieldSyncV1EMPRegistry.yieldSyncV1EMPDeployerUpdate(yieldSyncV1EMPDeployer.address)).to.not.be.reverted;

		// Set the EMP Strategy Deployer on registry
		await expect(
			yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyDeployerUpdate(yieldSyncV1EMPStrategyDeployer.address)
		).to.not.be.reverted;

		strategyUtilizedERC20 = [
			[mockERC20A.address, true, true, PERCENT.FIFTY],
			[mockERC20B.address, true, true, PERCENT.FIFTY],
		];

		strategy2UtilizedERC20 = [[mockERC20C.address, true, true, PERCENT.HUNDRED]];

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
			yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
		).to.not.be.reverted;

		// Set the Strategy Interactor
		await expect(
			yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
		).to.not.be.reverted;

		await expect(yieldSyncV1EMPStrategy.utilizedERC20Update(strategyUtilizedERC20)).to.be.not.reverted;

		// Enable Deposits and Withdraws
		await expect(yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()).to.not.be.reverted;
		await expect(yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle()).to.not.be.reverted;

		// Set strategyTransferUtil
		strategyTransferUtil = new StrategyTransferUtil(yieldSyncV1EMPStrategy, eTHValueFeedDummy)

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
			yieldSyncV1EMPStrategy2.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
		).to.not.be.reverted;

		// Set the Strategy Interactor on 2nd strategy
		await expect(
			yieldSyncV1EMPStrategy2.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
		).to.not.be.reverted;

		await expect(yieldSyncV1EMPStrategy2.utilizedERC20Update(strategy2UtilizedERC20)).to.be.not.reverted;

		// Enable Deposits and Withdraws
		await expect(yieldSyncV1EMPStrategy2.utilizedERC20DepositOpenToggle()).to.not.be.reverted;
		await expect(yieldSyncV1EMPStrategy2.utilizedERC20WithdrawOpenToggle()).to.not.be.reverted;

		// Set strategyTransferUtil
		strategyTransferUtil2 = new StrategyTransferUtil(yieldSyncV1EMPStrategy2, eTHValueFeedDummy)
	});


	describe("function feeRateManagerUpdate()", async () => {
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () => {
				const [, ADDR_1] = await ethers.getSigners();

				await expect(yieldSyncV1EMP.connect(ADDR_1).feeRateManagerUpdate(ADDR_1.address)).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			}
		);

		it(
			"Should allow feeRateManager to be changed..",
			async () => {
				await expect(yieldSyncV1EMP.feeRateManagerUpdate(1)).to.be.not.reverted;

				expect(await yieldSyncV1EMP.feeRateManager()).to.be.equal(1);
			}
		);
	});

	describe("function feeRateYieldSyncGovernanceUpdate()", async () => {
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () => {
				const [, ADDR_1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMP.connect(ADDR_1).feeRateYieldSyncGovernanceUpdate(ADDR_1.address)
				).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			}
		);

		it(
			"Should allow feeRateManager to be changed..",
			async () => {
				await expect(yieldSyncV1EMP.feeRateYieldSyncGovernanceUpdate(1)).to.be.not.reverted;

				expect(await yieldSyncV1EMP.feeRateYieldSyncGovernance()).to.be.equal(1);
			}
		);
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

			await expect(
				yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedEMPStrategy)
			).to.be.rejectedWith(ERROR.INVALID_ALLOCATION_STRATEGY);
		});

		it("Should allow attaching Strategy to EMP..", async () => {
			const UtilizedEMPStrategy: [string, string][] = [
				[yieldSyncV1EMPStrategy.address, PERCENT.HUNDRED]
			];

			await expect(
				yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedEMPStrategy)
			).to.be.not.rejected;

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

			await expect(
				yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedEMPStrategy)
			).to.be.not.rejected;

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
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () => {
				const [, ADDR_1] = await ethers.getSigners();
				await expect(
					yieldSyncV1EMP.connect(ADDR_1).managerUpdate(ADDR_1.address)
				).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
			}
		);

		it(
			"Should allow manager to be changed..",
			async () => {
				const [, ADDR_1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMP.managerUpdate(ADDR_1.address)
				).to.be.not.reverted;

				expect(await yieldSyncV1EMP.manager()).to.be.equal(ADDR_1.address);
			}
		);
	});
});
