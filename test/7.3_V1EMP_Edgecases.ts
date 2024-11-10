type DeployEMP = {
	name: string,
	ticker: string,
	utilizedEMPStrategyUpdate: UtilizedEMPStrategyUpdate,
	utilizedEMPStrategyAllocationUpdate: UtilizedEMPStrategyAllocationUpdate
};

type DeployStrategy = {
	strategyUtilizedERC20: string[],
	strategyUtilization: [boolean, boolean, BigNumber][],
	strategyInteractor: string | null
};

type TestEMP = {
	contract: Contract,
	eMPTransferUtil: EMPTransferUtil
};

type TestStrategy = {
	contract: Contract,
	strategyTransferUtil: StrategyTransferUtil
};



const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory, VoidSigner } from "ethers";

import { D_18, ERROR, PERCENT } from "../const";
import EMPTransferUtil from "../util/EMPTransferUtil";
import StrategyTransferUtil from "../util/StrategyTransferUtil";


const LOCATION_MOCKERC20: string = "MockERC20";


describe("[7.2] V1EMP.sol - Withdrawing Tokens", async () => {
	let eTHValueEMPDepositAmount: BigNumber = ethers.utils.parseUnits("1", 18);

	let arrayUtility: Contract;
	let governance: Contract;
	let eTHValueFeed: Contract;
	let eTHValueFeedC: Contract;
	let eMPDeployer: Contract;
	let eMPUtility: Contract;
	let registry: Contract;
	let strategyDeployer: Contract;
	let strategyUtility: Contract;
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;
	let strategyInteractor: Contract;
	let strategyInteractor2: Contract;

	let owner: VoidSigner;
	let manager: VoidSigner;
	let treasury: VoidSigner;
	let badActor: VoidSigner;

	let eMPs: TestEMP[] = [];
	let strategies: TestStrategy[] = [];

	let eMPDepositAmounts: UtilizedERC20Amount;
	let depositAmount: UtilizedERC20Amount = [];


	async function approveTokens(eMP: string, utilizedERC20: string[], eMPDepositAmounts: BigNumber[])
	{
		if (utilizedERC20.length != eMPDepositAmounts.length)
		{
			throw new Error("function approveTokens: utilizedERC20.length != eMPDepositAmounts.length");
		}

		for (let i: number = 0; i < utilizedERC20.length; i++)
		{
			await (await ethers.getContractAt(LOCATION_MOCKERC20, utilizedERC20[i])).approve(eMP, eMPDepositAmounts[i]);
		}
	}

	async function deployStrategies(V1EMPStrategy: ContractFactory, deployStrategies: DeployStrategy[]): Promise<TestStrategy[]>
	{
		let testStrategies: TestStrategy[] = [];

		for (let i: number = 0; i < deployStrategies.length; i++)
		{
			// Deploy EMP Strategy
			await strategyDeployer.deployV1EMPStrategy();

			// Attach the deployed V1EMPStrategy address to variable
			let deployedV1EMPStrategy = await V1EMPStrategy.attach(
				String(await registry.v1EMPStrategyId_v1EMPStrategy(i + 1))
			);

			if (deployStrategies[i].strategyInteractor)
			{
				await deployedV1EMPStrategy.iV1EMPStrategyInteractorUpdate(deployStrategies[i].strategyInteractor);
			}

			await deployedV1EMPStrategy.utilizedERC20Update(
				deployStrategies[i].strategyUtilizedERC20,
				deployStrategies[i].strategyUtilization
			);

			if (deployStrategies[i].strategyInteractor)
			{
				// Enable Deposits and Withdraws
				await deployedV1EMPStrategy.utilizedERC20DepositOpenToggle();

				expect(await deployedV1EMPStrategy.utilizedERC20DepositOpen()).to.be.true;

				await deployedV1EMPStrategy.utilizedERC20WithdrawOpenToggle();

				expect(await deployedV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.true;
			}

			testStrategies[i] = {
				contract: deployedV1EMPStrategy,
				strategyTransferUtil: new StrategyTransferUtil(deployedV1EMPStrategy, registry)
			};
		}

		return testStrategies;
	}

	async function deployEMP(V1EMP: ContractFactory, deployEMPs: DeployEMP[]): Promise<TestEMP[]>
	{
		let testEMPs: TestEMP[] = [];

		for (let i: number = 0; i < deployEMPs.length; i++)
		{
			// Deploy EMPs
			await eMPDeployer.deployV1EMP(false, deployEMPs[i].name, deployEMPs[i].ticker);

			// Get address from registry
			let registryResults = await registry.v1EMPId_v1EMP(i + 1);

			// Verify that a EMP has been registered
			expect(String(registryResults)).to.be.not.equal(ethers.constants.AddressZero);

			const eMPContract = await V1EMP.attach(String(registryResults));

			testEMPs[i] = ({
				contract: eMPContract,
				eMPTransferUtil: new EMPTransferUtil(eMPContract, registry, eMPUtility),
			});

			// Set the Manager
			await testEMPs[i].contract.managerUpdate(manager.address);

			expect(await testEMPs[i].contract.utilizedERC20DepositOpen()).to.be.false;

			expect(await testEMPs[i].contract.utilizedERC20WithdrawOpen()).to.be.false;

			// Set the utilzation to 2 different strategies
			await testEMPs[i].contract.utilizedV1EMPStrategyUpdate(
				deployEMPs[i].utilizedEMPStrategyUpdate,
				deployEMPs[i].utilizedEMPStrategyAllocationUpdate
			);

			// Open deposits
			await testEMPs[i].contract.utilizedERC20DepositOpenToggle();

			// Open withdrawals
			await testEMPs[i].contract.utilizedERC20WithdrawOpenToggle();

			expect(await testEMPs[i].contract.utilizedERC20DepositOpen()).to.be.true;

			expect(await testEMPs[i].contract.utilizedERC20WithdrawOpen()).to.be.true;
		}

		return testEMPs;
	}


	beforeEach("[beforeEach] Set up contracts..", async () => {
		[owner, manager, treasury, badActor] = await ethers.getSigners();

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
		strategyInteractor = await (await StrategyInteractorDummy.deploy()).deployed();
		strategyInteractor2 = await (await StrategyInteractorDummy.deploy()).deployed();

		mockERC20A = await (await MockERC20.deploy("Mock A", "A", 18)).deployed();
		mockERC20B = await (await MockERC20.deploy("Mock B", "B", 18)).deployed();
		mockERC20C = await (await MockERC20.deploy("Mock C", "C", 6)).deployed();

		eTHValueFeed = await (await ETHValueFeedDummy.deploy(18)).deployed();
		eTHValueFeedC = await (await ETHValueFeedDummy.deploy(6)).deployed();

		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20A.address, eTHValueFeed.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20B.address, eTHValueFeed.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20C.address, eTHValueFeedC.address);

		// Deploy Strategies
		strategies = await deployStrategies(
			V1EMPStrategy,
			[
				{
					strategyUtilizedERC20: [mockERC20A.address, mockERC20B.address],
					strategyUtilization: [[true, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]],
					strategyInteractor: null
				},
				{
					strategyUtilizedERC20: [mockERC20C.address],
					strategyUtilization: [[true, true, PERCENT.HUNDRED]],
					strategyInteractor: null
				},
			]
		);

		// Deploy EMPa
		eMPs = await deployEMP(
			V1EMP,
			[
				{
					name: "EMP 1",
					ticker: "EMP1",
					utilizedEMPStrategyUpdate: [strategies[0].contract.address, strategies[1].contract.address],
					utilizedEMPStrategyAllocationUpdate: [PERCENT.FIFTY, PERCENT.FIFTY],
				},
			]
		);

		eMPDepositAmounts = await eMPs[0].eMPTransferUtil.calculatedUtilizedERC20Amount(eTHValueEMPDepositAmount);

		// Approve tokens
		await approveTokens(
			eMPs[0].contract.address,
			await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address),
			eMPDepositAmounts
		);

		// Deposit the utilized ERC20 tokens into EMP
		await eMPs[0].contract.utilizedERC20Deposit(eMPDepositAmounts);

		depositAmount[0] = await strategies[0].strategyTransferUtil.calculateERC20Required(
			eTHValueEMPDepositAmount.mul(PERCENT.FIFTY).div(D_18)
		);

		depositAmount[1] = await strategies[1].strategyTransferUtil.calculateERC20Required(
			eTHValueEMPDepositAmount.mul(PERCENT.FIFTY).div(D_18)
		);

		// Expect that the owner address received something
		expect(await eMPs[0].contract.balanceOf(owner.address)).to.be.greaterThan(0);
	});

	describe("EMP has Strategies set but Strategies do not have SI set", async () => {
		it("Should allow depositing tokens into the EMP", async () => {

		});
	});
});
