const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";

import { ERROR, PERCENT } from "../const";
import StrategyTransferUtil from "../scripts/StrategyTransferUtil";


describe("[4.1] YieldSyncV1EMP.sol - Depositing Tokens", async () => {
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;
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
		yieldSyncV1EMPRegistry = await (await YieldSyncV1EMPRegistry.deploy()).deployed();
		yieldSyncV1EMPDeployer = await (
			await YieldSyncV1EMPDeployer.deploy(OWNER.address, yieldSyncV1EMPRegistry.address)
		).deployed();
		yieldSyncV1EMPStrategyDeployer = await (
			await YieldSyncV1EMPStrategyDeployer.deploy(OWNER.address, yieldSyncV1EMPRegistry.address)
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

	describe("function utilizedYieldSyncV1EMPStrategyDeposit()", async () => {
		it("Should NOT allow depositing if not open..", async () => {
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
			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyDeposit([[], []])).to.be.rejectedWith(
				ERROR.UTILIZED_YIELD_SYNC_V1_EMP_STRATEGY_DEPOSIT_NOT_OPEN
			);
		});

		it("Should NOT allow invalid lengthed _utilizedYieldSyncV1EMPStrategyERC20Amount (1D)..", async () => {
			/**
			* @notice This test is to check that if the total amount of strategies is correctly set, then passing in a param
			* with incorrect first dimension of the 2d param will be rejected.
			*/
			const UtilizedEMPStrategy: UtilizedEMPStrategyUpdate = [[yieldSyncV1EMPStrategy.address, PERCENT.HUNDRED]];

			// Set the utilization to a single strategies
			await expect(
				yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedEMPStrategy)
			).to.be.not.rejected;

			// Open deposits
			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyDepositOpenToggle()).to.be.not.rejected;

			// Pass in value for 0 strategies
			const INVALID: UtilizedEMPStrategyERC20Amount = [];

			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyDeposit(INVALID)).to.be.rejectedWith(
				ERROR.INVALID_UTILIZED_ERC20_AMOUNT_EMP
			);

			// Close deposits
			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyDepositOpenToggle()).to.be.not.rejected;

			const UtilizedEMPStrategy2: UtilizedEMPStrategyUpdate = [
				[yieldSyncV1EMPStrategy.address, PERCENT.FIFTY],
				[yieldSyncV1EMPStrategy2.address, PERCENT.FIFTY],
			];

			// Set the utilization to 2 strategies
			await expect(
				yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedEMPStrategy2)
			).to.be.not.rejected;

			// Open deposits
			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyDepositOpenToggle()).to.be.not.rejected;

			// Pass in value for 1 strategies (should require 2)
			const INVALID2: UtilizedEMPStrategyERC20Amount = [
				[ethers.utils.parseUnits("2", 18), ethers.utils.parseUnits("2", 18)]
			];

			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyDeposit(INVALID2)).to.be.rejectedWith(
				ERROR.INVALID_UTILIZED_ERC20_AMOUNT_EMP
			);
		});

		it("Should NOT allow invalid AMOUNTS to be passed (2D)..", async () => {
			/**
			* @notice This test should test that depositing the incorrect amounts (within the 2nd dimension of
			* _utilizedERC20Amount) the function should revert.
			*/
			const UTILIZED_STRATEGIES: UtilizedEMPStrategyUpdate = [
				[yieldSyncV1EMPStrategy.address, PERCENT.FIFTY],
				[yieldSyncV1EMPStrategy2.address, PERCENT.FIFTY],
			];

			// Set the utilzation to 2 different strategies
			await expect(
				yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UTILIZED_STRATEGIES)
			).to.be.not.rejected;

			// Set the utilzation to 2 different strategies
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
			const INVALID: UtilizedEMPStrategyERC20Amount = [
				[STRATEGY_DEPOSIT_AMOUNTS[0], STRATEGY_DEPOSIT_AMOUNTS[1]],
				[STRATEGY2_DEPOSIT_AMOUNTS[0], ethers.utils.parseUnits("1", 18)]
			];

			// Approve tokens
			await mockERC20A.approve(strategyInteractorDummy.address, STRATEGY_DEPOSIT_AMOUNTS[0]);
			await mockERC20B.approve(strategyInteractorDummy.address, STRATEGY_DEPOSIT_AMOUNTS[1]);
			await mockERC20C.approve(strategyInteractorDummy.address, STRATEGY2_DEPOSIT_AMOUNTS[0]);

			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyDeposit(INVALID)).to.be.rejectedWith(
				ERROR.INVALID_AMOUNT_LENGTH
			);
		});

		it("Should allow user to deposit tokens into the EMP and receive correct amount of ERC20..", async () => {
			/**
			* @notice This test should test that depositing correct amounts should work.
			*/
			const UTILIZED_STRATEGIES: UtilizedEMPStrategyUpdate = [
				[yieldSyncV1EMPStrategy.address, PERCENT.FIFTY],
				[yieldSyncV1EMPStrategy2.address, PERCENT.FIFTY],
			];

			// Set the utilzation to 2 different strategies
			await expect(
				yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UTILIZED_STRATEGIES)
			).to.be.not.rejected;

			// Set the utilzation to 2 different strategies
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

			// [main-test]
			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyDeposit(VALID)).to.not.be.reverted;

			// Validate balances
			expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(STRATEGY_DEPOSIT_AMOUNTS[0]);
			expect(await mockERC20B.balanceOf(strategyInteractorDummy.address)).to.be.equal(STRATEGY_DEPOSIT_AMOUNTS[1]);
			expect(await mockERC20C.balanceOf(strategyInteractorDummy.address)).to.be.equal(STRATEGY2_DEPOSIT_AMOUNTS[0]);
		});

		it("Should receive correct amount of ERC20 tokens upon depositing..", async () => {
			/**
			* @notice This test should test that depositing correct amounts should work and the msg.sender receives the
			* the tokens accordingly.
			*/
			const [OWNER] = await ethers.getSigners();

			const UTILIZED_STRATEGIES: UtilizedEMPStrategyUpdate = [
				[yieldSyncV1EMPStrategy.address, PERCENT.FIFTY],
				[yieldSyncV1EMPStrategy2.address, PERCENT.FIFTY],
			];

			// Set the utilzation to 2 different strategies
			await expect(
				yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UTILIZED_STRATEGIES)
			).to.be.not.rejected;

			// Set the utilzation to 2 different strategies
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

			// [main-test]
			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyDeposit(VALID)).to.not.be.reverted;

			// Validate balances
			expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(STRATEGY_DEPOSIT_AMOUNTS[0]);
			expect(await mockERC20B.balanceOf(strategyInteractorDummy.address)).to.be.equal(STRATEGY_DEPOSIT_AMOUNTS[1]);
			expect(await mockERC20C.balanceOf(strategyInteractorDummy.address)).to.be.equal(STRATEGY2_DEPOSIT_AMOUNTS[0]);

			// Check that the OWNER address received something
			expect(await yieldSyncV1EMP.balanceOf(OWNER.address)).to.be.greaterThan(0);

			const { totalValue: strategyDepositEthValue } = await strategyTransferUtil.calculateValueOfERC20Deposits(
				[STRATEGY_DEPOSIT_AMOUNTS[0], STRATEGY_DEPOSIT_AMOUNTS[1]],
				[mockERC20A, mockERC20B]
			);

			// Check that the EMP address received correct amount of Strategy tokens
			expect(await yieldSyncV1EMPStrategy.balanceOf(yieldSyncV1EMP.address)).to.be.equal(strategyDepositEthValue);

			// Check that the OWNER address received something greater than what was put into the 1st strategy
			expect(await yieldSyncV1EMP.balanceOf(OWNER.address)).to.be.greaterThan(strategyDepositEthValue);

			const { totalValue: strategy2DepositETHValue } = await strategyTransferUtil.calculateValueOfERC20Deposits(
				[STRATEGY2_DEPOSIT_AMOUNTS[0]],
				[mockERC20C]
			)

			// Check that the EMP address received correct amount of Strategy tokens
			expect(await yieldSyncV1EMPStrategy2.balanceOf(yieldSyncV1EMP.address)).to.be.equal(strategy2DepositETHValue);

			// Add up deposit amounts
			const TOTAL_DEPOSIT_VALUE = strategyDepositEthValue.add(strategy2DepositETHValue);

			// Check that the OWNER address received something equal to what was deposited into all strategies via EMP
			expect(await yieldSyncV1EMP.balanceOf(OWNER.address)).to.be.equal(TOTAL_DEPOSIT_VALUE);
		});

		it("Protocol should receive correct amount of ERC20 if cut is greater than 0..");
	});
});
