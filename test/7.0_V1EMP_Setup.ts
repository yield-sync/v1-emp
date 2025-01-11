const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory, VoidSigner } from "ethers";

import { ERROR, PERCENT } from "../const";
import UtilStrategyTransfer from "../util/UtilStrategyTransfer";
import { approveTokens, deployContract, deployEMP, deployStrategies } from "../util/UtilEMP";


describe("[7.0] V1EMP.sol - Setup", async () => {
	let arrayUtility: Contract;
	let governance: Contract;
	let eTHValueFeed: Contract;
	let eTHValueFeedC: Contract;
	let eMP: Contract;
	let eMPDeployer: Contract;
	let eMPUtility: Contract;
	let registry: Contract;
	let strategyDeployer: Contract;
	let strategyUtility: Contract;
	let strategyInteractor: Contract;

	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;

	let treasury: VoidSigner;
	let outsider: VoidSigner;

	let strategies: {
		contract: Contract,
		UtilStrategyTransfer: UtilStrategyTransfer
	}[] = [];


	beforeEach("[beforeEach] Set up contracts..", async () => {
		[, , treasury, outsider] = await ethers.getSigners();

		const V1EMP: ContractFactory = await ethers.getContractFactory("V1EMP");

		// Core contracts
		governance = await deployContract("@yield-sync/governance/contracts/YieldSyncGovernance.sol:YieldSyncGovernance");

		await governance.payToUpdate(treasury.address);

		arrayUtility = await deployContract("V1EMPArrayUtility");

		registry = await deployContract("V1EMPRegistry", [governance.address]);

		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

		strategyUtility = await deployContract("V1EMPStrategyUtility", [registry.address]);

		await registry.v1EMPStrategyUtilityUpdate(strategyUtility.address);

		strategyDeployer = await deployContract("V1EMPStrategyDeployer", [registry.address]);

		await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);

		eMPUtility = await deployContract("V1EMPUtility", [registry.address]);

		await registry.v1EMPUtilityUpdate(eMPUtility.address);

		eMPDeployer = await deployContract("V1EMPDeployer", [registry.address]);

		await registry.v1EMPDeployerUpdate(eMPDeployer.address);

		mockERC20A = await deployContract("MockERC20", ["Mock A", "A", 18]);
		mockERC20B = await deployContract("MockERC20", ["Mock B", "B", 18]);
		mockERC20C = await deployContract("MockERC20", ["Mock C", "C", 6]);

		eTHValueFeed = await deployContract("ETHValueFeedDummy", [18]);
		eTHValueFeedC = await deployContract("ETHValueFeedDummy", [6]);

		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20A.address, eTHValueFeed.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20B.address, eTHValueFeed.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20C.address, eTHValueFeedC.address);

		/**
		* EMP Strategies
		*/
		strategies = await deployStrategies(
			registry,
			strategyDeployer,
			[
				{
					strategyUtilizedERC20: [mockERC20A.address, mockERC20B.address],
					strategyUtilization: [[true, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]],
				},
				{
					strategyUtilizedERC20: [mockERC20C.address],
					strategyUtilization: [[true, true, PERCENT.HUNDRED]],
				},
			],
		);

		const strategyInteractor = await deployContract("SimpleV1EMPStrategyInteractor", [strategies[0].contract.address]);
		const strategyInteractor2 = await deployContract("SimpleV1EMPStrategyInteractor", [strategies[1].contract.address]);

		await strategies[0].contract.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);
		await strategies[1].contract.iV1EMPStrategyInteractorUpdate(strategyInteractor2.address);

		await strategies[0].contract.utilizedERC20DepositOpenUpdate(true);
		await strategies[0].contract.utilizedERC20WithdrawOpenUpdate(true);

		await strategies[1].contract.utilizedERC20DepositOpenUpdate(true);
		await strategies[1].contract.utilizedERC20WithdrawOpenUpdate(true);

		/**
		* EMP
		*/
		// Deploy an EMP
		await eMPDeployer.deployV1EMP(false, "EMP Name", "EMP");

		// Verify that a EMP has been registered
		expect(await registry.v1EMPId_v1EMP(1)).to.be.not.equal(ethers.constants.AddressZero);

		// Attach the deployed EMP address to a variable
		eMP = await V1EMP.attach(String(await registry.v1EMPId_v1EMP(1)));
	});


	describe("function managerUpdate()", async () => {
		describe("Expected Failure", async () => {
			it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
				await expect(eMP.connect(outsider).managerUpdate(outsider.address)).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
			});
		});

		describe("Expected Success", async () => {
			it("Should update manager..", async () => {
				await expect(eMP.managerUpdate(outsider.address)).to.be.not.rejected;

				expect(await eMP.manager()).to.be.equal(outsider.address);
			});
		});
	});

	describe("function feeRateManagerUpdate() (1/2)", async () => {
		describe("Expected Failure", async () => {
			it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
				await expect(eMP.connect(outsider).feeRateManagerUpdate(outsider.address)).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});

			it("Should NOT allow greater than 100% fee rate..", async () => {
				const ONE_HUNDRED_PERCENT = await registry.ONE_HUNDRED_PERCENT();

				await expect(
					eMP.feeRateManagerUpdate(ONE_HUNDRED_PERCENT.add(ethers.utils.parseUnits("1", 18)))
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
			it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
				await expect(eMP.connect(outsider).feeRateGovernanceUpdate(outsider.address)).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});

			it("Should NOT allow greater than 100% fee rate..", async () => {
				const ONE_HUNDRED_PERCENT = await registry.ONE_HUNDRED_PERCENT();

				await expect(
					eMP.feeRateGovernanceUpdate(ONE_HUNDRED_PERCENT.add(ethers.utils.parseUnits("1", 18)))
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
				await eMP.feeRateGovernanceUpdate(ethers.utils.parseUnits(".5", 18));

				await expect(
					eMP.feeRateManagerUpdate(ethers.utils.parseUnits("1", 18))
				).to.be.rejectedWith(
					ERROR.EMP.FEE_RATE_MANAGER_GREATER_THAN_100_PERCENT
				);
			});
		});
	});

	describe("function feeRateGovernanceUpdate() (2/2)", async () => {
		describe("Expected Failure", async () => {
			it("Should NOT allow combined fees to be greater than 100% fee rate..", async () => {
				await eMP.feeRateManagerUpdate(ethers.utils.parseUnits(".5", 18));

				await expect(
					eMP.feeRateGovernanceUpdate(ethers.utils.parseUnits("1", 18))
				).to.be.rejectedWith(
					ERROR.EMP.FEE_RATE_GOVERNANCE_GREATER_THAN_100_PERCENT
				);
			});
		});
	});

	describe("function utilizedV1EMPStrategyUpdate() (1/2)", async () => {
		describe("Expected Failure", async () => {
			it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
				await expect(eMP.connect(outsider).utilizedV1EMPStrategyUpdate([], [])).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});

			it("Should NOT allow invalid strategies to be set..", async () => {
				const V1EMPStrategy: ContractFactory = await ethers.getContractFactory("V1EMPStrategy");

				// Deploy a temporary contract
				const invalidStrategy = await V1EMPStrategy.deploy(outsider.address, registry.address);

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
		});
	});

	describe("function utilizedStrategySync()", async () => {
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

			await strategies[0].contract.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

			await expect(eMP.utilizedStrategySync()).to.be.not.reverted;
		});

		describe("Expected Success", async () => {
			it("Should update the utilized ERC20..", async () => {
				await expect(eMP.utilizedStrategySync()).to.be.not.reverted;

				eMPUtilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMP.address);

				expect(eMPUtilizedERC20.length).to.be.equal(2);

				expect(
					(await eMPUtility.v1EMP_utilizedERC20_utilizationERC20(eMP.address, mockERC20A.address)).allocation
				).to.be.equal(
					PERCENT.FIFTY
				);

				expect(
					(await eMPUtility.v1EMP_utilizedERC20_utilizationERC20(eMP.address, mockERC20C.address)).allocation
				).to.be.equal(
					PERCENT.FIFTY
				);
			});
		});
	});

	describe("function utilizedV1EMPStrategyUpdate() (2/2)", async () => {
		describe("[indirect-call] function utilizedStrategySync() - Utilized ERC20 tokens changed..", async () => {
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
