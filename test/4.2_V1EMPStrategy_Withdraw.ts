const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory, VoidSigner } from "ethers";

import { ERROR, PERCENT, D_18 } from "../const";
import StrategyTransferUtil from "../scripts/StrategyTransferUtil";


const LOCATION_IERC20: string = "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20";


describe("[4.2] V1EMPStrategy.sol - Withdrawing Tokens", async () => {
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
	let mockERC20D: Contract;

	let strategyTransferUtil: StrategyTransferUtil;

	let owner: VoidSigner;
	let manager: VoidSigner;
	let treasury: VoidSigner;
	let badActor: VoidSigner;


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
		[owner, manager, treasury, badActor] = await ethers.getSigners();


		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const V1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("V1EMPArrayUtility");
		const V1EMPRegistry: ContractFactory = await ethers.getContractFactory("V1EMPRegistry");
		const V1EMPStrategy: ContractFactory = await ethers.getContractFactory("V1EMPStrategy");
		const V1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("V1EMPStrategyDeployer");

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");


		governance = await (await YieldSyncGovernance.deploy()).deployed();

		await governance.payToUpdate(treasury.address);

		arrayUtility = await (await V1EMPArrayUtility.deploy()).deployed();

		registry = await (await V1EMPRegistry.deploy(governance.address)).deployed();

		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

		strategyDeployer = await (await V1EMPStrategyDeployer.deploy(registry.address)).deployed();

		mockERC20A = await (await MockERC20.deploy("Mock A", "A")).deployed();
		mockERC20B = await (await MockERC20.deploy("Mock B", "B")).deployed();
		mockERC20C = await (await MockERC20.deploy("Mock C", "C")).deployed();
		mockERC20D = await (await MockERC20.deploy("Mock D", "D")).deployed();

		eTHValueFeed = await (await ETHValueFeedDummy.deploy()).deployed();

		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20A.address, eTHValueFeed.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20B.address, eTHValueFeed.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20C.address, eTHValueFeed.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20D.address, eTHValueFeed.address);

		strategyInteractor = await (await StrategyInteractorDummy.deploy()).deployed();

		/**
		* @notice The owner has to be registered as the EMP deployer so that it can authorize itself as an EMP to access the
		* functions available on the strategy.
		*/
		await registry.v1EMPAmountsValidatorUpdate(owner.address);
		await registry.v1EMPDeployerUpdate(owner.address);
		await registry.v1EMPRegister(owner.address);


		// Set EMP Strategy Deployer on registry
		await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);

		// Deploy EMP Strategy
		await strategyDeployer.deployV1EMPStrategy("Strategy", "S");

		// Attach the deployed V1EMPStrategy address
		strategy = await V1EMPStrategy.attach(String(await registry.v1EMPStrategyId_v1EMPStrategy(1)));

		strategyTransferUtil = new StrategyTransferUtil(strategy, registry);
	});


	describe("function utilizedERC20Withdraw()", async () => {
		let b4TotalSupplyStrategy: BigNumber;
		let b4BalanceMockAOwner: BigNumber;
		let b4BalanceMockASI: BigNumber;
		let b4BalanceMockBOwner: BigNumber;
		let b4BalanceMockBSI: BigNumber;

		beforeEach(async () => {
			// Snapshot Total Supply
			b4TotalSupplyStrategy = await strategy.totalSupply();

			// Snapshot Balances
			b4BalanceMockAOwner = await mockERC20A.balanceOf(owner.address);

			b4BalanceMockASI = await mockERC20A.balanceOf(strategyInteractor.address);

			b4BalanceMockBOwner = await mockERC20B.balanceOf(owner.address);

			b4BalanceMockBSI = await mockERC20B.balanceOf(strategyInteractor.address);
		});

		describe("Modifier", async () => {
			it("[modifier] Should revert if Strategy Interactor is not set..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await expect(strategy.utilizedERC20Withdraw(0)).to.be.rejectedWith(
					ERROR.STRATEGY.INTERACTOR_NOT_SET
				);
			});

			it("[modifier][auth] Should only allow mocked EMP (owner address) to call fn..", async () => {
				/**
				* @notice
				* In this test suite the OWNER address is mocked to be an EMP
				*/

				await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await expect(strategy.connect(badActor).utilizedERC20Withdraw(0)).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
			});
		});

		describe("Invalid", async () => {
			it("Should revert if withdrawals are not open..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]])

				// Set SI
				await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				// Toggle deposits on
				await strategy.utilizedERC20DepositOpenToggle();

				// Set deposit amount
				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				// APPROVE - the SI contract to spend tokens on behalf of owner
				await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT);

				// DEPOSIT - ERC20 tokens into the strategy
				await strategy.utilizedERC20Deposit(owner.address, [DEPOSIT_AMOUNT]);

				// Expect that owner balance is the difference of the strategy total supply increased
				expect(await strategy.balanceOf(owner.address)).to.be.equal(
					(await strategy.totalSupply()).sub(b4TotalSupplyStrategy)
				);

				// [main-test] WITHDRAW - ERC20 tokens into the strategy
				await expect(strategy.utilizedERC20Withdraw(0)).to.be.rejectedWith(
					ERROR.STRATEGY.WITHDRAW_NOT_OPEN
				);
			});
		});

		describe("[SINGLE ERC20]", async () => {
			beforeEach(async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				// Set SI
				await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				// Toggle deposits on
				await strategy.utilizedERC20DepositOpenToggle();

				// Toggle withdrawals on
				await strategy.utilizedERC20WithdrawOpenToggle();

				// Expect that withdrawals are toggled on
				expect(await strategy.utilizedERC20WithdrawOpen()).to.be.true;
			});

			describe("Invalid", async () => {
				let depositAmount: BigNumber;
				let totalSupplyStrategy: BigNumber;


				beforeEach(async () => {
					// Set deposit amount
					depositAmount = ethers.utils.parseUnits("1", 18);

					// APPROVE - SI contract to spend tokens on behalf of owner
					await mockERC20A.approve(strategyInteractor.address, depositAmount);


					// DEPOSIT - mockERC20A tokens into the strategy
					await strategy.utilizedERC20Deposit(owner.address, [depositAmount]);

					// Expect that the balance remains less than original
					expect(await mockERC20A.balanceOf(owner.address)).to.be.lessThan(b4BalanceMockAOwner);

					// SI mock a balance should equal to deposit amount
					expect(await mockERC20A.balanceOf(strategyInteractor.address)).to.be.equal(depositAmount);

					// Get current Strategy ERC20 total supply
					totalSupplyStrategy = await strategy.totalSupply();

					// Expect that strategy total supply has increased
					expect(totalSupplyStrategy).to.be.greaterThan(b4TotalSupplyStrategy);
				});


				it("Should fail to process withdrawal if Strategy token balance is greater than owned..", async () => {
					const BALANCE_STRATEGY_OWNER: BigNumber = await strategy.balanceOf(owner.address);

					// Expect that owner balance is the difference of the Strat supply increase
					expect(BALANCE_STRATEGY_OWNER).to.be.equal(totalSupplyStrategy.sub(b4TotalSupplyStrategy));

					// Create invalid balance to test with
					const INVALID_BALANCE: BigNumber = (BALANCE_STRATEGY_OWNER).add(ethers.utils.parseUnits(".1", 18));

					// [main-test] WITHDRAW - Fail to withdraw ERC20 tokens
					await expect(strategy.utilizedERC20Withdraw(INVALID_BALANCE)).to.be.rejectedWith(
						ERROR.STRATEGY.INVALID_BALANCE
					);
				});

				it("Should fail to return ERC20 if purpose.withdraw != true..", async () => {
					// Capture balance after depositing
					const AFTER_DEPOSIT_BALANCE_MOCK_A_OWNER = await mockERC20A.balanceOf(owner.address);

					// Expect that owner balance is the difference of the Strat supply increase
					expect(await strategy.balanceOf(owner.address)).to.be.equal(
						(await strategy.totalSupply()).sub(b4TotalSupplyStrategy)
					);

					// Disable transfers
					await strategy.utilizedERC20DepositOpenToggle();
					await strategy.utilizedERC20WithdrawOpenToggle();

					// Set utilization.withdraw to false
					await strategy.utilizedERC20Update([mockERC20A.address], [[true, false, PERCENT.HUNDRED]]);

					// Enable transfers
					await strategy.utilizedERC20DepositOpenToggle();
					await strategy.utilizedERC20WithdrawOpenToggle();

					// [main-test] Withdraw ERC20 tokens into the strategy
					await expect(strategy.utilizedERC20Withdraw(await strategy.balanceOf(owner.address))).to.be.not.rejected;

					// Expect that the SI MockERC20A balance has not changed
					expect(await mockERC20A.balanceOf(strategyInteractor.address)).to.be.equal(depositAmount);

					// Expect that the Strategy tokens have been burned
					expect(await strategy.balanceOf(owner.address)).to.be.equal(0);

					// Expect that the Strategy total supply is not what it was before the deposit
					expect(await strategy.totalSupply()).to.be.equal(b4TotalSupplyStrategy);

					// Expect that owner MockERC20A balance is equal to what it was after depositing
					expect(await mockERC20A.balanceOf(owner.address)).to.be.greaterThanOrEqual(
						AFTER_DEPOSIT_BALANCE_MOCK_A_OWNER
					);

					// Expect that owner MockERC20A balance is less than what it was before depositing
					expect(await mockERC20A.balanceOf(owner.address)).to.be.lessThan(b4BalanceMockAOwner);
				});
			});

			describe("Valid", async () => {
				it("Should allow caller to burn Strategy ERC20 tokens and receive deposits back..", async () => {
					// Set deposit amount
					const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

					// APPROVE - SI contract to spend tokens on behalf of owner
					await mockERC20A.approve(strategyInteractor.address, DEPOSIT_AMOUNT);

					// DEPOSIT - mockERC20A tokens into the strategy
					await strategy.utilizedERC20Deposit(owner.address, [DEPOSIT_AMOUNT]);

					const AFTER_BALANCE_MOCK_A_SI: BigNumber = await mockERC20A.balanceOf(strategyInteractor.address);

					// mockERC20A BalanceOf strategy interactor should equal to deposit amount
					expect(AFTER_BALANCE_MOCK_A_SI).to.be.equal(b4BalanceMockASI.add(DEPOSIT_AMOUNT));

					// Expect that strategy total supply has increased
					expect(await strategy.totalSupply()).to.be.greaterThan(b4TotalSupplyStrategy);

					// Expect that owner balance is the difference of the Strat supply increase
					expect(await strategy.balanceOf(owner.address)).to.be.equal(
						(await strategy.totalSupply()).sub(b4TotalSupplyStrategy)
					);

					// [main-test] Withdraw ERC20 tokens into the strategy
					await expect(strategy.utilizedERC20Withdraw(DEPOSIT_AMOUNT)).to.be.not.rejected;

					// Strategy token burned
					expect(await strategy.balanceOf(owner.address)).to.be.equal(b4BalanceMockASI);

					// Supply put back to original
					expect(await strategy.totalSupply()).to.be.equal(b4TotalSupplyStrategy);

					// Expect that the balance been returned to original or greater
					expect(await mockERC20A.balanceOf(owner.address)).to.be.greaterThanOrEqual(b4BalanceMockAOwner);
				});
			});
		});

		describe("[MULTIPLE ERC20] - A 40%, B 25%, C 25%, D 10%", async () => {
			beforeEach(async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update(
					[
						mockERC20A.address,
						mockERC20B.address,
						mockERC20C.address,
						mockERC20D.address,
					],
					[
						[true, true, PERCENT.FORTY],
						[true, true, PERCENT.TWENTY_FIVE],
						[true, true, PERCENT.TWENTY_FIVE],
						[true, true, PERCENT.TEN],
					]
				);

				// Set SI
				await strategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

				// Toggle deposits on
				await strategy.utilizedERC20DepositOpenToggle();

				// Toggle withdrawals on
				await strategy.utilizedERC20WithdrawOpenToggle();

				// Expect that withdrawals are toggled on
				expect(await strategy.utilizedERC20WithdrawOpen()).to.be.true;
			});

			describe("Valid", async () => {
				it("Should allow caller to burn Strategy ERC20 tokens and receive deposits back..", async () => {
					const UTILIZED_ERC20: string[] = await strategy.utilizedERC20();

					const DEPOSIT_AMOUNTS: BigNumber[] = await strategyTransferUtil.calculateERC20Required(
						ethers.utils.parseUnits("1", 18)
					);

					let b4BalancesOwner: BigNumber[] = [];
					let b4BalancesStrategyInteractor: BigNumber[] = [];

					for (let i: number = 0; i < UTILIZED_ERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_IERC20, UTILIZED_ERC20[i]);

						// APPROVE - SI contract to spend tokens on behalf of owner
						await IERC20.approve(strategyInteractor.address, DEPOSIT_AMOUNTS[i]);

						// Collect previous balances to check later with
						b4BalancesOwner.push(await IERC20.balanceOf(owner.address));
						b4BalancesStrategyInteractor.push(await IERC20.balanceOf(strategyInteractor.address));
					}

					// DEPOSIT - mockERC20A tokens into the strategy
					await strategy.utilizedERC20Deposit(owner.address, DEPOSIT_AMOUNTS);

					for (let i: number = 0; i < UTILIZED_ERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_IERC20, UTILIZED_ERC20[i]);

						// Expect balance of owner
						expect(await IERC20.balanceOf(owner.address)).to.equal(b4BalancesOwner[i].sub(DEPOSIT_AMOUNTS[i]));

						expect(await IERC20.balanceOf(strategyInteractor.address)).to.be.equal(
							b4BalancesStrategyInteractor[i].add(DEPOSIT_AMOUNTS[i])
						);
					}

					const TOTAL_SUPPLY_STRATEGY: BigNumber = await strategy.totalSupply();

					// Expect that strategy total supply has increased
					expect(TOTAL_SUPPLY_STRATEGY).to.be.greaterThan(b4TotalSupplyStrategy);

					// Expect that the Strat balance of owner is correct
					expect(await strategy.balanceOf(owner.address)).to.be.equal(
						TOTAL_SUPPLY_STRATEGY.sub(b4TotalSupplyStrategy)
					);

					// [main-test] Withdraw ERC20 tokens into the strategy
					await expect(
						strategy.utilizedERC20Withdraw(await strategy.balanceOf(owner.address))
					).to.be.not.rejected;

					// Supply put back to original
					expect(await strategy.totalSupply()).to.be.equal(b4TotalSupplyStrategy);

					// Expect that the balance been returned to original or greater
					expect(await mockERC20A.balanceOf(owner.address)).to.be.greaterThanOrEqual(b4BalanceMockAOwner);

					// Expect that the balance been returned to original or greater
					expect(await mockERC20B.balanceOf(owner.address)).to.be.greaterThanOrEqual(b4BalanceMockBOwner);
				});
			});
		});
	});
});
