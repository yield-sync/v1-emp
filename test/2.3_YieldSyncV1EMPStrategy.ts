const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";

import { ERROR, PERCENT, D_18 } from "../const";
import StrategyTransferUtil from "../scripts/StrategyTransferUtil";


const LOCATION_IERC20: string = "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20";


describe("[2.3] YieldSyncV1EMPStrategy.sol - Scenarios", async () => {
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
	let strategyTransferUtil: StrategyTransferUtil;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		const [OWNER, MANAGER, TREASURY] = await ethers.getSigners();

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");
		const YieldSyncUtilityV1Array: ContractFactory = await ethers.getContractFactory("YieldSyncUtilityV1Array");
		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
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

		// Set the ETH Value Feed
		await expect(yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeed.address)).to.be.not.reverted;

		// Set the Strategy Interactor
		await expect(
			yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address)
		).to.be.not.reverted;

		await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();

		expect(await yieldSyncV1EMPStrategy.utilizedERC20DepositOpen()).to.be.true;

		await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();

		expect(await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.true;

		strategyTransferUtil = new StrategyTransferUtil(yieldSyncV1EMPStrategy, eTHValueFeed);
	});

	describe("Utilized ERC20 price change", async () => {
		beforeEach(async () => {
			await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();

			expect(await yieldSyncV1EMPStrategy.utilizedERC20DepositOpen()).to.be.false;

			await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();

			expect(await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.false;

			// Set strategy ERC20 tokens
			await expect(
				yieldSyncV1EMPStrategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]])
			).to.be.not.reverted;

			await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();

			expect(await yieldSyncV1EMPStrategy.utilizedERC20DepositOpen()).to.be.true;

			await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();

			expect(await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.true;
		});

		describe("function utilizedERC20Deposit()", async () => {
			it("Should receive strategy tokens based on what market value is (denominated in ETH)..", async () => {
				const [OWNER] = await ethers.getSigners();

				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				// Approve the SI to spend Mock A on behalf of OWNER
				await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT);

				// DEPOSIT - ERC20 tokens into the strategy
				await yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT])

				let BalanceStrategyOwner = await yieldSyncV1EMPStrategy.balanceOf(OWNER.address);

				// Get the ETH value of each tokens in ETH
				let ethValueMockA: BigNumber = await eTHValueFeed.utilizedERC20ETHValue(mockERC20A.address);

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
				await yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT_2])

				BalanceStrategyOwner = await yieldSyncV1EMPStrategy.balanceOf(OWNER.address);

				expect(BalanceStrategyOwner).to.be.equal(ethers.utils.parseUnits("3", 18));

				// Get the ETH value of each tokens in ETH
				ethValueMockA = await eTHValueFeed.utilizedERC20ETHValue(mockERC20A.address);

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
				const B4_TOTAL_SUPPLY_STRATEGY: BigNumber = await yieldSyncV1EMPStrategy.totalSupply();

				const B4_BALANCE_MOCK_A_SI: BigNumber = await mockERC20A.balanceOf(strategyInteractor.address);

				const B4_BALANCE_MOCK_A_OWNER: BigNumber = await mockERC20A.balanceOf(OWNER.address);

				const DEPOSIT_AMOUNT_A: BigNumber = ethers.utils.parseUnits("1", 18);

				// APPROVE - SI contract to spend tokens on behalf of OWNER
				await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT_A);

				// DEPOSIT - ERC20 tokens into the strategy
				await yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT_A])

				// [main-test] Withdraw ERC20 tokens into the strategy
				await yieldSyncV1EMPStrategy.utilizedERC20Withdraw(
					OWNER.address,
					await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)
				);

				// [PRICE-UPDATE] Update Ether value of MockERC20A
				await eTHValueFeed.updateETHValue(ethers.utils.parseUnits("2", 18));

				// Strategy token burned
				expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(B4_BALANCE_MOCK_A_SI);

				// Supply put back to original
				expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(B4_TOTAL_SUPPLY_STRATEGY);

				// Expect that the balance been returned to original or greater
				expect(await mockERC20A.balanceOf(OWNER.address)).to.be.equal(B4_BALANCE_MOCK_A_OWNER);
			});
		});
	});

	describe("Strategy that accepts ERC20 A and ERC20 B but returns ERC20 C", async () => {
		beforeEach(async () => {
			await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();

			expect(await yieldSyncV1EMPStrategy.utilizedERC20DepositOpen()).to.be.false;

			await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();

			expect(await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.false;

			// Set strategy ERC20 tokens
			await yieldSyncV1EMPStrategy.utilizedERC20Update(
				[mockERC20A.address, mockERC20B.address, mockERC20C.address],
				[[true, false, PERCENT.FIFTY], [true, false, PERCENT.FIFTY], [false, false, PERCENT.ZERO]],
			);

			await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();

			expect(await yieldSyncV1EMPStrategy.utilizedERC20DepositOpen()).to.be.true;

			await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();

			expect(await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.true;
		});

		it("Should fail to return C if withdraw is not set to true..", async () => {
			const [OWNER] = await ethers.getSigners();

			// Give ERC20C to Strategy Interactor to mock rewards accrual
			await mockERC20C.connect(OWNER).transfer(strategyInteractor.address, ethers.utils.parseUnits("1", 18));

			const UTILIZED_ERC20: string[] = await yieldSyncV1EMPStrategy.utilizedERC20();

			const DEPOSIT_AMOUNTS: BigNumber[] = await strategyTransferUtil.calculateERC20RequiredByTotalAmount(
				ethers.utils.parseUnits("1", 18)
			);

			expect(DEPOSIT_AMOUNTS.length).to.be.equal(UTILIZED_ERC20.length);

			// Capture balances
			const B4_TOTAL_SUPPLY_STRATEGY: BigNumber = await yieldSyncV1EMPStrategy.totalSupply();

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
				yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, DEPOSIT_AMOUNTS)
			).to.be.not.reverted;

			for (let i = 0; i < UTILIZED_ERC20.length; i++)
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
			await yieldSyncV1EMPStrategy.utilizedERC20Withdraw(
				OWNER.address,
				await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)
			);

			// Supply put back to original
			expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(B4_TOTAL_SUPPLY_STRATEGY);

			expect(await mockERC20C.balanceOf(OWNER.address)).to.equal(B4_BALANCE_MOCK_C_OWNER);
		});
	});
});
