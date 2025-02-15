import { expect } from "chai";
import { Contract, ContractFactory, VoidSigner } from "ethers";

import stageContracts from "./stage-contracts-7";
import { ERROR, PERCENT } from "../../const";


const { ethers } = require("hardhat");


describe("[7.0] V1EMP.sol - Initialization", async () => {
	let eMP: Contract;
	let eMPUtility: Contract;
	let registry: Contract;
	let eRC20A: Contract;
	let eRC20C: Contract;

	let badActor: VoidSigner;

	let eMPs: TestEMP[] = [];
	let strategies: TestStrategy[] = [];


	beforeEach("[beforeEach] Set up contracts..", async () => {
		({ eMPs, eMPUtility, eRC20A, eRC20C, badActor, registry, strategies, } = await stageContracts());

		eMP = eMPs[2].contract;

		await eMP.utilizedERC20DepositOpenUpdate(false);
		await eMP.utilizedERC20WithdrawOpenUpdate(false);
	});


	describe("function managerUpdate()", async () => {
		describe("Expected Failure", async () => {
			it("[auth] Should revert if an unauthorized sender calls..", async () => {
				await expect(eMP.connect(badActor).managerUpdate(badActor.address)).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
			});
		});

		describe("Expected Success", async () => {
			it("Should update manager..", async () => {
				await expect(eMP.managerUpdate(badActor.address)).to.be.not.rejected;

				expect(await eMP.manager()).to.be.equal(badActor.address);
			});
		});
	});

	describe("function feeRateManagerUpdate() (1/2)", async () => {
		describe("Expected Failure", async () => {
			it("[auth] Should revert if an unauthorized sender calls..", async () => {
				await expect(eMP.connect(badActor).feeRateManagerUpdate(badActor.address)).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});

			it("Should NOT allow greater than 100% fee rate..", async () => {
				const ONE_HUNDRED_PERCENT = await registry.ONE_HUNDRED_PERCENT();

				await expect(
					eMP.feeRateManagerUpdate(ONE_HUNDRED_PERCENT.add(1))
				).to.be.rejectedWith(
					ERROR.EMP.FEE_RATE_MANAGER_GREATER_THAN_100_PERCENT
				);
			});
		});

		describe("Expected Success", async () => {
			it("Should allow feeRateManager to be changed..", async () => {
				await expect(eMP.feeRateManagerUpdate(1)).to.be.not.rejected;

				expect(await eMP.feeRateManager()).to.be.equal(1);
			});
		});
	});

	describe("function feeRateGovernanceUpdate() (1/2)", async () => {
		describe("Expected Failure", async () => {
			it("[auth] Should revert if an unauthorized sender calls..", async () => {
				await expect(eMP.connect(badActor).feeRateGovernanceUpdate(badActor.address)).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});

			it("Should NOT allow greater than 100% fee rate..", async () => {
				const ONE_HUNDRED_PERCENT = await registry.ONE_HUNDRED_PERCENT();

				await expect(
					eMP.feeRateGovernanceUpdate(ONE_HUNDRED_PERCENT.add(1))
				).to.be.rejectedWith(
					ERROR.EMP.FEE_RATE_GOVERNANCE_GREATER_THAN_100_PERCENT
				);
			});
		});

		describe("Expected Success", async () => {
			it("Should allow feeRateManager to be changed..", async () => {
				await expect(eMP.feeRateGovernanceUpdate(1)).to.be.not.rejected;

				expect(await eMP.feeRateGovernance()).to.be.equal(1);
			});
		});
	});

	describe("function feeRateManagerUpdate() (2/2)", async () => {
		describe("Expected Failure", async () => {
			it("Should NOT allow combined fees to be greater than 100% fee rate..", async () => {
				await eMP.feeRateGovernanceUpdate(ethers.utils.parseUnits(".5", 4));

				await expect(eMP.feeRateManagerUpdate(ethers.utils.parseUnits("1", 4))).to.be.rejectedWith(
					ERROR.EMP.FEE_RATE_MANAGER_GREATER_THAN_100_PERCENT
				);
			});
		});
	});

	describe("function feeRateGovernanceUpdate() (2/2)", async () => {
		describe("Expected Failure", async () => {
			it("Should NOT allow combined fees to be greater than 100% fee rate..", async () => {
				await eMP.feeRateManagerUpdate(ethers.utils.parseUnits(".5", 4));

				await expect(eMP.feeRateGovernanceUpdate(ethers.utils.parseUnits("1", 4))).to.be.rejectedWith(
					ERROR.EMP.FEE_RATE_GOVERNANCE_GREATER_THAN_100_PERCENT
				);
			});
		});
	});

	describe("function utilizedV1EMPStrategyUpdate() (1/2)", async () => {
		describe("Expected Failure", async () => {
			it("[auth] Should revert if an unauthorized sender calls..", async () => {
				await expect(eMP.connect(badActor).utilizedV1EMPStrategyUpdate([], [])).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});

			it("Should NOT allow invalid strategies to be set..", async () => {
				const V1EMPStrategy: ContractFactory = await ethers.getContractFactory("V1EMPStrategy");

				// Deploy a temporary contract
				const invalidStrategy = await V1EMPStrategy.deploy(badActor.address, registry.address);

				await expect(
					eMP.utilizedV1EMPStrategyUpdate(
						[invalidStrategy.address] as UtilizedEMPStrategyUpdate,
						[PERCENT.HUNDRED] as UtilizedEMPStrategyAllocationUpdate
					)
				).to.be.rejectedWith(ERROR.EMP_UTILITY.INVALID_V1_EMP_STRATEGY);
			});

			it("Should NOT allow strategies that add up to more than 100% to EMP..", async () => {
				await expect(
					eMP.utilizedV1EMPStrategyUpdate(
						[strategies[0].contract.address, strategies[1].contract.address] as UtilizedEMPStrategyUpdate,
						[PERCENT.HUNDRED, PERCENT.FIFTY] as UtilizedEMPStrategyAllocationUpdate
					)
				).to.be.rejectedWith(
					ERROR.EMP_UTILITY.UTILIZED_V1_EMP_STRATEGY_INVALID_ALLOCATION
				);
			});
		});

		describe("Expected Success", async () => {
			it("Should allow attaching Strategy to EMP..", async () => {
				const UtilizedEMPStrategy: UtilizedEMPStrategyUpdate = [strategies[0].contract.address];

				const UtilizedEMPStrategyAllocation: UtilizedEMPStrategyAllocationUpdate = [PERCENT.HUNDRED];

				await eMP.utilizedV1EMPStrategyUpdate(UtilizedEMPStrategy, UtilizedEMPStrategyAllocation);

				const _strategies: UtilizedEMPStrategy[] = await eMP.utilizedV1EMPStrategy();

				expect(_strategies.length).to.be.equal(UtilizedEMPStrategy.length);

				let found = 0;

				for (let i: number = 0; i < UtilizedEMPStrategy.length; i++)
				{
					expect(await eMP.utilizedV1EMPStrategy_allocation(UtilizedEMPStrategy[i])).to.be.equal(
						UtilizedEMPStrategyAllocation[i]
					);

					for (let ii = 0; ii < _strategies.length; ii++)
					{
						if (String(UtilizedEMPStrategy[i]) == String(_strategies[ii]))
						{
							found++;
						}
					}
				}

				expect(found).to.be.equal(_strategies.length);
			});

			it("Should allow attaching multiple Strategies to EMP..", async () => {
				const UtilizedEMPStrategy: UtilizedEMPStrategyUpdate = [
					strategies[0].contract.address,
					strategies[1].contract.address,
				];

				const UtilizedEMPStrategyAllocation: UtilizedEMPStrategyAllocationUpdate = [PERCENT.FIFTY, PERCENT.FIFTY];

				await eMP.utilizedV1EMPStrategyUpdate(UtilizedEMPStrategy, UtilizedEMPStrategyAllocation);

				const _strategies: UtilizedEMPStrategy[] = await eMP.utilizedV1EMPStrategy();

				expect(_strategies.length).to.be.equal(UtilizedEMPStrategy.length);

				let found = 0;

				for (let i: number = 0; i < UtilizedEMPStrategy.length; i++)
				{
					expect(await eMP.utilizedV1EMPStrategy_allocation(UtilizedEMPStrategy[i])).to.be.equal(
						UtilizedEMPStrategyAllocation[i]
					);

					for (let ii = 0; ii < _strategies.length; ii++)
					{
						if (String(UtilizedEMPStrategy[i]) == String(_strategies[ii]))
						{
							found++;
						}
					}
				}

				expect(found).to.be.equal(_strategies.length);
			});

			it("Should allow EMP to have zero strategies again after settings before..", async () => {
				const UtilizedEMPStrategy: UtilizedEMPStrategyUpdate = [
					strategies[0].contract.address,
					strategies[1].contract.address,
				];

				const UtilizedEMPStrategyAllocation: UtilizedEMPStrategyAllocationUpdate = [PERCENT.FIFTY, PERCENT.FIFTY];

				await eMP.utilizedV1EMPStrategyUpdate(UtilizedEMPStrategy, UtilizedEMPStrategyAllocation);

				await eMP.utilizedV1EMPStrategyUpdate([], []);

				const _strategiesAfter: UtilizedEMPStrategy[] = await eMP.utilizedV1EMPStrategy();

				expect(_strategiesAfter.length).to.be.equal(0);
			});
		});
	});

	describe("function utilizedV1EMPStrategySync()", async () => {
		let eMPUtilizedERC20: string[];


		beforeEach(async () => {
			// Set the utilzation to 2 different strategies
			await eMP.utilizedV1EMPStrategyUpdate(
				[strategies[0].contract.address, strategies[1].contract.address] as UtilizedEMPStrategyUpdate,
				[PERCENT.FIFTY, PERCENT.FIFTY] as UtilizedEMPStrategyAllocationUpdate
			);

			eMPUtilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMP.address);

			expect(eMPUtilizedERC20.length).to.be.equal(3);

			await strategies[0].contract.utilizedERC20DepositOpenUpdate(false);

			await strategies[0].contract.utilizedERC20WithdrawOpenUpdate(false);

			await strategies[0].contract.utilizedERC20Update([eRC20A.address], [[true, true, PERCENT.HUNDRED]]);

			await expect(eMP.utilizedV1EMPStrategySync()).to.be.not.reverted;
		});

		describe("Expected Success", async () => {
			it("Should update the utilized ERC20..", async () => {
				await expect(eMP.utilizedV1EMPStrategySync()).to.be.not.reverted;

				eMPUtilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMP.address);

				expect(eMPUtilizedERC20.length).to.be.equal(2);

				expect(
					(await eMPUtility.v1EMP_utilizedERC20_utilizationERC20(eMP.address, eRC20A.address)).allocation
				).to.be.equal(
					PERCENT.FIFTY
				);

				expect(
					(await eMPUtility.v1EMP_utilizedERC20_utilizationERC20(eMP.address, eRC20C.address)).allocation
				).to.be.equal(
					PERCENT.FIFTY
				);
			});
		});
	});

	describe("function utilizedV1EMPStrategyUpdate() (2/2)", async () => {
		describe("[indirect-call] function utilizedV1EMPStrategySync() - Utilized ERC20 tokens changed..", async () => {
			let eMPUtilizedERC20: string[];


			beforeEach(async () => {
				eMPUtilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMP.address);

				// Expect that there are no utilized ERC20 tokens
				expect(eMPUtilizedERC20.length).to.be.equal(0);

				// Set the utilzation to 2 different strategies
				await eMP.utilizedV1EMPStrategyUpdate(
					[strategies[0].contract.address, strategies[1].contract.address] as UtilizedEMPStrategyUpdate,
					[PERCENT.FIFTY, PERCENT.FIFTY] as UtilizedEMPStrategyAllocationUpdate
				);

				// Store the utilized ERC20 tokens
				eMPUtilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMP.address);
			});


			it("Should update EMP's utilizedERC20 array to be a union of the strategy's utilizedERC20s..", async () => {
				// Store the utilized ERC20 tokens
				expect(eMPUtilizedERC20.length).to.be.greaterThan(0);

				expect(eMPUtilizedERC20.length).to.be.equal(3);
			});
		});
	});
});
