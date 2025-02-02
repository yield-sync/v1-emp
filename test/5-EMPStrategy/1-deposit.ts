import { expect } from "chai";
import { BigNumber, Contract, VoidSigner } from "ethers";

import stageContracts, { suiteSpecificSetup } from "./stage-contracts-5";
import { ERROR, PERCENT } from "../../const";
import UtilStrategyTransfer from "../../util/UtilStrategyTransfer";


const { ethers } = require("hardhat");


const LOCATION_IERC20: string = "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20";


describe("[5.1] V1EMPStrategy.sol - Depositing Tokens", async () => {
	let eTHValueProvider: Contract;
	let eRC20Handler: Contract;
	let registry: Contract;
	let strategy: Contract;
	let strategyDeployer: Contract;
	let eRC20A: Contract;
	let eRC20B: Contract;
	let eRC20C: Contract;
	let eRC20D: Contract;

	let utilStrategyTransfer: UtilStrategyTransfer;

	let owner: VoidSigner;
	let badActor: VoidSigner;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		(
			{
				registry,
				eTHValueProvider,
				strategyDeployer,
				eRC20A,
				eRC20B,
				eRC20C,
				eRC20D,
				owner,
				badActor,
			} = await stageContracts()
		);

		({ eRC20Handler, strategy, utilStrategyTransfer, } = await suiteSpecificSetup(registry, strategyDeployer, owner));
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
				await strategy.utilizedERC20Update([eRC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await strategy.iERC20HandlerUpdate(eRC20Handler.address);

				await expect(strategy.connect(badActor).utilizedERC20Deposit([])).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});
		});

		describe("Expected Failure", async () => {
			it("Should revert if deposits not open..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([eRC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await strategy.iERC20HandlerUpdate(eRC20Handler.address);

				const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

				// APPROVE - ERC20Handler contract to spend tokens on behalf of owner
				await eRC20A.approve(eRC20Handler.address, DEPOSIT_AMOUNT);

				// [main-test] Deposit ERC20 tokens into the strategy
				await expect(
					strategy.utilizedERC20Deposit([DEPOSIT_AMOUNT, DEPOSIT_AMOUNT])
				).to.rejectedWith(ERROR.STRATEGY.DEPOSIT_NOT_OPEN);
			});

			it("Should revert if invalid length _utilizedERC20Amount passed..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([eRC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await strategy.iERC20HandlerUpdate(eRC20Handler.address);

				await strategy.utilizedERC20DepositOpenUpdate(true);

				await expect(strategy.utilizedERC20Deposit([])).to.be.rejectedWith(
					ERROR.STRATEGY.INVALID_PARAMS_DEPOSIT_LENGTH
				);
			});

			it("Should revert if denominator is 0..", async () => {
				// Set strategy ERC20 tokens
				await strategy.utilizedERC20Update([eRC20A.address], [[true, true, PERCENT.HUNDRED]]);

				await strategy.iERC20HandlerUpdate(eRC20Handler.address);

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
					[eRC20A.address, eRC20B.address],
					[[true, true, PERCENT.HUNDRED], [false, true, PERCENT.HUNDRED]]
				);

				await strategy.iERC20HandlerUpdate(eRC20Handler.address);

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
					[eRC20A.address, eRC20B.address],
					[[true, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]]
				);

				await strategy.iERC20HandlerUpdate(eRC20Handler.address);

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
				await strategy.utilizedERC20Update([eRC20A.address], [[true, true, PERCENT.HUNDRED]]);

				// Capture utilized ERC20
				utilizedERC20 = await strategy.utilizedERC20();

				// Set ERC20Handler
				await strategy.iERC20HandlerUpdate(eRC20Handler.address);

				await strategy.utilizedERC20DepositOpenUpdate(true);
			});


			describe("Expected Success", async () => {
				it("Should be able to deposit ERC20 into erc20 handler..", async () => {
					const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);

					// APPROVE - ERC20Handler contract to spend tokens on behalf of owner
					await eRC20A.approve(eRC20Handler.address, DEPOSIT_AMOUNT);

					// DEPOSIT - ERC20 tokens into the strategy
					await expect(strategy.utilizedERC20Deposit([DEPOSIT_AMOUNT])).to.be.not.rejected;

					const { totalEthValue } = await utilStrategyTransfer.valueOfERC20Deposits([DEPOSIT_AMOUNT]);

					expect(await eRC20A.balanceOf(eRC20Handler.address)).to.be.equal(totalEthValue);
				});

				it("Should issue strategy ERC20 tokens upon utilized ERC20 deposit..", async () => {
					const DEPOSIT_AMOUNTS: BigNumber[] = await utilStrategyTransfer.calculateERC20Required(
						ethers.utils.parseUnits("1", 18)
					);

					expect(DEPOSIT_AMOUNTS.length).to.be.equal(utilizedERC20.length);

					for (let i: number = 0; i < utilizedERC20.length; i++)
					{
						const IERC20 = await ethers.getContractAt(LOCATION_IERC20, utilizedERC20[i]);

						// APPROVE - ERC20Handler contract to spend tokens on behalf of owner
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
						eRC20A.address,
						eRC20B.address,
						eRC20C.address,
						eRC20D.address,
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

				// Set ERC20Handler
				await strategy.iERC20HandlerUpdate(eRC20Handler.address);

				await strategy.utilizedERC20DepositOpenUpdate(true);
			});


			describe("Expected Failure", async () => {
				it("Should revert if invalid utilizedERC20Amounts passed..", async () => {
					const INVALID_DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits(".5", 18);

					// APPROVE - ERC20Handler contract to spend tokens on behalf of owner
					await eRC20A.approve(eRC20Handler.address, INVALID_DEPOSIT_AMOUNT);
					await eRC20B.approve(eRC20Handler.address, INVALID_DEPOSIT_AMOUNT);
					await eRC20C.approve(eRC20Handler.address, INVALID_DEPOSIT_AMOUNT);
					await eRC20D.approve(eRC20Handler.address, INVALID_DEPOSIT_AMOUNT);

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

						// APPROVE - ERC20Handler contract to spend tokens on behalf of owner
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
