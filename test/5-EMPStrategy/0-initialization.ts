import { expect } from "chai";
import { Contract, ContractFactory, VoidSigner } from "ethers";

import stageContracts, { suiteSpecificSetup } from "./stage-contracts-5";
import { ERROR, PERCENT } from "../../const";


const { ethers } = require("hardhat");


describe("[5.0] V1EMPStrategy.sol - Initialization", async () => {
	let eRC20Handler: Contract;
	let registry: Contract;
	let strategy: Contract;
	let strategyDeployer: Contract;

	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;

	let owner: VoidSigner;
	let manager: VoidSigner;
	let badActor: VoidSigner;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		(
			{
				registry,
				mockERC20A,
				mockERC20B,
				mockERC20C,
				strategyDeployer,
				owner,
				manager,
				badActor,
			} = await stageContracts()
		);

		({ eRC20Handler, strategy, } = await suiteSpecificSetup(registry, strategyDeployer, owner));
	});


	describe("function managerUpdate()", async () => {
		it("[auth] Should revert if an unauthorized sender calls..", async () => {
			await expect(strategy.connect(badActor).managerUpdate(badActor.address)).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
		});

		it("Should allow manager to be changed..", async () => {
			await expect(strategy.managerUpdate(manager.address)).to.be.not.rejected;

			expect(await strategy.manager()).to.be.equal(manager.address);
		});
	});

	describe("function utilizedERC20Update() (1/2)", async () => {
		describe("Expected Failure", async () => {
			it("[auth] Should revert if an unauthorized sender calls..", async () => {
				await expect(
					strategy.connect(badActor).utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]])
				).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});

			it("Should revert if different lengths for __utilizedERC20 and _utilizationERC2 passed..", async () => {
				await expect(strategy.utilizedERC20Update([mockERC20A.address], [])).to.be.rejectedWith(
					ERROR.STRATEGY.INVALID_PARAMS_UPDATE_LENGTHS
				);
			});

			it("Should revert if zero address passed as ERC20..", async () => {
				await expect(
					strategy.utilizedERC20Update([ethers.constants.AddressZero], [[true, true, PERCENT.HUNDRED]])
				).to.be.rejectedWith(ERROR.STRATEGY.INVALID_UTILIZED_ERC20);
			});

			it("Should revert if array contains duplicates..", async () => {
				await expect(
					strategy.utilizedERC20Update(
						[mockERC20A.address, mockERC20A.address],
						[
							[true, true, PERCENT.FIFTY],
							[true, true, PERCENT.FIFTY],
						]
					)
				).to.be.rejectedWith(
					ERROR.STRATEGY.INVALID_PARAMS_UPDATE_CONTAINS_DUPLICATES
				);
			});

			it("Should revert if no ETH Value provider set for the utilized ERC20..", async () => {
				const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");

				let mockERC20D: Contract = await (await MockERC20.deploy("Mock D", "D", 18)).deployed();

				await expect(
					strategy.utilizedERC20Update([mockERC20D.address], [[true, true, PERCENT.HUNDRED]])
				).to.be.rejectedWith(ERROR.STRATEGY.ERC20_NO_ETH_VALUE_PROVIDER_AVAILABLE);
			});

			it("Should revert when INVALID allocation passed..", async () => {
				const INVALID_ALLOCATION: StrategyUtilizedERC20Update[] = [
					{
						utilizedERC20: [mockERC20A.address],
						utilization: [[true, true, PERCENT.FIFTY]]
					},
					{
						utilizedERC20: [mockERC20A.address],
						utilization: [[true, false, PERCENT.FIFTY]]
					},
					{
						utilizedERC20: [mockERC20A.address],
						utilization: [[false, false, PERCENT.FIFTY]]
					},
					{
						utilizedERC20: [mockERC20A.address],
						utilization: [[false, true, PERCENT.HUNDRED]]
					},
					{
						utilizedERC20: [mockERC20A.address],
						utilization: [[false, false, PERCENT.HUNDRED]]
					},
					{
						utilizedERC20: [mockERC20A.address, mockERC20B.address],
						utilization: [[true, true, PERCENT.FIFTY], [true, true, PERCENT.TWENTY_FIVE]],
					},
					{
						utilizedERC20: [mockERC20A.address, mockERC20B.address],
						utilization: [[false, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]]
					},
				];

				for (let i: number = 0; i < INVALID_ALLOCATION.length; i++)
				{
					const V1EMPStrategy: ContractFactory = await ethers.getContractFactory("V1EMPStrategy");

					const _YSS = await V1EMPStrategy.attach(
						String(await registry.v1EMPStrategyId_v1EMPStrategy(await registry.v1EMPStrategyIdTracker()))
					);

					await expect(
						_YSS.utilizedERC20Update(INVALID_ALLOCATION[i].utilizedERC20, INVALID_ALLOCATION[i].utilization)
					).to.be.rejectedWith(
						ERROR.STRATEGY.INVALID_ERC20_ALLOCATION_TOTAL
					);
				}
			});
		});

		describe("Expected Success", async () => {
			it("Should not revert when VALID allocation passed..", async () => {
				const VALID_INPUTS: StrategyUtilizedERC20Update[] = [
					{
						utilizedERC20: [mockERC20A.address],
						utilization: [[true, true, PERCENT.HUNDRED]]
					},
					{
						utilizedERC20: [mockERC20A.address, mockERC20B.address, mockERC20C.address],
						utilization: [[false, true, PERCENT.ZERO], [true, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]],
					},
					// Even if withdraw token is set to 100% it should be accepted
					{
						utilizedERC20: [mockERC20A.address, mockERC20B.address, mockERC20C.address],
						utilization: [
							[false, true, PERCENT.HUNDRED],
							[true, true, PERCENT.FIFTY],
							[true, true, PERCENT.FIFTY],
						]
					},
				];

				for (let i: number = 0; i < VALID_INPUTS.length; i++)
				{
					const INPUT = VALID_INPUTS[i];

					// Deploy a temporary contract
					const V1EMPStrategy: ContractFactory = await ethers.getContractFactory("V1EMPStrategy");

					const _YSS = await V1EMPStrategy.attach(
						String(await registry.v1EMPStrategyId_v1EMPStrategy(await registry.v1EMPStrategyIdTracker()))
					);

					await expect(_YSS.utilizedERC20Update(INPUT.utilizedERC20, INPUT.utilization)).to.be.not.rejected;

					/**
					* NOTE: The array is expected to be reordered by this point so this test will have to map the VALID_INPUT
					* to what is in the array returned from the Contract. There is a chance that this test will fail.
					*/

					const utilizedERC20 = await _YSS.utilizedERC20();

					await expect(utilizedERC20.length).to.be.equal(INPUT.utilizedERC20.length);

					// Validate allocation
					for (let ii: number = 0; ii < INPUT.utilizedERC20.length; ii++)
					{
						const allocation = await _YSS.utilizedERC20_utilizationERC20(INPUT.utilizedERC20[ii]);

						expect(INPUT.utilization[ii][0]).to.be.equal(allocation[0]);
						expect(INPUT.utilization[ii][1]).to.be.equal(allocation[1]);

						expect(allocation[2].eq(INPUT.utilization[ii][2])).to.be.true;
					}
				}
			});
		});
	});

	describe("function iERC20HandlerUpdate() (1/2)", async () => {

		/**
		 * @notice
		 * This is split up because the next tests for Deposits/Withdrawals update FNs is dependant on the SI to be
		 * set. Part 2 is dependant the Deposits/Withdrawals update to be functional.
		*/

		describe("Expected Failure", async () => {
			it(
				"[auth] Should revert if an unauthorized sender calls..",
				async () => {
					await expect(
						strategy.connect(badActor).iERC20HandlerUpdate(eRC20Handler.address)
					).to.be.rejectedWith(
						ERROR.NOT_AUTHORIZED
					);
				}
			);

			it(
				"Should revert if address(0) passed..",
				async () => {
					await expect(
						strategy.iERC20HandlerUpdate(ethers.constants.AddressZero)
					).to.be.rejectedWith(
						ERROR.STRATEGY.INVALID_ERC20_HANDLER
					);
				}
			);
		});

		describe("Expected Success", async () => {
			it(
				"Should be able to set iERC20Handler..",
				async () => {
					await strategy.iERC20HandlerUpdate(eRC20Handler.address);

					expect(await strategy.iERC20Handler()).to.be.equal(eRC20Handler.address);
				}
			);
		});
	});

	describe("function utilizedERC20DepositOpenUpdate()", async () => {
		it("[auth] Should revert if an unauthorized sender calls..", async () => {
			await expect(strategy.connect(badActor).utilizedERC20DepositOpenUpdate(true)).to.be.rejectedWith(
				ERROR.NOT_AUTHORIZED
			);
		});

		it("[modifier] Should revert if ERC20 Handler is not set..", async () => {
			await expect(strategy.utilizedERC20DepositOpenUpdate(true)).to.be.rejectedWith(ERROR.STRATEGY.ERC20_HANDLER_NOT_SET);
		});

		it("Should set utilizedERC20DepositOpen to true..", async () => {
			// Set strategy ERC20 tokens
			await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

			// Set SI
			await strategy.iERC20HandlerUpdate(eRC20Handler.address);

			expect(await strategy.utilizedERC20DepositOpen()).to.be.false;

			await expect(strategy.utilizedERC20DepositOpenUpdate(true)).to.be.not.rejected;

			expect(await strategy.utilizedERC20DepositOpen()).to.be.true;
		});
	});

	describe("function utilizedERC20WithdrawOpenUpdate()", async () => {
		it("[auth] Should revert if an unauthorized sender calls..", async () => {
			await expect(
				strategy.connect(badActor).utilizedERC20WithdrawOpenUpdate(true)
			).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
		});

		it("[modifier] Should revert if ERC20 Handler is not set..", async () => {
			await expect(strategy.utilizedERC20WithdrawOpenUpdate(true)).to.be.rejectedWith(
				ERROR.STRATEGY.ERC20_HANDLER_NOT_SET
			);
		});

		it("Should set utilizedERC20WithdrawOpen to true..", async () => {
			// Set strategy ERC20 tokens
			await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

			// Set SI
			await strategy.iERC20HandlerUpdate(eRC20Handler.address);

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.false;

			await expect(strategy.utilizedERC20WithdrawOpenUpdate(true)).to.be.not.rejected;

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.true;
		});
	});

	describe("function utilizedERC20Update() (2/2)", async () => {
		beforeEach(async () => {
			// Set strategy ERC20 tokens
			await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

			// Set SI
			await strategy.iERC20HandlerUpdate(eRC20Handler.address);

			expect(await strategy.utilizedERC20DepositOpen()).to.be.false;

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.false;
		});


		it("Should not be able to set update utilized ERC20 when utilizedERC20DepositOpen is true..", async () => {
			await strategy.utilizedERC20DepositOpenUpdate(true);

			await expect(
				strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]])
			).to.be.rejectedWith(
				ERROR.STRATEGY.UTILIZED_ERC20_TRANSFERS_OPEN
			);
		});
	});

	describe("function iERC20HandlerUpdate() (2/2)", async () => {
		beforeEach(async () => {
			// Set strategy ERC20 tokens
			await strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

			// Set SI
			await strategy.iERC20HandlerUpdate(eRC20Handler.address);

			expect(await strategy.utilizedERC20DepositOpen()).to.be.false;

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.false;
		});


		it("Should not be able to set iERC20Handler when utilizedERC20DepositOpen is true..", async () => {
			await expect(strategy.utilizedERC20DepositOpenUpdate(true)).to.be.not.rejected;

			await expect(strategy.iERC20HandlerUpdate(eRC20Handler.address)).to.be.rejectedWith(
				ERROR.STRATEGY.UTILIZED_ERC20_TRANSFERS_OPEN
			);
		});

		it("Should not be able to set iERC20Handler when utilizedERC20WithdrawOpen is true..", async () => {
			await expect(strategy.utilizedERC20WithdrawOpenUpdate(true)).to.be.not.rejected;

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.true;

			await expect(strategy.iERC20HandlerUpdate(eRC20Handler.address)).to.be.rejectedWith(
				ERROR.STRATEGY.UTILIZED_ERC20_TRANSFERS_OPEN
			);
		});
	});
});
