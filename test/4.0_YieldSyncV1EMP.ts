const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";

import { ERROR, PERCENT } from "../const";
import StrategyTransferUtil from "../scripts/StrategyTransferUtil";


describe("[4.0] YieldSyncV1EMP.sol - Setup", async () =>
{
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


	beforeEach("[beforeEach] Set up contracts..", async () =>
	{
		/**
		* This beforeEach process does the following:
		* 1) Deploy a registry
		* 2) Deploys an EMP Deployer and registers it on the registry
		* 3) Attach the deployed EMP to a local variable (for accessing fn.)
		* 4) Deploy 2 strategies and make them fully operational by doing the following:
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

		await expect(
			yieldSyncV1EMPStrategy.utilizedERC20Update(
				[
					[mockERC20A.address, true, true, PERCENT.FIFTY],
					[mockERC20B.address, true, true, PERCENT.FIFTY],
				]
			)
		).to.be.not.reverted;

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

		await expect(
			yieldSyncV1EMPStrategy2.utilizedERC20Update([[mockERC20C.address, true, true, PERCENT.HUNDRED],])
		).to.be.not.reverted;

		// Enable Deposits and Withdraws
		await expect(yieldSyncV1EMPStrategy2.utilizedERC20DepositOpenToggle()).to.not.be.reverted;
		await expect(yieldSyncV1EMPStrategy2.utilizedERC20WithdrawOpenToggle()).to.not.be.reverted;

		// Set strategyTransferUtil
		strategyTransferUtil2 = new StrategyTransferUtil(yieldSyncV1EMPStrategy2, eTHValueFeedDummy)
	});

	describe("function utilizedYieldSyncV1EMPStrategyUpdate()", async () =>
	{
		it("[auth] Should revert when unauthorized msg.sender calls..", async () =>
		{
			const [, ADDR_1] = await ethers.getSigners();

			const UtilizedYieldSyncV1EMPStrategy: UtilizedYieldSyncV1EMPStrategyUpdate = [];

			await expect(
				yieldSyncV1EMP.connect(ADDR_1).utilizedYieldSyncV1EMPStrategyUpdate(UtilizedYieldSyncV1EMPStrategy)
			).to.be.rejectedWith(ERROR.NOT_MANAGER);
		});

		it("Should NOT allow strategies that add up to more than 100% to EMP..", async () =>
		{
			const UtilizedYieldSyncV1EMPStrategy: UtilizedYieldSyncV1EMPStrategyUpdate = [
				[yieldSyncV1EMPStrategy.address, PERCENT.HUNDRED],
				[yieldSyncV1EMPStrategy2.address, PERCENT.FIFTY],
			];

			await expect(
				yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedYieldSyncV1EMPStrategy)
			).to.be.rejectedWith(ERROR.INVALID_ALLOCATION_STRATEGY);
		});

		it("Should allow attaching Strategy to EMP..", async () =>
		{
			const UtilizedYieldSyncV1EMPStrategy: [string, string][] = [
				[yieldSyncV1EMPStrategy.address, PERCENT.HUNDRED]
			];

			await expect(
				yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedYieldSyncV1EMPStrategy)
			).to.be.not.rejected;

			const strategies: UtilizedYieldSyncV1EMPStrategy[] = await yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategy();

			expect(strategies.length).to.be.equal(UtilizedYieldSyncV1EMPStrategy.length);

			expect(strategies[0].yieldSyncV1EMPStrategy).to.be.equal(yieldSyncV1EMPStrategy.address);
			expect(strategies[0].allocation).to.be.equal(PERCENT.HUNDRED);
		});

		it("Should allow attaching multiple Strategies to EMP..", async () =>
		{
			const UtilizedYieldSyncV1EMPStrategy: [string, string][] = [
				[yieldSyncV1EMPStrategy.address, PERCENT.FIFTY],
				[yieldSyncV1EMPStrategy2.address, PERCENT.FIFTY],
			];

			await expect(
				yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedYieldSyncV1EMPStrategy)
			).to.be.not.rejected;

			const strategies: UtilizedYieldSyncV1EMPStrategy[] = await yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategy();

			expect(strategies.length).to.be.equal(UtilizedYieldSyncV1EMPStrategy.length);

			for (let i = 0; i < strategies.length; i++)
			{
				expect(strategies[i].yieldSyncV1EMPStrategy).to.be.equal(UtilizedYieldSyncV1EMPStrategy[i][0]);
				expect(strategies[i].allocation).to.be.equal(UtilizedYieldSyncV1EMPStrategy[i][1]);
			}
		});
	});

	describe("function managerUpdate()", async () => {
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () =>
			{
				const [, ADDR_1] = await ethers.getSigners();
				await expect(
					yieldSyncV1EMP.connect(ADDR_1).managerUpdate(ADDR_1.address)
				).to.be.rejectedWith(ERROR.NOT_MANAGER);
			}
		);

		it(
			"Should allow manager to be changed..",
			async () =>
			{
				const [, ADDR_1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMP.managerUpdate(ADDR_1.address)
				).to.be.not.reverted;

				expect(await yieldSyncV1EMP.manager()).to.be.equal(ADDR_1.address);
			}
		);
	});

	describe("function utilizedYieldSyncV1EMPStrategyDeposit()", async () =>
	{
		it("Should NOT allow depositing if not open..", async () => {
			/**
			* @notice This test is to check that depositing must be toggled on in order to call the function properly.
			*/
			const UtilizedYieldSyncV1EMPStrategy: UtilizedYieldSyncV1EMPStrategyUpdate = [
				[yieldSyncV1EMPStrategy.address, PERCENT.FIFTY],
				[yieldSyncV1EMPStrategy2.address, PERCENT.FIFTY],
			];

			// Set the utilzation to 2 different strategies
			await expect(
				yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedYieldSyncV1EMPStrategy)
			).to.be.not.rejected;

			// Even if utilizedERC20Amounts, the function should revert with reason that deposits are NOT open
			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyDeposit([[], []])).to.be.rejectedWith(
				ERROR.UTILIZED_YIELD_SYNC_V1_EMP_STRATEGY_DEPOSIT_NOT_OPEN
			);
		});

		it("Should NOT allow invalid lengthed _utilizedERC20Amount (1D)..", async () =>
		{
			/**
			* @notice This test is to check that if the total amount of strategies is correctly set, then passing in a param
			* with incorrect first dimension of the 2d param will be rejected.
			*/
			const UtilizedYieldSyncV1EMPStrategy: UtilizedYieldSyncV1EMPStrategyUpdate = [
				[yieldSyncV1EMPStrategy.address, PERCENT.FIFTY],
				[yieldSyncV1EMPStrategy2.address, PERCENT.FIFTY],
			];

			// Set the utilzation to 2 different strategies
			await expect(
				yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedYieldSyncV1EMPStrategy)
			).to.be.not.rejected;

			// Set the utilzation to 2 different strategies
			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyDepositOpenToggle()).to.be.not.rejected;

			// Pass in value for 0 strategies
			const INVALID: UtilizedERC20Amount = [];

			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyDeposit(INVALID)).to.be.rejectedWith(
				ERROR.INVALID_UTILIZED_ERC20_AMOUNT_EMP
			);
		});

		it("Should NOT allow invalid AMOUNTS to be passed (2D)..", async () => {
			/**
			* @notice This test should test that depositing the incorrect amounts (within the 2nd dimension of
			* _utilizedERC20Amount) the function should revert.
			*/
			const UTILIZED_STRATEGIES: UtilizedYieldSyncV1EMPStrategyUpdate = [
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

			const STRAT_DEPOSIT_AMOUNTS: BigNumber[] = await strategyTransferUtil.calculateERC20RequiredByTotalAmount(
				ethers.utils.parseUnits("2", 18)
			);

			const STRAT_2_DEPOSIT_AMOUNTS: BigNumber[] = await strategyTransferUtil2.calculateERC20RequiredByTotalAmount(
				ethers.utils.parseUnits("2", 18)
			);

			// Pass in value for 2 strategies
			const INVALID: UtilizedERC20Amount = [
				[STRAT_DEPOSIT_AMOUNTS[0], STRAT_DEPOSIT_AMOUNTS[1]],
				[STRAT_2_DEPOSIT_AMOUNTS[0], ethers.utils.parseUnits("1", 18)]
			];

			// Approve tokens
			await mockERC20A.approve(strategyInteractorDummy.address, STRAT_DEPOSIT_AMOUNTS[0]);
			await mockERC20B.approve(strategyInteractorDummy.address, STRAT_DEPOSIT_AMOUNTS[1]);
			await mockERC20C.approve(strategyInteractorDummy.address, STRAT_2_DEPOSIT_AMOUNTS[0]);

			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyDeposit(INVALID)).to.be.rejectedWith(
				ERROR.INVALID_AMOUNT_LENGTH
			);
		});

		it("Should allow user to deposit tokens into the EMP..", async () => {
			/**
			* @notice This test should test that depositing correct amounts should work.
			*/
			const UTILIZED_STRATEGIES: UtilizedYieldSyncV1EMPStrategyUpdate = [
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

			const STRAT_DEPOSIT_AMOUNTS: BigNumber[] = await strategyTransferUtil.calculateERC20RequiredByTotalAmount(
				ethers.utils.parseUnits("2", 18)
			);

			const STRAT_2_DEPOSIT_AMOUNTS: BigNumber[] = await strategyTransferUtil2.calculateERC20RequiredByTotalAmount(
				ethers.utils.parseUnits("2", 18)
			);

			// Pass in value for 2 strategies
			const VALID: UtilizedERC20Amount = [
				[STRAT_DEPOSIT_AMOUNTS[0], STRAT_DEPOSIT_AMOUNTS[1]],
				[STRAT_2_DEPOSIT_AMOUNTS[0]]
			];

			// Approve tokens
			await mockERC20A.approve(strategyInteractorDummy.address, STRAT_DEPOSIT_AMOUNTS[0]);
			await mockERC20B.approve(strategyInteractorDummy.address, STRAT_DEPOSIT_AMOUNTS[1]);
			await mockERC20C.approve(strategyInteractorDummy.address, STRAT_2_DEPOSIT_AMOUNTS[0]);

			// [main-test]
			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyDeposit(VALID)).to.not.be.reverted;

			// Validate balances
			expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.be.equal(STRAT_DEPOSIT_AMOUNTS[0]);
			expect(await mockERC20B.balanceOf(strategyInteractorDummy.address)).to.be.equal(STRAT_DEPOSIT_AMOUNTS[1]);
			expect(await mockERC20C.balanceOf(strategyInteractorDummy.address)).to.be.equal(STRAT_2_DEPOSIT_AMOUNTS[0]);
		});

		it("Should receive correct amount of ERC20 tokens upon depositing..");

		it("Protocol should receive correct amount of ERC20 if cut is greater than 0..");
	});

	describe("function utilizedYieldSyncV1EMPStrategyWithdraw()", async () =>
	{
		it("Should NOT allow withdrawing if not open..", async () => {
			/**
			* @notice This test is to check that depositing must be toggled on in order to call the function properly.
			*/
			const UtilizedYieldSyncV1EMPStrategy: UtilizedERC20Amount = [
				[yieldSyncV1EMPStrategy.address, PERCENT.FIFTY],
				[yieldSyncV1EMPStrategy2.address, PERCENT.FIFTY],
			];

			// Set the utilzation to 2 different strategies
			await expect(
				yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyUpdate(UtilizedYieldSyncV1EMPStrategy)
			).to.be.not.rejected;

			// Even if utilizedERC20Amounts, the function should revert with reason that deposits are NOT open
			await expect(yieldSyncV1EMP.utilizedYieldSyncV1EMPStrategyWithdraw(0)).to.be.rejectedWith(
				ERROR.UTILIZED_YIELD_SYNC_V1_EMP_STRATEGY_WITHDRAW_NOT_OPEN
			);
		});
	});
});