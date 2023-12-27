const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

const HUNDRED_PERCENT = ethers.utils.parseUnits('1', 18);
const FIFTY_PERCENT = ethers.utils.parseUnits('.5', 18);
const TWENTY_FIVE_PERCENT = ethers.utils.parseUnits('.25', 18);
const SEVENTY_FIVE_PERCENT = ethers.utils.parseUnits('.75', 18);


describe("[0.3] YieldSyncV1EMPStrategy.sol - Market Movement", async ()  =>
{
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC206: Contract;
	let eTHValueFeedDummy: Contract;
	let strategyInteractorDummy: Contract;
	let yieldSyncV1EMPStrategy: Contract;


	beforeEach("[beforeEach] Set up contracts..", async ()  =>
	{
		const [owner] = await ethers.getSigners();

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const MockERC206: ContractFactory = await ethers.getContractFactory("MockERC206");
		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");
		const YieldSyncV1EMPStrategy: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategy");

		mockERC20A = await (await MockERC20.deploy()).deployed();
		mockERC20B = await (await MockERC20.deploy()).deployed();
		mockERC206 = await (await MockERC206.deploy()).deployed();
		eTHValueFeedDummy = await (await ETHValueFeedDummy.deploy()).deployed();
		strategyInteractorDummy = await (await StrategyInteractorDummy.deploy()).deployed();
		yieldSyncV1EMPStrategy = await (await YieldSyncV1EMPStrategy.deploy(owner.address, "Exampe", "EX")).deployed();
	});


	describe("function utilizedERC20Deposit()", async ()  =>
	{
		describe("[SINGLE ERC20]", async ()  =>
		{
			describe("[DECIMALS = 18]", async ()  =>
			{
				it(
					"[100] Should recieve strategy tokens based on what market value is (denominated in ETH)..",
					async () =>
					{
						const [owner] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.initializeStrategy(
								eTHValueFeedDummy.address,
								strategyInteractorDummy.address,
								[mockERC20A.address],
								[HUNDRED_PERCENT]
							)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


						const mockERC20AdepositAmount = ethers.utils.parseUnits("1", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
						await mockERC20A.approve(strategyInteractorDummy.address, mockERC20AdepositAmount);

						// Deposit ERC20 tokens into the strategy
						await yieldSyncV1EMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount])

						// Supply put back to original
						expect(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).to.be.equal(mockERC20AdepositAmount);

						// Update Ether value of MockERC20A
						await eTHValueFeedDummy.updateETHValue(ethers.utils.parseUnits("2", 18));

						const mockERC20AdepositAmount2 = ethers.utils.parseUnits("1", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
						await mockERC20A.approve(strategyInteractorDummy.address, mockERC20AdepositAmount2);

						// Deposit ERC20 tokens into the strategy
						await yieldSyncV1EMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount2])

						expect(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).to.be.equal(
							ethers.utils.parseUnits("3", 18)
						);
					}
				)
			});
		});
	});

	describe("function utilizedERC20Withdraw()", async ()  =>
	{
		describe("[SINGLE ERC20]", async ()  =>
		{
			describe("[DECIMALS = 18]", async ()  =>
			{
				it(
					"[100] Should return same amount of ERC20 even if value of ERC20 changes..",
					async () =>
					{
						const [owner] = await ethers.getSigners();

						// Initialize strategy with mock ERC20
						await expect(
							yieldSyncV1EMPStrategy.initializeStrategy(
								eTHValueFeedDummy.address,
								strategyInteractorDummy.address,
								[mockERC20A.address],
								[HUNDRED_PERCENT]
							)
						).to.not.be.reverted;

						await yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();
						await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();


						// Capture
						const strategyTotalSupplyBefore = await yieldSyncV1EMPStrategy.totalSupply();

						const strategyInteractorMockERC20ABalanceB4 = await mockERC20A.balanceOf(
							strategyInteractorDummy.address
						);

						const ownerMockERC20ABalanceB4 = await mockERC20A.balanceOf(owner.address);


						const mockERC20AdepositAmount = ethers.utils.parseUnits("1", 18);

						// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
						await mockERC20A.approve(strategyInteractorDummy.address, mockERC20AdepositAmount);

						// Deposit ERC20 tokens into the strategy
						await yieldSyncV1EMPStrategy.utilizedERC20Deposit([mockERC20AdepositAmount])

						// [main-test] Withdraw ERC20 tokens into the strategy
						await yieldSyncV1EMPStrategy.utilizedERC20Withdraw(
							await yieldSyncV1EMPStrategy.balanceOf(owner.address)
						);

						// Update Ether value of MockERC20A
						await eTHValueFeedDummy.updateETHValue(ethers.utils.parseUnits("2", 18));

						// Strategy token burned
						expect(await yieldSyncV1EMPStrategy.balanceOf(owner.address)).to.be.equal(
							strategyInteractorMockERC20ABalanceB4
						);

						// Supply put back to original
						expect(await yieldSyncV1EMPStrategy.totalSupply()).to.be.equal(strategyTotalSupplyBefore);

						// Check that the balance been returned to original or greater
						expect(await mockERC20A.balanceOf(owner.address)).to.be.equal(ownerMockERC20ABalanceB4);
					}
				)
			});
		});
	});
});
