const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory, VoidSigner } from "ethers";

import { ERROR, PERCENT } from "../const";
import StrategyTransferUtil from "../util/StrategyTransferUtil";


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
		strategyTransferUtil: StrategyTransferUtil
	}[] = [];


	beforeEach("[beforeEach] Set up contracts..", async () => {
		[, , treasury, outsider] = await ethers.getSigners();


		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const V1EMP: ContractFactory = await ethers.getContractFactory("V1EMP");
		const V1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("V1EMPArrayUtility");
		const V1EMPDeployer: ContractFactory = await ethers.getContractFactory("V1EMPDeployer");
		const V1EMPRegistry: ContractFactory = await ethers.getContractFactory("V1EMPRegistry");
		const V1EMPStrategy: ContractFactory = await ethers.getContractFactory("V1EMPStrategy");
		const V1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("V1EMPStrategyDeployer");
		const V1EMPStrategyUtility: ContractFactory = await ethers.getContractFactory("V1EMPStrategyUtility");
		const V1EMPUtility: ContractFactory= await ethers.getContractFactory("V1EMPUtility");

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

		await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);

		eMPUtility = await (await V1EMPUtility.deploy(registry.address)).deployed();

		await registry.v1EMPUtilityUpdate(eMPUtility.address);

		eMPDeployer = await (await V1EMPDeployer.deploy(registry.address)).deployed();

		await registry.v1EMPDeployerUpdate(eMPDeployer.address);


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
		* EMP Strategies
		*/
		const deployStrategies = [
			{
				strategyUtilizedERC20: [mockERC20A.address, mockERC20B.address],
				strategyUtilization: [[true, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]]
			},
			{
				strategyUtilizedERC20: [mockERC20C.address],
				strategyUtilization: [[true, true, PERCENT.HUNDRED]],
			},
		];

		for (let i: number = 0; i < deployStrategies.length; i++)
		{
			// Deploy EMP Strategy
			await strategyDeployer.deployV1EMPStrategy();

			// Attach the deployed V1EMPStrategy address to variable
			let deployedV1EMPStrategy = await V1EMPStrategy.attach(
				String(await registry.v1EMPStrategyId_v1EMPStrategy(i + 1))
			);

			// Set the Strategy Interactor
			await deployedV1EMPStrategy.iV1EMPStrategyInteractorUpdate(strategyInteractor.address);

			await deployedV1EMPStrategy.utilizedERC20Update(
				deployStrategies[i].strategyUtilizedERC20,
				deployStrategies[i].strategyUtilization
			);

			// Enable Deposits and Withdraws
			await deployedV1EMPStrategy.utilizedERC20DepositOpenUpdate(true);

			expect(await deployedV1EMPStrategy.utilizedERC20DepositOpen()).to.be.true;

			await deployedV1EMPStrategy.utilizedERC20WithdrawOpenUpdate(true);

			expect(await deployedV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.true;

			strategies[i] = {
				contract: deployedV1EMPStrategy,
				strategyTransferUtil: new StrategyTransferUtil(deployedV1EMPStrategy, registry)
			};
		}


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
