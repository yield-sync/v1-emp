const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory, VoidSigner } from "ethers";

import { ERROR, PERCENT } from "../const";
import StrategyTransferUtil from "../scripts/StrategyTransferUtil";


describe("[6.0] V1EMP.sol - Setup", async () => {
	let arrayUtility: Contract;
	let governance: Contract;
	let eTHValueFeed: Contract;
	let eMP: Contract;
	let eMPDeployer: Contract;
	let eMPUtility: Contract;
	let registry: Contract;
	let strategyDeployer: Contract;
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
		/**
		* @notice
		* This beforeEach process does the following:
		* 1) Deploy a registry
		* 2) SEt the utilized tokens for the strats
		* 3) Deploys an EMP Deployer and registers it on the registry
		* 4) Attach the deployed EMP to a local variable (for accessing fn.)
		* 5) Deploy 2 strategies and make them fully operational by doing the following:
		* 	a) Attach the deployed EMP Strategy to a local variable
		* 	b) Set the ETH Value feed
		* 	c) Set the strategy interactor
		* 	d) Set the tokens for the strategy
		* 	e) Toggle on the withdrawals and depositing of tokens
		* 	f) Set the strategyTransferUtil for strategy
		*/
		[, , treasury, outsider] = await ethers.getSigners();


		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const V1EMP: ContractFactory = await ethers.getContractFactory("V1EMP");
		const V1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("V1EMPArrayUtility");
		const V1EMPDeployer: ContractFactory = await ethers.getContractFactory("V1EMPDeployer");
		const V1EMPRegistry: ContractFactory = await ethers.getContractFactory("V1EMPRegistry");
		const V1EMPStrategy: ContractFactory = await ethers.getContractFactory("V1EMPStrategy");
		const V1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("V1EMPStrategyDeployer");
		const V1EMPAmountsValidator: ContractFactory= await ethers.getContractFactory("V1EMPAmountsValidator");

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");


		// Core contracts
		governance = await (await YieldSyncGovernance.deploy()).deployed();

		await governance.payToUpdate(treasury.address);

		arrayUtility = await (await V1EMPArrayUtility.deploy()).deployed();

		registry = await (await V1EMPRegistry.deploy(governance.address)).deployed();

		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

		strategyDeployer = await (await V1EMPStrategyDeployer.deploy(registry.address)).deployed();

		await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);

		eMPUtility = await (await V1EMPAmountsValidator.deploy(registry.address)).deployed();

		await registry.v1EMPAmountsValidatorUpdate(eMPUtility.address);

		eMPDeployer = await (await V1EMPDeployer.deploy(registry.address)).deployed();

		await registry.v1EMPDeployerUpdate(eMPDeployer.address);


		// Testing contracts
		mockERC20A = await (await MockERC20.deploy("Mock A", "A")).deployed();
		mockERC20B = await (await MockERC20.deploy("Mock B", "B")).deployed();
		mockERC20C = await (await MockERC20.deploy("Mock C", "C")).deployed();

		eTHValueFeed = await (await ETHValueFeedDummy.deploy()).deployed();

		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20A.address, eTHValueFeed.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20B.address, eTHValueFeed.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20C.address, eTHValueFeed.address);

		strategyInteractor = await (await StrategyInteractorDummy.deploy()).deployed();


		/**
		* EMP
		*/
		// Deploy an EMP
		await eMPDeployer.deployV1EMP(false, "EMP Name", "EMP");

		// Verify that a EMP has been registered
		expect(await registry.v1EMPId_v1EMP(1)).to.be.not.equal(ethers.constants.AddressZero);

		// Attach the deployed EMP address to a variable
		eMP = await V1EMP.attach(String(await registry.v1EMPId_v1EMP(1)));


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
			await strategyDeployer.deployV1EMPStrategy(`EMP Strategy ${i}`, `EMPS${i}`);

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
			await deployedV1EMPStrategy.utilizedERC20DepositOpenToggle();

			expect(await deployedV1EMPStrategy.utilizedERC20DepositOpen()).to.be.true;

			await deployedV1EMPStrategy.utilizedERC20WithdrawOpenToggle();

			expect(await deployedV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.true;

			strategies[i] = {
				contract: deployedV1EMPStrategy,
				strategyTransferUtil: new StrategyTransferUtil(deployedV1EMPStrategy, eTHValueFeed)
			};
		}
	});


	describe("function managerUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			await expect(eMP.connect(outsider).managerUpdate(outsider.address)).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
		});

		it("Should update manager..", async () => {
			await expect(eMP.managerUpdate(outsider.address)).to.be.not.rejected;

			expect(await eMP.manager()).to.be.equal(outsider.address);
		});
	});

	describe("function feeRateManagerUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			await expect(eMP.connect(outsider).feeRateManagerUpdate(outsider.address)).to.be.rejectedWith(
				ERROR.NOT_AUTHORIZED
			);
		});

		it("Should NOT allow greater than 100% fee rate..", async () => {
			const ONE_HUNDRED_PERCENT = await eMP.ONE_HUNDRED_PERCENT();

			await expect(
				eMP.feeRateManagerUpdate(ONE_HUNDRED_PERCENT.add(ethers.utils.parseUnits("1", 18)))
			).to.be.rejectedWith(
				ERROR.EMP.FEE_RATE_MANAGER_GREATER_THAN_100_PERCENT
			);
		});

		it("Should allow feeRateManager to be changed..", async () => {
			await expect(eMP.feeRateManagerUpdate(1)).to.be.not.rejected;

			expect(await eMP.feeRateManager()).to.be.equal(1);
		});
	});

	describe("function feeRateGovernanceUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			await expect(eMP.connect(outsider).feeRateGovernanceUpdate(outsider.address)).to.be.rejectedWith(
				ERROR.NOT_AUTHORIZED
			);
		});

		it("Should NOT allow greater than 100% fee rate..", async () => {
			const ONE_HUNDRED_PERCENT = await eMP.ONE_HUNDRED_PERCENT();

			await expect(
				eMP.feeRateGovernanceUpdate(ONE_HUNDRED_PERCENT.add(ethers.utils.parseUnits("1", 18)))
			).to.be.rejectedWith(
				ERROR.EMP.FEE_RATE_GOVERNANCE_GREATER_THAN_100_PERCENT
			);
		});

		it("Should allow feeRateManager to be changed..", async () => {
			await expect(eMP.feeRateGovernanceUpdate(1)).to.be.not.rejected;

			expect(await eMP.feeRateGovernance()).to.be.equal(1);
		});
	});

	describe("function utilizedV1EMPStrategyUpdate() (1/2)", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			await expect(eMP.connect(outsider).utilizedV1EMPStrategyUpdate([], [])).to.be.rejectedWith(
				ERROR.NOT_AUTHORIZED
			);
		});

		it("Should NOT allow strategies that add up to more than 100% to EMP..", async () => {
			await expect(
				eMP.utilizedV1EMPStrategyUpdate(
					[strategies[0].contract.address, strategies[1].contract.address] as UtilizedEMPStrategyUpdate,
					[PERCENT.HUNDRED, PERCENT.FIFTY] as UtilizedEMPStrategyAllocationUpdate
				)
			).to.be.rejectedWith(
				ERROR.EMP.INVALID_STRATEGY_ALLOCATION_TOTAL
			);
		});

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

	describe("function utilizedERC20Update()", async () => {
		let eMPUtilizedERC20: string[];


		beforeEach(async () => {
			// Set the utilzation to 2 different strategies
			await eMP.utilizedV1EMPStrategyUpdate(
				[strategies[0].contract.address, strategies[1].contract.address] as UtilizedEMPStrategyUpdate,
				[PERCENT.FIFTY, PERCENT.FIFTY] as UtilizedEMPStrategyAllocationUpdate
			);

			eMPUtilizedERC20 = await eMP.utilizedERC20();

			expect(eMPUtilizedERC20.length).to.be.equal(3);

			if (await strategies[0].contract.utilizedERC20DepositOpen())
			{
				await strategies[0].contract.utilizedERC20DepositOpenToggle();
			}

			if (await strategies[0].contract.utilizedERC20WithdrawOpen())
			{
				await strategies[0].contract.utilizedERC20WithdrawOpenToggle();
			}

			await strategies[0].contract.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]]);

			await expect(eMP.utilizedERC20Update()).to.be.not.reverted;
		});


		it("Should update the utilized ERC20..", async () => {
			await expect(eMP.utilizedERC20Update()).to.be.not.reverted;

			eMPUtilizedERC20 = await eMP.utilizedERC20();

			expect(eMPUtilizedERC20.length).to.be.equal(2);
		});
	});

	describe("function utilizedV1EMPStrategyUpdate() (2/2)", async () => {
		describe("[indirect-call] function utilizedERC20Update() - Utilized ERC20 tokens changed..", async () => {
			let eMPUtilizedERC20: string[];


			beforeEach(async () => {
				eMPUtilizedERC20 = await eMP.utilizedERC20();

				// Expect that there are no utilized ERC20 tokens
				expect(eMPUtilizedERC20.length).to.be.equal(0);

				// Set the utilzation to 2 different strategies
				await eMP.utilizedV1EMPStrategyUpdate(
					[strategies[0].contract.address, strategies[1].contract.address] as UtilizedEMPStrategyUpdate,
					[PERCENT.FIFTY, PERCENT.FIFTY] as UtilizedEMPStrategyAllocationUpdate
				);

				// Store the utilized ERC20 tokens
				eMPUtilizedERC20 = await eMP.utilizedERC20();
			});


			it("Should update EMP's utilizedERC20 array to be a union of the strategy's utilizedERC20s..", async () => {
				// Store the utilized ERC20 tokens
				expect(eMPUtilizedERC20.length).to.be.greaterThan(0);

				expect(eMPUtilizedERC20.length).to.be.equal(3);
			});
		});
	});
});
