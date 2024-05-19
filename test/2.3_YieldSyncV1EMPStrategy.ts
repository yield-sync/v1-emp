const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";

import { PERCENT } from "../const";
import StrategyTransferUtil from "../scripts/StrategyTransferUtil";


const ZERO = ethers.utils.parseUnits('0', 18);


describe("[2.3] YieldSyncV1EMPStrategy.sol - Scenarios", async () => {
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;
	let yieldSyncUtilityV1Array: Contract;
	let yieldSyncGovernance: Contract;
	let eTHValueFeedDummy: Contract;
	let strategyInteractorDummy: Contract;
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
		eTHValueFeedDummy = await (await ETHValueFeedDummy.deploy()).deployed();
		strategyInteractorDummy = await (await StrategyInteractorDummy.deploy()).deployed();
		yieldSyncUtilityV1Array = await (await YieldSyncUtilityV1Array.deploy()).deployed();
		yieldSyncGovernance = await (await YieldSyncGovernance.deploy()).deployed();
		yieldSyncV1EMPRegistry = await (await YieldSyncV1EMPRegistry.deploy(yieldSyncGovernance.address, yieldSyncUtilityV1Array.address)).deployed();
		yieldSyncV1EMPStrategyDeployer = await (
			await YieldSyncV1EMPStrategyDeployer.deploy(yieldSyncV1EMPRegistry.address)
		).deployed();

		// Set Treasury
		await expect(yieldSyncGovernance.payToUpdate(TREASURY.address)).to.not.be.reverted;

		// Mock owner being an EMP Deployer
		await expect(
			yieldSyncV1EMPRegistry.yieldSyncV1EMPDeployerUpdate(OWNER.address)
		).to.not.be.reverted;

		// Mock owner being an EMP for authorization
		await expect(
			yieldSyncV1EMPRegistry.yieldSyncV1EMPRegister(OWNER.address)
		).to.not.be.reverted;

		// Set EMP Strategy Deployer on registry
		await expect(
			yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyDeployerUpdate(yieldSyncV1EMPStrategyDeployer.address)
		).to.not.be.reverted;

		await expect(
			yieldSyncV1EMPStrategyDeployer.deployYieldSyncV1EMPStrategy("Strategy", "S")
		).to.be.not.reverted;

		expect(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(1)).to.be.not.equal(
			ethers.constants.AddressZero
		);

		// Attach the deployed YieldSyncV1EMPStrategy address
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

		await expect(yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()).to.not.be.reverted;
		await expect(yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle()).to.not.be.reverted;

		strategyTransferUtil = new StrategyTransferUtil(yieldSyncV1EMPStrategy, eTHValueFeedDummy);
	});


	describe("function utilizedERC20Deposit() - Utilized ERC20 price change", async () => {
		describe("[SINGLE ERC20]", async () => {
			it("[100] Should receive strategy tokens based on what market value is (denominated in ETH)..", async () => {
				const [OWNER] = await ethers.getSigners();

				// Set strategy ERC20 tokens
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]])
				).to.not.be.reverted;

				const DEPOSIT_AMOUNT_A: BigNumber = ethers.utils.parseUnits("1", 18);

				// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
				await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);

				// Deposit ERC20 tokens into the strategy
				await yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT_A])

				// Supply put back to original
				expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(DEPOSIT_AMOUNT_A);

				// [PRICE-UPDATE] Update Ether value of MockERC20A
				await eTHValueFeedDummy.updateETHValue(ethers.utils.parseUnits("2", 18));

				const DEPOSIT_AMOUNT_A2: BigNumber = ethers.utils.parseUnits("1", 18);

				// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
				await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A2);

				// Deposit ERC20 tokens into the strategy
				await yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT_A2])

				expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
					ethers.utils.parseUnits("3", 18)
				);
			});
		});
	});

	describe("function utilizedERC20Withdraw() - Utilized ERC20 price change", async () => {
		describe("[SINGLE ERC20]", async () => {
			it(
				"[100] Should return same amount of ERC20 even if value of ERC20 changes..",
				async () => {
					const [OWNER] = await ethers.getSigners();

					// Set strategy ERC20 tokens
					await expect(
						yieldSyncV1EMPStrategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]])
					).to.not.be.reverted;

					// Capture
					const STRAT_TOTAL_SUPPLY_B4: BigNumber = await yieldSyncV1EMPStrategy.totalSupply();

					const STRAT_MOCK_A_BALANCE_B4: BigNumber = await mockERC20A.balanceOf(strategyInteractorDummy.address);

					const OWNER_MOCK_A_BALANCE_B4: BigNumber = await mockERC20A.balanceOf(OWNER.address);

					const DEPOSIT_AMOUNT_A: BigNumber = ethers.utils.parseUnits("1", 18);

					// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
					await mockERC20A.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNT_A);

					// Deposit ERC20 tokens into the strategy
					await yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [DEPOSIT_AMOUNT_A])

					// [main-test] Withdraw ERC20 tokens into the strategy
					await yieldSyncV1EMPStrategy.utilizedERC20Withdraw(
						OWNER.address,
						await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)
					);

					// [PRICE-UPDATE] Update Ether value of MockERC20A
					await eTHValueFeedDummy.updateETHValue(ethers.utils.parseUnits("2", 18));

					// Strategy token burned
					expect(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)).to.be.equal(
						STRAT_MOCK_A_BALANCE_B4
					);

					// Supply put back to original
					expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(STRAT_TOTAL_SUPPLY_B4);

					// Check that the balance been returned to original or greater
					expect(await mockERC20A.balanceOf(OWNER.address)).to.be.equal(OWNER_MOCK_A_BALANCE_B4);
				}
			)
		});
	});

	describe("Strategy that accepts ERC20 A and ERC20 B but returns ERC20 C", async () => {
		it("Should fail to return C if withdraw is not set to true..", async () => {
			const [OWNER] = await ethers.getSigners();

			// Give ERC20C to Strategy Interactor to mock rewards accrual
			await mockERC20C.connect(OWNER).transfer(strategyInteractorDummy.address, ethers.utils.parseUnits("1", 18));

			// Set strategy ERC20 tokens
			await expect(
				yieldSyncV1EMPStrategy.utilizedERC20Update(
					[mockERC20A.address, mockERC20B.address, mockERC20C.address],
					[[true, false, PERCENT.FIFTY], [true, false, PERCENT.FIFTY], [false, false, PERCENT.ZERO]],
				)
			).to.not.be.reverted;

			const UTILIZED_ERC20: string[] = await yieldSyncV1EMPStrategy.utilizedERC20s();

			const DEPOSIT_AMOUNTS: BigNumber[] = await strategyTransferUtil.calculateERC20RequiredByTotalAmount(
				ethers.utils.parseUnits("1", 18)
			);

			expect(DEPOSIT_AMOUNTS.length).to.be.equal(UTILIZED_ERC20.length);

			// Capture balances
			const STRAT_TOTAL_SUPPLY_B4: BigNumber = await yieldSyncV1EMPStrategy.totalSupply();

			let balancesB4Owner: BigNumber[] = [];
			let balancesB4StrategyInteractor: BigNumber[] = [];
			let OWNERCBalanceB4: BigNumber = await mockERC20C.balanceOf(OWNER.address);

			for (let i: number = 0; i < UTILIZED_ERC20.length; i++)
			{
				const IERC20 = await ethers.getContractAt(
					"@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
					UTILIZED_ERC20[i]
				);

				// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
				await IERC20.approve(strategyInteractorDummy.address, DEPOSIT_AMOUNTS[i]);

				// Collect previous balances to check later with
				balancesB4Owner.push(await IERC20.balanceOf(OWNER.address));
				balancesB4StrategyInteractor.push(await IERC20.balanceOf(strategyInteractorDummy.address));
			}

			// DEPOSIT - ERC20 A and ERC20 B tokens into the strategy
			await expect(
				yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, DEPOSIT_AMOUNTS)
			).to.be.not.reverted;

			for (let i = 0; i < UTILIZED_ERC20.length; i++)
			{
				const IERC20 = await ethers.getContractAt(
					"@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
					UTILIZED_ERC20[i]
				);

				// Check balance of owner
				expect(await IERC20.balanceOf(OWNER.address)).to.equal(balancesB4Owner[i].sub(DEPOSIT_AMOUNTS[i]));

				// Check balance of strategy interactor
				expect(await IERC20.balanceOf(strategyInteractorDummy.address)).to.equal(
					balancesB4StrategyInteractor[i].add(DEPOSIT_AMOUNTS[i])
				);
			}

			// [main-test] Withdraw ERC20 tokens into the strategy
			await yieldSyncV1EMPStrategy.utilizedERC20Withdraw(
				OWNER.address,
				await yieldSyncV1EMPStrategy.balanceOf(OWNER.address)
			);

			// Supply put back to original
			expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(STRAT_TOTAL_SUPPLY_B4);

			expect(await mockERC20C.balanceOf(OWNER.address)).to.equal(OWNERCBalanceB4);
		});
	});
});
