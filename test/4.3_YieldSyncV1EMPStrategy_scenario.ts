const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";

import { ERROR, PERCENT, D_18 } from "../const";
import StrategyTransferUtil from "../scripts/StrategyTransferUtil";


const LOCATION_IERC20: string = "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20";


describe("[4.3] YieldSyncV1EMPStrategy.sol - Scenarios", async () => {
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

	let strategyTransferUtil: StrategyTransferUtil;


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
		*
		* @dev It is important to utilize the strategyTransferUtil for multiple ERC20 based strategies because they get
		* reordred when setup. The strategyUtil will return the deposit amounts in the order of the what the conctract
		* returns for the Utilized ERC20s
		*/
		const [OWNER, MANAGER, TREASURY] = await ethers.getSigners();


		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const YieldSyncV1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPArrayUtility");
		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");
		const YieldSyncV1EMPStrategyUtility: ContractFactory= await ethers.getContractFactory("YieldSyncV1EMPStrategyUtility");
		const YieldSyncV1EMPStrategy: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategy");
		const YieldSyncV1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategyDeployer");

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
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
		mockERC20A = await (await MockERC20.deploy("Mock A", "A")).deployed();
		mockERC20B = await (await MockERC20.deploy("Mock B", "B")).deployed();
		mockERC20C = await (await MockERC20.deploy("Mock C", "C")).deployed();

		eTHValueFeed = await (await ETHValueFeedDummy.deploy()).deployed();

		await registry.eRC20_yieldSyncV1EMPERC20ETHValueFeedUpdate(mockERC20A.address, eTHValueFeed.address);
		await registry.eRC20_yieldSyncV1EMPERC20ETHValueFeedUpdate(mockERC20B.address, eTHValueFeed.address);
		await registry.eRC20_yieldSyncV1EMPERC20ETHValueFeedUpdate(mockERC20C.address, eTHValueFeed.address);

		strategyInteractor = await (await StrategyInteractorDummy.deploy()).deployed();


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

		// Set the Strategy Interactor
		await strategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

		await strategy.utilizedERC20DepositOpenToggle();

		expect(await strategy.utilizedERC20DepositOpen()).to.be.true;

		await strategy.utilizedERC20WithdrawOpenToggle();

		expect(await strategy.utilizedERC20WithdrawOpen()).to.be.true;

		strategyTransferUtil = new StrategyTransferUtil(strategy, registry);
	});

	describe("Utilized ERC20 price change", async () => {
		beforeEach(async () => {
			await strategy.utilizedERC20DepositOpenToggle();

			expect(await strategy.utilizedERC20DepositOpen()).to.be.false;

			await strategy.utilizedERC20WithdrawOpenToggle();

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.false;

			// Set strategy ERC20 tokens
			await expect(
				strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]])
			).to.be.not.reverted;

			await strategy.utilizedERC20DepositOpenToggle();

			expect(await strategy.utilizedERC20DepositOpen()).to.be.true;

			await strategy.utilizedERC20WithdrawOpenToggle();

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.true;
		});


		describe("function utilizedERC20Deposit()", async () => {
			it("Should receive strategy tokens based on what market value is (denominated in ETH)..", async () => {
				const [OWNER] = await ethers.getSigners();

				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				// Approve the SI to spend Mock A on behalf of OWNER
				await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT);

				// DEPOSIT - ERC20 tokens into the strategy
				await strategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT])

				let BalanceStrategyOwner = await strategy.balanceOf(OWNER.address);

				const feed = await ethers.getContractAt(
					"ETHValueFeedDummy",
					await registry.eRC20_yieldSyncV1EMPERC20ETHValueFeed(mockERC20A.address)
				);

				// Get the ETH value of each tokens in ETH
				let ethValueMockA: BigNumber = await feed.utilizedERC20ETHValue();

				// [calculate] Deposit ETH Value
				let totalEthValue: BigNumber = DEPOSIT_AMOUNT.mul(ethValueMockA).div(D_18);

				// Expect that that amount of S tokens received
				expect(BalanceStrategyOwner).to.be.equal(totalEthValue);

				// [PRICE-UPDATE] Update Ether value of MockERC20A
				await eTHValueFeed.updateETHValue(ethers.utils.parseUnits("2", 18));

				const DEPOSIT_AMOUNT_2: BigNumber = ethers.utils.parseUnits("1", 18);

				// APPROVE - SI contract to spend tokens on behalf of OWNER
				await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT_2);

				// DEPOSIT - ERC20 tokens into the strategy
				await strategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT_2])

				BalanceStrategyOwner = await strategy.balanceOf(OWNER.address);

				expect(BalanceStrategyOwner).to.be.equal(ethers.utils.parseUnits("3", 18));

				// Get the ETH value of each tokens in ETH
				ethValueMockA = await feed.utilizedERC20ETHValue();

				let totalDeposited: BigNumber =  DEPOSIT_AMOUNT.add(DEPOSIT_AMOUNT_2);

				// [calculate] Deposit ETH Value
				totalEthValue = totalDeposited.mul(ethValueMockA).div(D_18);

				expect(totalEthValue).to.be.equal(ethers.utils.parseUnits("4", 18));
			});
		});

		describe("function utilizedERC20Withdraw()", async () => {
			it("Should return same amount of ERC20 even if value of ERC20 changes..", async () => {
				const [OWNER] = await ethers.getSigners();

				// Capture
				const B4_TOTAL_SUPPLY_STRATEGY: BigNumber = await strategy.totalSupply();

				const B4_BALANCE_MOCK_A_SI: BigNumber = await mockERC20A.balanceOf(strategyInteractor.address);

				const B4_BALANCE_MOCK_A_OWNER: BigNumber = await mockERC20A.balanceOf(OWNER.address);

				const DEPOSIT_AMOUNT_A: BigNumber = ethers.utils.parseUnits("1", 18);

				// APPROVE - SI contract to spend tokens on behalf of OWNER
				await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT_A);

				// DEPOSIT - ERC20 tokens into the strategy
				await strategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT_A])

				// [main-test] Withdraw ERC20 tokens into the strategy
				await strategy.utilizedERC20Withdraw(await strategy.balanceOf(OWNER.address));

				// [PRICE-UPDATE] Update Ether value of MockERC20A
				await eTHValueFeed.updateETHValue(ethers.utils.parseUnits("2", 18));

				// Strategy token burned
				expect(await strategy.balanceOf(OWNER.address)).to.be.equal(B4_BALANCE_MOCK_A_SI);

				// Supply put back to original
				expect(await strategy.totalSupply()).to.be.equal(B4_TOTAL_SUPPLY_STRATEGY);

				// Expect that the balance been returned to original or greater
				expect(await mockERC20A.balanceOf(OWNER.address)).to.be.equal(B4_BALANCE_MOCK_A_OWNER);
			});
		});
	});

	describe("Strategy that accepts ERC20 A and ERC20 B but returns ERC20 C", async () => {
		beforeEach(async () => {
			await strategy.utilizedERC20DepositOpenToggle();

			expect(await strategy.utilizedERC20DepositOpen()).to.be.false;

			await strategy.utilizedERC20WithdrawOpenToggle();

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.false;

			// Set strategy ERC20 tokens
			await strategy.utilizedERC20Update(
				[mockERC20A.address, mockERC20B.address, mockERC20C.address],
				[[true, false, PERCENT.FIFTY], [true, false, PERCENT.FIFTY], [false, false, PERCENT.ZERO]],
			);

			await strategy.utilizedERC20DepositOpenToggle();

			expect(await strategy.utilizedERC20DepositOpen()).to.be.true;

			await strategy.utilizedERC20WithdrawOpenToggle();

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.true;
		});

		it("Should fail to return C if withdraw is not set to true..", async () => {
			const [OWNER] = await ethers.getSigners();

			// Give ERC20C to Strategy Interactor to mock rewards accrual
			await mockERC20C.connect(OWNER).transfer(strategyInteractor.address, ethers.utils.parseUnits("1", 18));

			const UTILIZED_ERC20: string[] = await strategy.utilizedERC20();

			const DEPOSIT_AMOUNTS: BigNumber[] = await strategyTransferUtil.calculateERC20Required(
				ethers.utils.parseUnits("1", 18)
			);

			expect(DEPOSIT_AMOUNTS.length).to.be.equal(UTILIZED_ERC20.length);

			// Capture balances
			const B4_TOTAL_SUPPLY_STRATEGY: BigNumber = await strategy.totalSupply();

			const B4_BALANCE_MOCK_C_OWNER: BigNumber = await mockERC20C.balanceOf(OWNER.address);

			let b4BalancesOwner: BigNumber[] = [];
			let b4BalancesStrategyInteractor: BigNumber[] = [];

			for (let i: number = 0; i < UTILIZED_ERC20.length; i++)
			{
				const IERC20 = await ethers.getContractAt(
					"@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
					UTILIZED_ERC20[i]
				);

				// APPROVE - SI contract to spend tokens on behalf of OWNER
				await IERC20.approve(strategyInteractor.address, DEPOSIT_AMOUNTS[i]);

				// Collect previous balances to check later with
				b4BalancesOwner.push(await IERC20.balanceOf(OWNER.address));
				b4BalancesStrategyInteractor.push(await IERC20.balanceOf(strategyInteractor.address));
			}

			// DEPOSIT - ERC20 A and ERC20 B tokens into the strategy
			await expect(
				strategy.utilizedERC20Deposit(OWNER.address, DEPOSIT_AMOUNTS)
			).to.be.not.reverted;

			for (let i: number = 0; i < UTILIZED_ERC20.length; i++)
			{
				const IERC20 = await ethers.getContractAt(LOCATION_IERC20, UTILIZED_ERC20[i]);

				// Expect balance of owner
				expect(await IERC20.balanceOf(OWNER.address)).to.equal(b4BalancesOwner[i].sub(DEPOSIT_AMOUNTS[i]));

				// Expect balance of strategy interactor
				expect(await IERC20.balanceOf(strategyInteractor.address)).to.equal(
					b4BalancesStrategyInteractor[i].add(DEPOSIT_AMOUNTS[i])
				);
			}

			// [main-test] Withdraw ERC20 tokens into the strategy
			await strategy.utilizedERC20Withdraw(await strategy.balanceOf(OWNER.address));

			// Supply put back to original
			expect(await strategy.totalSupply()).to.be.equal(B4_TOTAL_SUPPLY_STRATEGY);

			expect(await mockERC20C.balanceOf(OWNER.address)).to.equal(B4_BALANCE_MOCK_C_OWNER);
		});
	});
});
