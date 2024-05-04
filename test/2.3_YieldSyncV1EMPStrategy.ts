const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";

import { PERCENT } from "../const";


const ZERO = ethers.utils.parseUnits('0', 18);


describe("[2.3] YieldSyncV1EMPStrategy.sol - Scenarios", async () =>
{
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;
	let eTHValueFeedDummy: Contract;
	let strategyInteractorDummy: Contract;
	let yieldSyncV1EMPRegistry: Contract;
	let yieldSyncV1EMPStrategy: Contract;
	let yieldSyncV1EMPStrategyDeployer: Contract;


	beforeEach("[beforeEach] Set up contracts..", async () =>
	{
		const [OWNER] = await ethers.getSigners();

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");
		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");
		const YieldSyncV1EMPStrategy: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategy");
		const YieldSyncV1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategyDeployer");

		mockERC20A = await (await MockERC20.deploy()).deployed();
		mockERC20B = await (await MockERC20.deploy()).deployed();
		mockERC20C = await (await MockERC20.deploy()).deployed();
		eTHValueFeedDummy = await (await ETHValueFeedDummy.deploy()).deployed();
		strategyInteractorDummy = await (await StrategyInteractorDummy.deploy()).deployed();
		yieldSyncV1EMPRegistry = await (await YieldSyncV1EMPRegistry.deploy()).deployed();
		yieldSyncV1EMPStrategyDeployer = await (
			await YieldSyncV1EMPStrategyDeployer.deploy(OWNER.address, yieldSyncV1EMPRegistry.address)
		).deployed();

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
	});


	describe("function utilizedERC20Deposit() - Utilized ERC20 price change", async () =>
	{
		describe("[SINGLE ERC20]", async () =>
		{
			describe("[DECIMALS = 18]", async () =>
			{
				it(
					"[100] Should receive strategy tokens based on what market value is (denominated in ETH)..",
					async () =>
					{
						const [OWNER] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Update(
								[[mockERC20A.address, true, true, PERCENT.HUNDRED],],
							)
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
					}
				)
			});
		});
	});

	describe("function utilizedERC20Withdraw() - Utilized ERC20 price change", async () =>
	{
		describe("[SINGLE ERC20]", async () =>
		{
			describe("[DECIMALS = 18]", async () =>
			{
				it(
					"[100] Should return same amount of ERC20 even if value of ERC20 changes..",
					async () =>
					{
						const [OWNER] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.utilizedERC20Update(
								[[mockERC20A.address, true, true, PERCENT.HUNDRED],],
							)
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
	});

	describe("Strategy that accepts ERC20 A and ERC20 B but returns ERC20 C", async () => {
		it(
			"Should fail to return C if withdraw is not set to true..",
			async () => {
				const [OWNER] = await ethers.getSigners();

				// Initialize strategy with mock ERC20
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Update(
						[
							[mockERC20A.address, true, false, PERCENT.FIFTY],
							[mockERC20B.address, true, false, PERCENT.FIFTY],
							[mockERC20C.address, false, true, PERCENT.ZERO],
						],
					)
				).to.not.be.reverted;

				// Capture
				const STRAT_TOTAL_SUPPLY_B4: BigNumber = await yieldSyncV1EMPStrategy.totalSupply();

				const OWNERABalanceB4: BigNumber = await mockERC20A.balanceOf(OWNER.address);
				const OWNERBBalanceB4: BigNumber = await mockERC20B.balanceOf(OWNER.address);
				const OWNERCBalanceB4: BigNumber = await mockERC20C.balanceOf(OWNER.address);
				const sIABalanceB4: BigNumber = await mockERC20A.balanceOf(strategyInteractorDummy.address);
				const sIBBalanceB4: BigNumber = await mockERC20A.balanceOf(strategyInteractorDummy.address);
				const sICBalanceB4: BigNumber = await mockERC20A.balanceOf(strategyInteractorDummy.address);

				const erc20DepositAmount = ethers.utils.parseUnits("1", 18);

				// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
				await mockERC20A.approve(strategyInteractorDummy.address, erc20DepositAmount);

				// Approve the StrategyInteractorDummy contract to spend tokens on behalf of OWNER
				await mockERC20B.approve(strategyInteractorDummy.address, erc20DepositAmount);

				// Deposit ERC20 A and ERC20 B tokens into the strategy
				await yieldSyncV1EMPStrategy.utilizedERC20Deposit(OWNER.address, [erc20DepositAmount, erc20DepositAmount, ZERO]);

				// Mock ERC20 C to strategy interactor accrual by transferring
				await mockERC20C.transfer(strategyInteractorDummy.address, erc20DepositAmount);

				expect(await mockERC20A.balanceOf(OWNER.address)).to.equal(OWNERABalanceB4.sub(erc20DepositAmount));

				expect(await mockERC20B.balanceOf(OWNER.address)).to.equal(OWNERBBalanceB4.sub(erc20DepositAmount));

				expect(await mockERC20B.balanceOf(OWNER.address)).to.equal(OWNERCBalanceB4.sub(erc20DepositAmount));

				expect(await mockERC20A.balanceOf(strategyInteractorDummy.address)).to.equal(
					sIABalanceB4.add(erc20DepositAmount)
				);
				expect(await mockERC20B.balanceOf(strategyInteractorDummy.address)).to.equal(
					sIBBalanceB4.add(erc20DepositAmount)
				);
				expect(await mockERC20C.balanceOf(strategyInteractorDummy.address)).to.equal(
					sICBalanceB4.add(erc20DepositAmount)
				);

				// [main-test] Withdraw ERC20 tokens into the strategy
				await yieldSyncV1EMPStrategy.utilizedERC20Withdraw(await yieldSyncV1EMPStrategy.balanceOf(OWNER.address));

				// Supply put back to original
				expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(STRAT_TOTAL_SUPPLY_B4);

				expect(await mockERC20C.balanceOf(OWNER.address)).to.equal(OWNERCBalanceB4);
			}
		);
	});
});
