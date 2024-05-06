const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";

import { ERROR, PERCENT } from "../const";
import StrategyTransferUtil from "../scripts/StrategyTransferUtil";


describe("[4.2] YieldSyncV1EMP.sol - Withdrawing Tokens", async () => {
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
		const [OWNER] = await ethers.getSigners();

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
		yieldSyncV1EMPRegistry = await (await YieldSyncV1EMPRegistry.deploy(mockYieldSyncGovernance.address, OWNER.address)).deployed();
		yieldSyncV1EMPDeployer = await (await YieldSyncV1EMPDeployer.deploy(yieldSyncV1EMPRegistry.address)).deployed();
		yieldSyncV1EMPStrategyDeployer = await (
			await YieldSyncV1EMPStrategyDeployer.deploy(yieldSyncV1EMPRegistry.address)
		).deployed();

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

	describe("function utilizedYieldSyncV1EMPStrategyWithdraw()", async () => {
		it("Should NOT allow withdrawing if not open..", async () => {
			/**
			* @notice This test is to check that depositing must be toggled on in order to call the function properly.
			*/
			const UtilizedEMPStrategy: UtilizedEMPStrategyUpdate = [
				[yieldSyncV1EMPStrategy.address, PERCENT.FIFTY],
				[yieldSyncV1EMPStrategy2.address, PERCENT.FIFTY],
			];

			// Set the utilzation to 2 different strategies
			await expect(
				yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedEMPStrategy)
			).to.be.not.rejected;

			// Even if utilizedERC20Amounts, the function should revert with reason that deposits are NOT open
			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyWithdraw(0)).to.be.rejectedWith(
				ERROR.UTILIZED_YIELD_SYNC_V1_EMP_STRATEGY_WITHDRAW_NOT_OPEN
			);
		});

		it("Should not allow msg.sender to withdraw with EMP ERC20 that they do not have..", async () => {
			/**
			* @notice This test should test that msg.sender cannot withdraw more than what they have.
			*/
			const [OWNER] = await ethers.getSigners();

			const UTILIZED_STRATEGIES: UtilizedEMPStrategyUpdate = [
				[yieldSyncV1EMPStrategy.address, PERCENT.FIFTY],
				[yieldSyncV1EMPStrategy2.address, PERCENT.FIFTY],
			];

			// Set the utilzation to 2 different strategies
			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UTILIZED_STRATEGIES)).to.be.not.rejected;

			// Set deposits to open
			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyDepositOpenToggle()).to.be.not.rejected;

			/**
			* @notice Because UTILIZED_STRATEGIES has 2 stratgies with a split of 50/50, the same amount (2) is set for
			* each.
			*/

			const STRATEGY_DEPOSIT_AMOUNTS: BigNumber[] = await strategyTransferUtil.calculateERC20RequiredByTotalAmount(
				ethers.utils.parseUnits("2", 18)
			);

			const STRATEGY2_DEPOSIT_AMOUNTS: BigNumber[] = await strategyTransferUtil2.calculateERC20RequiredByTotalAmount(
				ethers.utils.parseUnits("2", 18)
			);

			// Pass in value for 2 strategies
			const VALID: UtilizedEMPStrategyERC20Amount = [
				[STRATEGY_DEPOSIT_AMOUNTS[0], STRATEGY_DEPOSIT_AMOUNTS[1]],
				[STRATEGY2_DEPOSIT_AMOUNTS[0]]
			];

			// Approve tokens
			await mockERC20A.approve(strategyInteractorDummy.address, STRATEGY_DEPOSIT_AMOUNTS[0]);
			await mockERC20B.approve(strategyInteractorDummy.address, STRATEGY_DEPOSIT_AMOUNTS[1]);
			await mockERC20C.approve(strategyInteractorDummy.address, STRATEGY2_DEPOSIT_AMOUNTS[0]);

			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyDeposit(VALID)).to.not.be.reverted;

			// Check that the OWNER address received something
			expect(await yieldSyncV1EMP.balanceOf(OWNER.address)).to.be.greaterThan(0);

			// Set withdraw to open
			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyWithdrawOpenToggle()).to.be.not.rejected;

			const INVALID_BALANCE = (await yieldSyncV1EMP.balanceOf(OWNER.address)).add(1);

			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyWithdraw(INVALID_BALANCE)).to.be.rejectedWith(
				ERROR.INVALID_BALANCE
			);
		});

		it("Should allow withdrawing tokens from strategy..", async () => {
			/**
			* @notice This test should test that msg.sender cannot withdraw more than what they have.
			*/
			const [OWNER] = await ethers.getSigners();

			const UTILIZED_STRATEGIES: UtilizedEMPStrategyUpdate = [
				[yieldSyncV1EMPStrategy.address, PERCENT.FIFTY],
				[yieldSyncV1EMPStrategy2.address, PERCENT.FIFTY],
			];

			// Set the utilzation to 2 different strategies
			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UTILIZED_STRATEGIES)).to.be.not.rejected;

			// Set deposits to open
			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyDepositOpenToggle()).to.be.not.rejected;

			/**
			* @notice Because UTILIZED_STRATEGIES has 2 stratgies with a split of 50/50, the same amount (2) is set for
			* each.
			*/

			const STRATEGY_DEPOSIT_AMOUNTS: BigNumber[] = await strategyTransferUtil.calculateERC20RequiredByTotalAmount(
				ethers.utils.parseUnits("2", 18)
			);

			const STRATEGY2_DEPOSIT_AMOUNTS: BigNumber[] = await strategyTransferUtil2.calculateERC20RequiredByTotalAmount(
				ethers.utils.parseUnits("2", 18)
			);

			// Pass in value for 2 strategies
			const VALID: UtilizedEMPStrategyERC20Amount = [
				[STRATEGY_DEPOSIT_AMOUNTS[0], STRATEGY_DEPOSIT_AMOUNTS[1]],
				[STRATEGY2_DEPOSIT_AMOUNTS[0]]
			];

			// Approve tokens
			await mockERC20A.approve(strategyInteractorDummy.address, STRATEGY_DEPOSIT_AMOUNTS[0]);
			await mockERC20B.approve(strategyInteractorDummy.address, STRATEGY_DEPOSIT_AMOUNTS[1]);
			await mockERC20C.approve(strategyInteractorDummy.address, STRATEGY2_DEPOSIT_AMOUNTS[0]);

			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyDeposit(VALID)).to.not.be.reverted;

			// Check that the OWNER address received something
			expect(await yieldSyncV1EMP.balanceOf(OWNER.address)).to.be.greaterThan(0);

			// Set withdraw to open
			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyWithdrawOpenToggle()).to.be.not.rejected;

			const VALID_BALANCE = await yieldSyncV1EMP.balanceOf(OWNER.address);

			await yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyWithdraw(VALID_BALANCE);

			expect(await yieldSyncV1EMP.balanceOf(OWNER.address)).to.be.equal(0);

			// Check that the strategy tokens are burnt after withdrawing
			expect(await yieldSyncV1EMPStrategy.balanceOf(yieldSyncV1EMP.address)).to.be.equal(0);
			expect(await yieldSyncV1EMPStrategy2.balanceOf(yieldSyncV1EMP.address)).to.be.equal(0);
		});
	});
});
