const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory, VoidSigner } from "ethers";

import { ERROR, PERCENT, D_18 } from "../const";
import UtilStrategyTransfer from "../util/UtilStrategyTransfer";
import { deployContract } from "../util/UtilEMP";


const LOCATION_IERC20: string = "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20";


describe("[5.2] V1EMPStrategy.sol - Withdrawing Tokens", async () => {
	let arrayUtility: Contract;
	let governance: Contract;
	let eTHValueProvider: Contract;
	let eTHValueProviderC: Contract;
	let eRC20Handler: Contract;
	let registry: Contract;
	let strategy: Contract;
	let strategyDeployer: Contract;
	let strategyUtility: Contract;

	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;
	let mockERC20D: Contract;

	let utilStrategyTransfer: UtilStrategyTransfer;

	let owner: VoidSigner;
	let manager: VoidSigner;
	let treasury: VoidSigner;
	let badActor: VoidSigner;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		[owner, manager, treasury, badActor] = await ethers.getSigners();


		const V1EMPStrategy: ContractFactory = await ethers.getContractFactory("V1EMPStrategy");
		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");


		governance = await deployContract("YieldSyncGovernance");

		await governance.payToUpdate(treasury.address);

		arrayUtility = await deployContract("ArrayUtility");

		registry = await deployContract("V1EMPRegistry", [governance.address]);

		await registry.arrayUtilityUpdate(arrayUtility.address);

		strategyUtility = await deployContract("V1EMPStrategyUtility", [registry.address]);

		await registry.v1EMPStrategyUtilityUpdate(strategyUtility.address);

		strategyDeployer = await deployContract("V1EMPStrategyDeployer", [registry.address]);

		mockERC20A = await deployContract("MockERC20", ["Mock A", "A", 18]);
		mockERC20B = await deployContract("MockERC20", ["Mock B", "B", 18]);
		mockERC20C = await deployContract("MockERC20", ["Mock C", "C", 6]);
		mockERC20D = await (await MockERC20.deploy("Mock D", "D", 18)).deployed();

		eTHValueProvider = await deployContract("MockERC20ETHValueProvider", [18]);
		eTHValueProviderC = await deployContract("MockERC20ETHValueProvider", [6]);

		await registry.eRC20_eRC20ETHValueProviderUpdate(mockERC20A.address, eTHValueProvider.address);
		await registry.eRC20_eRC20ETHValueProviderUpdate(mockERC20B.address, eTHValueProvider.address);
		await registry.eRC20_eRC20ETHValueProviderUpdate(mockERC20C.address, eTHValueProviderC.address);
		await registry.eRC20_eRC20ETHValueProviderUpdate(mockERC20D.address, eTHValueProvider.address);

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

		utilStrategyTransfer = new UtilStrategyTransfer(strategy, registry);

		eRC20Handler = await deployContract("Holder", [strategy.address]);
	});


	describe("function utilizedERC20Withdraw()", async () => {
		let b4TotalSupplyStrategy: BigNumber;
		let b4BalanceMockAOwner: BigNumber;
		let b4BalanceMockASI: BigNumber;
		let b4BalanceMockBOwner: BigNumber;
		let b4BalanceMockBSI: BigNumber;

		beforeEach(async () => {
			// Snapshot Total Supply
			b4TotalSupplyStrategy = await strategy.sharesTotal();

			// Snapshot Balances
			b4BalanceMockAOwner = await mockERC20A.balanceOf(owner.address);

			b4BalanceMockASI = await mockERC20A.balanceOf(eRC20Handler.address);

			b4BalanceMockBOwner = await mockERC20B.balanceOf(owner.address);

			b4BalanceMockBSI = await mockERC20B.balanceOf(eRC20Handler.address);
		});

		describe("Modifier", async () => {
			it("[modifier] Should revert if ERC20 Handler is not set..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await expect(strategy.utilizedERC20Withdraw(0)).to.be.rejectedWith(
					ERROR.STRATEGY.ERC20_HANDLER_NOT_SET
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

		describe("Expected Failure", async () => {
			it("Should revert if withdrawals are not open..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]])

				// Set SI
				await strategy.iERC20HandlerUpdate(eRC20Handler.address);

				await strategy.utilizedERC20DepositOpenUpdate(true);

				// Set deposit amount
				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				// APPROVE - the SI contract to spend tokens on behalf of owner
				await mockERC20A.approve(eRC20Handler.address, DEPOSIT_AMOUNT);

				// DEPOSIT - ERC20 tokens into the strategy
				await strategy.utilizedERC20Deposit([DEPOSIT_AMOUNT]);

				// Expect that owner balance is the difference of the strategy total supply increased
				expect(await strategy.eMP_shares(owner.address)).to.be.equal(
					(await strategy.sharesTotal()).sub(b4TotalSupplyStrategy)
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
				await strategy.iERC20HandlerUpdate(eRC20Handler.address);

				await strategy.utilizedERC20DepositOpenUpdate(true);

				await strategy.utilizedERC20WithdrawOpenUpdate(true);

				expect(await strategy.utilizedERC20WithdrawOpen()).to.be.true;
			});

			describe("Expected Failure", async () => {
				let depositAmount: BigNumber;
				let totalSupplyStrategy: BigNumber;


				beforeEach(async () => {
					// Set deposit amount
					depositAmount = ethers.utils.parseUnits("1", 18);

					// APPROVE - SI contract to spend tokens on behalf of owner
					await mockERC20A.approve(eRC20Handler.address, depositAmount);


					// DEPOSIT - mockERC20A tokens into the strategy
					await strategy.utilizedERC20Deposit([depositAmount]);

					// Expect that the balance remains less than original
					expect(await mockERC20A.balanceOf(owner.address)).to.be.lessThan(b4BalanceMockAOwner);

					// SI mock a balance should equal to deposit amount
					expect(await mockERC20A.balanceOf(eRC20Handler.address)).to.be.equal(depositAmount);

					// Get current Strategy ERC20 total supply
					totalSupplyStrategy = await strategy.sharesTotal();

					// Expect that strategy total supply has increased
					expect(totalSupplyStrategy).to.be.greaterThan(b4TotalSupplyStrategy);
				});


				it("Should fail to process withdrawal if Strategy token balance is greater than owned..", async () => {
					const BALANCE_STRATEGY_OWNER: BigNumber = await strategy.eMP_shares(owner.address);

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
					expect(await strategy.eMP_shares(owner.address)).to.be.equal(
						totalSupplyStrategy.sub(b4TotalSupplyStrategy)
					);

					// Disable transfers
					await strategy.utilizedERC20DepositOpenUpdate(false);
					await strategy.utilizedERC20WithdrawOpenUpdate(false);

					// Set utilization.withdraw to false
					await strategy.utilizedERC20Update([mockERC20A.address], [[true, false, PERCENT.HUNDRED]]);

					// Enable transfers
					await strategy.utilizedERC20DepositOpenUpdate(true);
					await strategy.utilizedERC20WithdrawOpenUpdate(true);

					// [main-test] Withdraw ERC20 tokens into the strategy
					await expect(strategy.utilizedERC20Withdraw(await strategy.eMP_shares(owner.address))).to.be.not.rejected;

					// Expect that the SI MockERC20A balance has not changed
					expect(await mockERC20A.balanceOf(eRC20Handler.address)).to.be.equal(depositAmount);

					// Expect that the Strategy tokens have been burned
					expect(await strategy.eMP_shares(owner.address)).to.be.equal(0);

					// Expect that the Strategy total supply is not what it was before the deposit
					expect(await strategy.sharesTotal()).to.be.equal(b4TotalSupplyStrategy);

					// Expect that owner MockERC20A balance is equal to what it was after depositing
					expect(await mockERC20A.balanceOf(owner.address)).to.be.greaterThanOrEqual(
						AFTER_DEPOSIT_BALANCE_MOCK_A_OWNER
					);

					// Expect that owner MockERC20A balance is less than what it was before depositing
					expect(await mockERC20A.balanceOf(owner.address)).to.be.lessThan(b4BalanceMockAOwner);
				});
			});

			describe("Expected Success", async () => {
				it("Should allow caller to burn Strategy ERC20 tokens and receive deposits back..", async () => {
					// Set deposit amount
					const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

					// APPROVE - SI contract to spend tokens on behalf of owner
					await mockERC20A.approve(eRC20Handler.address, DEPOSIT_AMOUNT);

					// DEPOSIT - mockERC20A tokens into the strategy
					await strategy.utilizedERC20Deposit([DEPOSIT_AMOUNT]);

					const AFTER_BALANCE_MOCK_A_SI: BigNumber = await mockERC20A.balanceOf(eRC20Handler.address);

					// mockERC20A BalanceOf erc20 handler should equal to deposit amount
					expect(AFTER_BALANCE_MOCK_A_SI).to.be.equal(b4BalanceMockASI.add(DEPOSIT_AMOUNT));

					// Expect that strategy total supply has increased
					expect(await strategy.sharesTotal()).to.be.greaterThan(b4TotalSupplyStrategy);

					// Expect that owner balance is the difference of the Strat supply increase
					expect(await strategy.eMP_shares(owner.address)).to.be.equal(
						(await strategy.sharesTotal()).sub(b4TotalSupplyStrategy)
					);

					// [main-test] Withdraw ERC20 tokens into the strategy
					await expect(strategy.utilizedERC20Withdraw(DEPOSIT_AMOUNT)).to.be.not.rejected;

					// Strategy token burned
					expect(await strategy.eMP_shares(owner.address)).to.be.equal(b4BalanceMockASI);

					// Supply put back to original
					expect(await strategy.sharesTotal()).to.be.equal(b4TotalSupplyStrategy);

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
				await strategy.iERC20HandlerUpdate(eRC20Handler.address);

				await strategy.utilizedERC20DepositOpenUpdate(true);

				expect(await strategy.utilizedERC20DepositOpen()).to.be.true;

				await strategy.utilizedERC20WithdrawOpenUpdate(true);

				expect(await strategy.utilizedERC20WithdrawOpen()).to.be.true;
			});

			describe("Expected Success", async () => {
				it("Should allow caller to burn Strategy ERC20 tokens and receive deposits back..", async () => {
					const UTILIZED_ERC20: string[] = await strategy.utilizedERC20();

					const DEPOSIT_AMOUNTS: BigNumber[] = await utilStrategyTransfer.calculateERC20Required(
						ethers.utils.parseUnits("1", 18)
					);

					let b4BalancesOwner: BigNumber[] = [];
					let b4BalancesERC20Handler: BigNumber[] = [];

					for (let i: number = 0; i < UTILIZED_ERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_IERC20, UTILIZED_ERC20[i]);

						// APPROVE - SI contract to spend tokens on behalf of owner
						await IERC20.approve(eRC20Handler.address, DEPOSIT_AMOUNTS[i]);

						// Collect previous balances to check later with
						b4BalancesOwner.push(await IERC20.balanceOf(owner.address));
						b4BalancesERC20Handler.push(await IERC20.balanceOf(eRC20Handler.address));
					}

					// DEPOSIT - mockERC20A tokens into the strategy
					await strategy.utilizedERC20Deposit(DEPOSIT_AMOUNTS);

					for (let i: number = 0; i < UTILIZED_ERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_IERC20, UTILIZED_ERC20[i]);

						// Expect balance of owner
						expect(await IERC20.balanceOf(owner.address)).to.equal(b4BalancesOwner[i].sub(DEPOSIT_AMOUNTS[i]));

						expect(await IERC20.balanceOf(eRC20Handler.address)).to.be.equal(
							b4BalancesERC20Handler[i].add(DEPOSIT_AMOUNTS[i])
						);
					}

					const TOTAL_SUPPLY_STRATEGY: BigNumber = await strategy.sharesTotal();

					// Expect that strategy total supply has increased
					expect(TOTAL_SUPPLY_STRATEGY).to.be.greaterThan(b4TotalSupplyStrategy);

					// Expect that the Strat balance of owner is correct
					expect(await strategy.eMP_shares(owner.address)).to.be.equal(
						TOTAL_SUPPLY_STRATEGY.sub(b4TotalSupplyStrategy)
					);

					// [main-test] Withdraw ERC20 tokens into the strategy
					await expect(
						strategy.utilizedERC20Withdraw(await strategy.eMP_shares(owner.address))
					).to.be.not.rejected;

					// Supply put back to original
					expect(await strategy.sharesTotal()).to.be.equal(b4TotalSupplyStrategy);

					// Expect that the balance been returned to original or greater
					expect(await mockERC20A.balanceOf(owner.address)).to.be.greaterThanOrEqual(b4BalanceMockAOwner);

					// Expect that the balance been returned to original or greater
					expect(await mockERC20B.balanceOf(owner.address)).to.be.greaterThanOrEqual(b4BalanceMockBOwner);
				});
			});
		});
	});
});
