const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory, VoidSigner } from "ethers";

import { ERROR, PERCENT, D_18 } from "../const";
import UtilStrategyTransfer from "../util/UtilStrategyTransfer";
import { deployContract } from "../util/UtilEMP";


const LOCATION_IERC20: string = "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20";


describe("[5.1] V1EMPStrategy.sol - Depositing Tokens", async () => {
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


		governance = await deployContract("@yield-sync/governance/contracts/YieldSyncGovernance.sol:YieldSyncGovernance");

		await governance.payToUpdate(treasury.address);

		arrayUtility = await deployContract("V1EMPArrayUtility");

		registry = await deployContract("V1EMPRegistry", [governance.address]);

		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

		strategyUtility = await deployContract("V1EMPStrategyUtility", [registry.address]);

		await registry.v1EMPStrategyUtilityUpdate(strategyUtility.address);

		strategyDeployer = await deployContract("V1EMPStrategyDeployer", [registry.address]);

		mockERC20A = await deployContract("MockERC20", ["Mock A", "A", 18]);
		mockERC20B = await deployContract("MockERC20", ["Mock B", "B", 18]);
		mockERC20C = await deployContract("MockERC20", ["Mock C", "C", 6]);
		mockERC20D = await deployContract("MockERC20", ["Mock D", "D", 18]);

		eTHValueProvider = await deployContract("ETHValueProviderDummy", [18]);
		eTHValueProviderC = await deployContract("ETHValueProviderDummy", [6]);

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

		eRC20Handler = await deployContract("@yield-sync/erc20-handler/contracts/Holder.sol:Holder", [strategy.address]);
	});


	describe("function utilizedERC20Deposit()", async () => {
		let utilizedERC20: string[];
		let b4TotalSupplyStrategy: BigNumber;


		describe("Modifier", async () => {
			it("[modifier] Should revert if ERC20 Handler is not set..", async () => {
				await expect(strategy.utilizedERC20Deposit([])).to.be.rejectedWith(
					ERROR.STRATEGY.ERC20_HANDLER_NOT_SET
				);
			});

			it("[modifier] Should only authorize authorized caller..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await strategy.iV1EMPERC20HandlerUpdate(eRC20Handler.address);

				await expect(strategy.connect(badActor).utilizedERC20Deposit([])).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});
		});

		describe("Expected Failure", async () => {
			it("Should revert if deposits not open..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await strategy.iV1EMPERC20HandlerUpdate(eRC20Handler.address);

				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				// APPROVE - SI contract to spend tokens on behalf of owner
				await mockERC20A.approve(eRC20Handler.address, DEPOSIT_AMOUNT);

				// [main-test] Deposit ERC20 tokens into the strategy
				await expect(
					strategy.utilizedERC20Deposit([DEPOSIT_AMOUNT, DEPOSIT_AMOUNT])
				).to.rejectedWith(ERROR.STRATEGY.DEPOSIT_NOT_OPEN);
			});

			it("Should revert if invalid length _utilizedERC20Amount passed..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await strategy.iV1EMPERC20HandlerUpdate(eRC20Handler.address);

				await strategy.utilizedERC20DepositOpenUpdate(true);

				await expect(strategy.utilizedERC20Deposit([])).to.be.rejectedWith(
					ERROR.STRATEGY.INVALID_PARAMS_DEPOSIT_LENGTH
				);
			});

			it("Should revert if denominator is 0..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await strategy.iV1EMPERC20HandlerUpdate(eRC20Handler.address);

				await strategy.utilizedERC20DepositOpenUpdate(true);

				// Set ETH value to ZERO
				await eTHValueProvider.updateETHValue(0);

				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				await expect(strategy.utilizedERC20Deposit([DEPOSIT_AMOUNT])).to.be.rejectedWith(
					ERROR.NOT_COMPUTED
				);
			});

			it("Should return false if INVALID ERC20 amounts with deposits set to false but non-zero deposit amount passed..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update(
					[mockERC20A.address, mockERC20B.address],
					[[true, true, PERCENT.HUNDRED], [false, true, PERCENT.HUNDRED]]
				);

				await strategy.iV1EMPERC20HandlerUpdate(eRC20Handler.address);

				await strategy.utilizedERC20DepositOpenUpdate(true);

				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				await expect(
					strategy.utilizedERC20Deposit([DEPOSIT_AMOUNT, DEPOSIT_AMOUNT])
				).to.be.rejectedWith(
					ERROR.STRATEGY.UTILIZED_ERC20_AMOUNT_NOT_ZERO
				);
			});

			it("Should return false if INVALID ERC20 amounts passed..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update(
					[mockERC20A.address, mockERC20B.address],
					[[true, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]]
				);

				await strategy.iV1EMPERC20HandlerUpdate(eRC20Handler.address);

				await strategy.utilizedERC20DepositOpenUpdate(true);

				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				await expect(strategy.utilizedERC20Deposit([0, DEPOSIT_AMOUNT])).to.be.rejectedWith(
					ERROR.STRATEGY.INVALID_UTILIZED_ERC20_AMOUNT
				);
			});
		});

		describe("[SINGLE ERC20]", async () => {
			beforeEach(async () => {
				// Snapshot Total Supply
				b4TotalSupplyStrategy = await strategy.sharesTotal();

				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

				// Capture utilized ERC20
				utilizedERC20 = await strategy.utilizedERC20();

				// Set SI
				await strategy.iV1EMPERC20HandlerUpdate(eRC20Handler.address);

				await strategy.utilizedERC20DepositOpenUpdate(true);
			});


			describe("Expected Success", async () => {
				it("Should be able to deposit ERC20 into erc20 handler..", async () => {
					const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

					// APPROVE - SI contract to spend tokens on behalf of owner
					await mockERC20A.approve(eRC20Handler.address, DEPOSIT_AMOUNT);

					// DEPOSIT - ERC20 tokens into the strategy
					await expect(strategy.utilizedERC20Deposit([DEPOSIT_AMOUNT])).to.be.not.rejected;

					const { totalEthValue } = await utilStrategyTransfer.valueOfERC20Deposits([DEPOSIT_AMOUNT]);

					expect(await mockERC20A.balanceOf(eRC20Handler.address)).to.be.equal(totalEthValue);
				});

				it("Should issue strategy ERC20 tokens upon utilized ERC20 deposit..", async () => {
					const DEPOSIT_AMOUNTS: BigNumber[] = await utilStrategyTransfer.calculateERC20Required(
						ethers.utils.parseUnits("1", 18)
					);

					expect(DEPOSIT_AMOUNTS.length).to.be.equal(utilizedERC20.length);

					for (let i: number = 0; i < utilizedERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_IERC20, utilizedERC20[i]);

						// APPROVE - SI contract to spend tokens on behalf of owner
						await IERC20.approve(eRC20Handler.address, DEPOSIT_AMOUNTS[i]);
					}

					// DEPOSIT - ERC20 tokens into the strategy
					await strategy.utilizedERC20Deposit(DEPOSIT_AMOUNTS)

					// Get current supply
					const TOTAL_SUPPLY_STRATEGY: BigNumber = await strategy.sharesTotal();

					// Calculate minted amount
					const MINTED_STRATEGY_TOKENS: BigNumber = TOTAL_SUPPLY_STRATEGY.sub(b4TotalSupplyStrategy);

					// Get values
					const { totalEthValue } = await utilStrategyTransfer.valueOfERC20Deposits(DEPOSIT_AMOUNTS);

					// Expect that the owner received the strategy tokens
					expect(await strategy.eMP_shares(owner.address)).to.be.equal(MINTED_STRATEGY_TOKENS);

					// Expect that the strategy token amount issued is equal to the ETH value of the deposits
					expect(await strategy.eMP_shares(owner.address)).to.be.equal(totalEthValue);
				});
			});
		});

		describe("[MULTIPLE ERC20] - A 40%, B 25%, C 25%, D 10%", async () => {
			beforeEach(async () => {
				// Set strategy ERC20 tokens
				b4TotalSupplyStrategy = await strategy.sharesTotal();

				// Snapshot Total Supply
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

				// Capture utilized ERC20
				utilizedERC20 = await strategy.utilizedERC20();

				// Set SI
				await strategy.iV1EMPERC20HandlerUpdate(eRC20Handler.address);

				await strategy.utilizedERC20DepositOpenUpdate(true);
			});


			describe("Expected Failure", async () => {
				it("Should revert if invalid utilizedERC20Amounts passed..", async () => {
					const INVALID_DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits(".5", 18);

					// APPROVE - SI contract to spend tokens on behalf of owner
					await mockERC20A.approve(eRC20Handler.address, INVALID_DEPOSIT_AMOUNT);
					await mockERC20B.approve(eRC20Handler.address, INVALID_DEPOSIT_AMOUNT);
					await mockERC20C.approve(eRC20Handler.address, INVALID_DEPOSIT_AMOUNT);
					await mockERC20D.approve(eRC20Handler.address, INVALID_DEPOSIT_AMOUNT);

					// [main-test] Deposit ERC20 tokens into the strategy
					await expect(
						strategy.utilizedERC20Deposit(
							[
								INVALID_DEPOSIT_AMOUNT,
								INVALID_DEPOSIT_AMOUNT,
								INVALID_DEPOSIT_AMOUNT,
								INVALID_DEPOSIT_AMOUNT,
							]
						)
					).to.be.rejectedWith(
						ERROR.STRATEGY.INVALID_UTILIZED_ERC20_AMOUNT
					);
				});
			});

			describe("Expected Success", async () => {
				let depositAmounts: BigNumber[];


				beforeEach(async () => {
					depositAmounts = await utilStrategyTransfer.calculateERC20Required(ethers.utils.parseUnits("3", 18));

					expect(depositAmounts.length).to.be.equal(utilizedERC20.length);

					for (let i: number = 0; i < utilizedERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_IERC20, utilizedERC20[i]);

						// APPROVE - SI contract to spend tokens on behalf of owner
						await IERC20.approve(eRC20Handler.address, depositAmounts[i]);
					}

					// [main-test] Deposit ERC20 tokens into the strategy
					await expect(strategy.utilizedERC20Deposit(depositAmounts)).to.be.not.rejected;
				});


				it("Should be able to deposit ERC20s into erc20 handler..", async () => {
					for (let i: number = 0; i < utilizedERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_IERC20, utilizedERC20[i]);

						// [main-test] Check balances of Utilized ERC20 tokens
						expect(await IERC20.balanceOf(eRC20Handler.address)).to.be.equal(depositAmounts[i]);
					}
				});

				it("Should issue strategy ERC20 tokens upon utilized ERC20 deposit..", async () => {
					const { totalEthValue } = await utilStrategyTransfer.valueOfERC20Deposits(depositAmounts);

					// [main-test]
					expect(await strategy.eMP_shares(owner.address)).to.be.equal(totalEthValue);
				});
			});
		});
	});
});
