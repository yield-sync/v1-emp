const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory, VoidSigner } from "ethers";

import { ERROR, PERCENT, D_18 } from "../const";
import UtilStrategyTransfer from "../util/UtilStrategyTransfer";


const LOCATION_IERC20: string = "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20";


describe("[5.3] V1EMPStrategy.sol - Edgecases", async () => {
	let arrayUtility: Contract;
	let governance: Contract;
	let eTHValueFeed: Contract;
	let eTHValueFeedC: Contract;
	let strategyInteractor: Contract;
	let registry: Contract;
	let strategy: Contract;
	let strategyDeployer: Contract;
	let strategyUtility: Contract;

	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;

	let utilStrategyTransfer: UtilStrategyTransfer;

	let owner: VoidSigner;
	let manager: VoidSigner;
	let treasury: VoidSigner;
	let badActor: VoidSigner;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		/**
		* @dev It is important to utilize the UtilStrategyTransfer for multiple ERC20 based strategies because they get
		* reordred when setup. The strategyUtil will return the deposit amounts in the order of the what the conctract
		* returns for the Utilized ERC20s
		*/
		[owner, manager, treasury] = await ethers.getSigners();


		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const V1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("V1EMPArrayUtility");
		const V1EMPRegistry: ContractFactory = await ethers.getContractFactory("V1EMPRegistry");
		const V1EMPStrategy: ContractFactory = await ethers.getContractFactory("V1EMPStrategy");
		const V1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("V1EMPStrategyDeployer");
		const V1EMPStrategyUtility: ContractFactory = await ethers.getContractFactory("V1EMPStrategyUtility");

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");


		// Core contracts
		governance = await (await YieldSyncGovernance.deploy()).deployed();

		await governance.payToUpdate(treasury.address);

		arrayUtility = await (await V1EMPArrayUtility.deploy()).deployed();

		registry = await (await V1EMPRegistry.deploy(governance.address)).deployed();

		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

		strategyUtility = await (await V1EMPStrategyUtility.deploy(registry.address)).deployed();

		await registry.v1EMPStrategyUtilityUpdate(strategyUtility.address);

		strategyDeployer = await (await V1EMPStrategyDeployer.deploy(registry.address)).deployed();


		// Testing contracts
		mockERC20A = await (await MockERC20.deploy("Mock A", "A", 18)).deployed();
		mockERC20B = await (await MockERC20.deploy("Mock B", "B", 18)).deployed();
		mockERC20C = await (await MockERC20.deploy("Mock C", "C", 6)).deployed();

		eTHValueFeed = await (await ETHValueFeedDummy.deploy(18)).deployed();
		eTHValueFeedC = await (await ETHValueFeedDummy.deploy(6)).deployed();

		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20A.address, eTHValueFeed.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20B.address, eTHValueFeed.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20C.address, eTHValueFeedC.address);

		strategyInteractor = await (await StrategyInteractorDummy.deploy()).deployed();


		/**
		* @notice The owner has to be registered as the EMP deployer so that it can authorize itself as an EMP to access the
		* functions available on the strategy.
		*/
		await registry.v1EMPUtilityUpdate(owner.address);
		await registry.v1EMPDeployerUpdate(owner.address);
		await registry.v1EMPRegister(owner.address);


		// Set EMP Strategy Deployer on registry
		await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);

		// Deploy EMP Strategy
		await strategyDeployer.deployV1EMPStrategy();

		// Attach the deployed V1EMPStrategy address
		strategy = await V1EMPStrategy.attach(String(await registry.v1EMPStrategyId_v1EMPStrategy(1)));

		// Set the Strategy Interactor
		await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

		await strategy.utilizedERC20DepositOpenUpdate(true);

		await strategy.utilizedERC20WithdrawOpenUpdate(true);

		expect(await strategy.utilizedERC20WithdrawOpen()).to.be.true;

		utilStrategyTransfer = new UtilStrategyTransfer(strategy, registry);
	});

	describe("Utilized ERC20 price change", async () => {
		beforeEach(async () => {
			await strategy.utilizedERC20DepositOpenUpdate(false);

			expect(await strategy.utilizedERC20DepositOpen()).to.be.false;

			await strategy.utilizedERC20WithdrawOpenUpdate(false);

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.false;

			// Set strategy ERC20 tokens
			await expect(
				strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]])
			).to.be.not.rejected;

			await strategy.utilizedERC20DepositOpenUpdate(true);

			expect(await strategy.utilizedERC20DepositOpen()).to.be.true;

			await strategy.utilizedERC20WithdrawOpenUpdate(true);

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.true;
		});


		describe("function utilizedERC20Deposit()", async () => {
			const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);
			const DEPOSIT_AMOUNT_2: BigNumber = ethers.utils.parseUnits("1", 18);


			it("Should receive strategy tokens based on what market value is (denominated in ETH)..", async () => {
				// Approve the SI to spend Mock A on behalf of owner
				await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT);

				// DEPOSIT - ERC20 tokens into the strategy
				await strategy.utilizedERC20Deposit([DEPOSIT_AMOUNT])

				let BalanceStrategyOwner = await strategy.eMP_shares(owner.address);

				const feed = await ethers.getContractAt(
					"ETHValueFeedDummy",
					await registry.eRC20_v1EMPERC20ETHValueFeed(mockERC20A.address)
				);

				// Get the ETH value of each tokens in ETH
				let ethValueMockA: BigNumber = await feed.utilizedERC20ETHValue();

				// [calculate] Deposit ETH Value
				let totalEthValue: BigNumber = DEPOSIT_AMOUNT.mul(ethValueMockA).div(D_18);

				// Expect that that amount of S tokens received
				expect(BalanceStrategyOwner).to.be.equal(totalEthValue);

				// [PRICE-UPDATE] Update Ether value of MockERC20A
				await eTHValueFeed.updateETHValue(ethers.utils.parseUnits("2", 18));

				// APPROVE - SI contract to spend tokens on behalf of owner
				await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT_2);

				// DEPOSIT - ERC20 tokens into the strategy
				await strategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_2])

				BalanceStrategyOwner = await strategy.eMP_shares(owner.address);

				expect(BalanceStrategyOwner).to.be.equal(ethers.utils.parseUnits("3", 18));

				// Get the ETH value of each tokens in ETH
				ethValueMockA = await feed.utilizedERC20ETHValue();

				let totalDeposited: BigNumber = DEPOSIT_AMOUNT.add(DEPOSIT_AMOUNT_2);

				// [calculate] Deposit ETH Value
				totalEthValue = totalDeposited.mul(ethValueMockA).div(D_18);

				expect(totalEthValue).to.be.equal(ethers.utils.parseUnits("4", 18));
			});
		});

		describe("function utilizedERC20Withdraw()", async () => {
			const B4_TOTAL_SUPPLY_STRATEGY: BigNumber = await strategy.sharesTotal();
			const B4_BALANCE_MOCK_A_SI: BigNumber = await mockERC20A.balanceOf(strategyInteractor.address);
			const B4_BALANCE_MOCK_A_OWNER: BigNumber = await mockERC20A.balanceOf(owner.address);
			const DEPOSIT_AMOUNT_A: BigNumber = ethers.utils.parseUnits("1", 18);


			it("Should return same amount of ERC20 even if value of ERC20 changes..", async () => {
				// APPROVE - SI contract to spend tokens on behalf of owner
				await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT_A);

				// DEPOSIT - ERC20 tokens into the strategy
				await strategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_A])

				// [main-test] Withdraw ERC20 tokens into the strategy
				await strategy.utilizedERC20Withdraw(await strategy.eMP_shares(owner.address));

				// [PRICE-UPDATE] Update Ether value of MockERC20A
				await eTHValueFeed.updateETHValue(ethers.utils.parseUnits("2", 18));

				// Strategy token burned
				expect(await strategy.eMP_shares(owner.address)).to.be.equal(B4_BALANCE_MOCK_A_SI);

				// Supply put back to original
				expect(await strategy.sharesTotal()).to.be.equal(B4_TOTAL_SUPPLY_STRATEGY);

				// Expect that the balance been returned to original or greater
				expect(await mockERC20A.balanceOf(owner.address)).to.be.equal(B4_BALANCE_MOCK_A_OWNER);
			});
		});
	});

	describe("Strategy that accepts ERC20 A and ERC20 B but returns ERC20 C", async () => {
		beforeEach(async () => {
			await strategy.utilizedERC20DepositOpenUpdate(false);

			expect(await strategy.utilizedERC20DepositOpen()).to.be.false;

			await strategy.utilizedERC20WithdrawOpenUpdate(false);

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.false;

			// Set strategy ERC20 tokens
			await strategy.utilizedERC20Update(
				[mockERC20A.address, mockERC20B.address, mockERC20C.address],
				[[true, false, PERCENT.FIFTY], [true, false, PERCENT.FIFTY], [false, false, PERCENT.ZERO]],
			);

			await strategy.utilizedERC20DepositOpenUpdate(true);

			expect(await strategy.utilizedERC20DepositOpen()).to.be.true;

			await strategy.utilizedERC20WithdrawOpenUpdate(true);

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.true;
		});

		it("Should fail to return C if withdraw is not set to true..", async () => {
			// Give ERC20C to Strategy Interactor to mock rewards accrual
			await mockERC20C.connect(owner).transfer(strategyInteractor.address, ethers.utils.parseUnits("1", 6));

			const UTILIZED_ERC20: string[] = await strategy.utilizedERC20();

			const DEPOSIT_AMOUNTS: BigNumber[] = await utilStrategyTransfer.calculateERC20Required(
				ethers.utils.parseUnits("1", 18)
			);

			expect(DEPOSIT_AMOUNTS.length).to.be.equal(UTILIZED_ERC20.length);

			// Capture balances
			const B4_TOTAL_SUPPLY_STRATEGY: BigNumber = await strategy.sharesTotal();

			const B4_BALANCE_MOCK_C_OWNER: BigNumber = await mockERC20C.balanceOf(owner.address);

			let b4BalancesOwner: BigNumber[] = [];
			let b4BalancesStrategyInteractor: BigNumber[] = [];

			for (let i: number = 0; i < UTILIZED_ERC20.length; i++)
			{
				const IERC20 = await ethers.getContractAt(
					"@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
					UTILIZED_ERC20[i]
				);

				// APPROVE - SI contract to spend tokens on behalf of owner
				await IERC20.approve(strategyInteractor.address, DEPOSIT_AMOUNTS[i]);

				// Collect previous balances to check later with
				b4BalancesOwner.push(await IERC20.balanceOf(owner.address));
				b4BalancesStrategyInteractor.push(await IERC20.balanceOf(strategyInteractor.address));
			}

			// DEPOSIT - ERC20 A and ERC20 B tokens into the strategy
			await expect(
				strategy.utilizedERC20Deposit(DEPOSIT_AMOUNTS)
			).to.be.not.rejected;

			for (let i: number = 0; i < UTILIZED_ERC20.length; i++)
			{
				const IERC20 = await ethers.getContractAt(LOCATION_IERC20, UTILIZED_ERC20[i]);

				// Expect balance of owner
				expect(await IERC20.balanceOf(owner.address)).to.equal(b4BalancesOwner[i].sub(DEPOSIT_AMOUNTS[i]));

				// Expect balance of strategy interactor
				expect(await IERC20.balanceOf(strategyInteractor.address)).to.equal(
					b4BalancesStrategyInteractor[i].add(DEPOSIT_AMOUNTS[i])
				);
			}

			// [main-test] Withdraw ERC20 tokens into the strategy
			await strategy.utilizedERC20Withdraw(await strategy.eMP_shares(owner.address));

			// Supply put back to original
			expect(await strategy.sharesTotal()).to.be.equal(B4_TOTAL_SUPPLY_STRATEGY);

			expect(await mockERC20C.balanceOf(owner.address)).to.equal(B4_BALANCE_MOCK_C_OWNER);
		});
	});
});
