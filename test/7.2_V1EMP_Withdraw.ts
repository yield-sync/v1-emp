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

	let BeforeBalanceEMPOwner: BigNumber;

	let BeforeBalanceMockAOwner: BigNumber;
	let BeforeBalanceMockBOwner: BigNumber;
	let BeforeBalanceMockCOwner: BigNumber;
	let BeforeBalanceMockAEMP: BigNumber;
	let BeforeBalanceMockBEMP: BigNumber;
	let BeforeBalanceMockCEMP: BigNumber;

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
					strategyInteractor: strategyInteractor.address
				},
				{
					strategyUtilizedERC20: [mockERC20C.address],
					strategyUtilization: [[true, true, PERCENT.HUNDRED]],
					strategyInteractor: strategyInteractor2.address
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

		BeforeBalanceEMPOwner = await eMPs[0].contract.balanceOf(owner.address);

		BeforeBalanceMockAOwner = await mockERC20A.balanceOf(owner.address);
		BeforeBalanceMockBOwner = await mockERC20B.balanceOf(owner.address);
		BeforeBalanceMockCOwner = await mockERC20C.balanceOf(owner.address);

		BeforeBalanceMockAEMP = await mockERC20A.balanceOf(eMPs[0].contract.address);
		BeforeBalanceMockBEMP = await mockERC20B.balanceOf(eMPs[0].contract.address);
		BeforeBalanceMockCEMP = await mockERC20C.balanceOf(eMPs[0].contract.address);


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

		await eMPs[0].contract.utilizedV1EMPStrategyDeposit([depositAmount[0], depositAmount[1]]);

		// Expect that the owner address received something
		expect(await eMPs[0].contract.balanceOf(owner.address)).to.be.greaterThan(0);
	});

	// TODO make tests for withdrawing from the EMP without every investing into the strategies

	describe("function utilizedV1EMPStrategyWithdraw()", async () => {
		describe("Modifier", async () => {
			it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
				await expect(eMPs[0].contract.connect(badActor).utilizedV1EMPStrategyWithdraw([])).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});
		});

		describe("Expected Failure", async () => {
			it("Should revert invalid lengthed _v1EMPStrategyERC20Amount param passed..", async () => {
				await expect(eMPs[0].contract.utilizedV1EMPStrategyWithdraw([])).to.be.rejectedWith(
					ERROR.EMP.INVALID_STRATEGY_ERC20_AMOUNTS_LENGTH
				);
			});
		});

		describe("Expected Success", async () => {
			it("Should be able to withdraw ERC20 tokens from Strategy to EMP..", async () => {
				expect(await mockERC20A.balanceOf(eMPs[0].contract.address)).to.be.equal(ethers.utils.parseUnits('0', 18));

				expect(await mockERC20B.balanceOf(eMPs[0].contract.address)).to.be.equal(ethers.utils.parseUnits('0', 18));

				expect(await mockERC20C.balanceOf(eMPs[0].contract.address)).to.be.equal(ethers.utils.parseUnits('0', 18));

				await expect(
					eMPs[0].contract.utilizedV1EMPStrategyWithdraw([
						await strategies[0].contract.eMP_shares(eMPs[0].contract.address),
						await strategies[1].contract.eMP_shares(eMPs[0].contract.address),
					])
				).to.not.be.reverted;

				expect(await mockERC20A.balanceOf(eMPs[0].contract.address)).to.be.greaterThan(ethers.utils.parseUnits('0', 18));

				expect(await mockERC20B.balanceOf(eMPs[0].contract.address)).to.be.greaterThan(ethers.utils.parseUnits('0', 18));

				expect(await mockERC20C.balanceOf(eMPs[0].contract.address)).to.be.greaterThan(ethers.utils.parseUnits('0', 18));
			});
		});

		describe("[indirect-call] function utilizedERC20Updated() - Utilized ERC20 tokens changed..", async () => {
			let eMPUtilizedERC20: string[];


			beforeEach(async () => {
				eMPUtilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);

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

				if (!await strategies[0].contract.utilizedERC20WithdrawOpen())
				{
					await strategies[0].contract.utilizedERC20WithdrawOpenToggle();
				}
			});


			it("Should update EMP's utilizedERC20 array to be a union of the strategy's utilizedERC20s..", async () => {
				await eMPs[0].contract.utilizedV1EMPStrategyWithdraw([
					await strategies[0].contract.eMP_shares(eMPs[0].contract.address),
					await strategies[1].contract.eMP_shares(eMPs[0].contract.address),
				]);

				eMPUtilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);

				expect(eMPUtilizedERC20.length).to.be.equal(2);
			});
		});
	});

	describe("function utilizedERC20Withdraw() (1/3) - utilizedV1EMPStrategyWithdraw() NOT called before", async () => {
		describe("Expected Failure", async () => {
			it("Should fail to withdraw tokens from Strategy if not enough tokens available on EMP..", async () => {
				const OWNER_EMP_BALANCE = await eMPs[0].contract.balanceOf(owner.address);

				await expect(eMPs[0].contract.utilizedERC20Withdraw(OWNER_EMP_BALANCE)).to.be.revertedWith(
					ERROR.EMP.UTILIZED_ERC20_NOT_AVAILABLE
				);
			});
		});
	});

	describe("function utilizedERC20Withdraw() (2/3) - Full Withdrawals Disabled", async () => {
		beforeEach(async () => {
			await eMPs[0].contract.utilizedV1EMPStrategyWithdraw([
				await strategies[0].contract.eMP_shares(eMPs[0].contract.address),
				await strategies[1].contract.eMP_shares(eMPs[0].contract.address),
			])

			expect(await eMPs[0].contract.utilizedERC20WithdrawFull()).to.be.false;
		});


		describe("Expected Failure", async () => {
			it("Should NOT allow withdrawing if not open..", async () => {
				/**
				* @notice This test is to check that depositing must be toggled on in order to call the function properly.
				*/

				await eMPs[0].contract.utilizedERC20WithdrawOpenToggle();

				expect(await eMPs[0].contract.utilizedERC20WithdrawOpen()).to.be.false;

				// Even if utilizedERC20Amounts, the function should revert with reason that deposits are NOT open
				await expect(eMPs[0].contract.utilizedERC20Withdraw(0)).to.be.rejectedWith(
					ERROR.EMP.WITHDRAW_NOT_OPEN
				);
			});

			it("Should not allow msg.sender to withdraw with insufficient EMP balance..", async () => {
				/**
				* @notice This test should test that msg.sender cannot withdraw more than what they have.
				*/

				const INVALID_BALANCE = (await eMPs[0].contract.balanceOf(owner.address)).add(1);

				await expect(eMPs[0].contract.utilizedERC20Withdraw(INVALID_BALANCE)).to.be.rejectedWith(
					ERROR.EMP.INVALID_BALANCE
				);
			});
		});

		describe("Expected Success", async () => {
			it("Should allow withdrawing tokens from Strategy..", async () => {
				/**
				* @notice This test should test that msg.sender cannot withdraw more than what they have.
				*/

				const OWNER_EMP_BALANCE = await eMPs[0].contract.balanceOf(owner.address);

				await eMPs[0].contract.utilizedERC20Withdraw(OWNER_EMP_BALANCE);

				expect(await eMPs[0].contract.balanceOf(owner.address)).to.be.equal(0);

				expect(await strategies[0].contract.eMP_shares(eMPs[0].contract.address)).to.be.equal(0);

				expect(await strategies[1].contract.eMP_shares(eMPs[0].contract.address)).to.be.equal(0);
			});
		});


		describe("[indirect-call] function utilizedERC20Updated() - Utilized ERC20 tokens changed..", async () => {
			let eMPUtilizedERC20: string[];


			beforeEach(async () => {
				eMPUtilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);

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

				if (!await strategies[0].contract.utilizedERC20WithdrawOpen())
				{
					await strategies[0].contract.utilizedERC20WithdrawOpenToggle();
				}
			});


			it("Should update EMP's utilizedERC20 array to be a union of the strategy's utilizedERC20s..", async () => {
				const VALID_BALANCE = await eMPs[0].contract.balanceOf(owner.address);

				await eMPs[0].contract.utilizedERC20Withdraw(VALID_BALANCE);

				eMPUtilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);

				expect(eMPUtilizedERC20.length).to.be.equal(2);
			});
		});
	});

	describe("function utilizedERC20WithdrawFullToggle()", async () => {
		describe("Expected Failure", async () => {
			it("[modifier][auth] Should revert when unauthorized msg.sender calls..", async () => {
				await expect(eMPs[0].contract.connect(badActor).utilizedERC20WithdrawFullToggle()).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});
		});

		describe("Expected Success", async () => {
			it("Should toggle utilizedERC20WithdrawOpen..", async () => {

				expect(await eMPs[0].contract.utilizedERC20WithdrawFull()).to.be.false;

				await expect(eMPs[0].contract.utilizedERC20WithdrawFullToggle()).to.be.not.rejected;

				expect(await eMPs[0].contract.utilizedERC20WithdrawFull()).to.be.true;
			});
		});
	});

	describe("function utilizedERC20Withdraw() (3/3) - Full Withdrawals Enabled", async () => {
		describe("Expected Success", async () => {
			beforeEach(async () => {
				expect(await eMPs[0].contract.utilizedERC20WithdrawFull()).to.be.false;

				await eMPs[0].contract.utilizedERC20WithdrawFullToggle();

				expect(await eMPs[0].contract.utilizedERC20WithdrawFull()).to.be.true;
			});


			it("Should allow withdrawing tokens from EMP even if not prewithdrawn from stratgies..", async () => {
				const OWNER_EMP_BALANCE = await eMPs[0].contract.balanceOf(owner.address);

				await eMPs[0].contract.utilizedERC20Withdraw(OWNER_EMP_BALANCE);

				const EMP_MOCK_A_BALANCE = await mockERC20A.balanceOf(eMPs[0].contract.address);
				const OWNER_EMP_BALANCE_AFTER = await eMPs[0].contract.balanceOf(owner.address);
				const OWNER_MOCK_A_BALANCE = await mockERC20A.balanceOf(owner.address);

				const EMP_SHARE_STRATEGY_0_BALANCE = await strategies[0].contract.eMP_shares(eMPs[0].contract.address);
				const EMP_SHARE_STRATEGY_1_BALANCE = await strategies[0].contract.eMP_shares(eMPs[0].contract.address);

				expect(EMP_MOCK_A_BALANCE).to.be.equal(BeforeBalanceMockAEMP);
				expect(OWNER_EMP_BALANCE_AFTER).to.be.equal(BeforeBalanceEMPOwner);
				expect(OWNER_MOCK_A_BALANCE).to.be.equal(BeforeBalanceMockAOwner);

				expect(EMP_SHARE_STRATEGY_0_BALANCE).to.be.equal(0);
				expect(EMP_SHARE_STRATEGY_1_BALANCE).to.be.equal(0);
			});

			describe("[situation] Partial ERC20 amount available on EMP", async () => {
				it("Should allow withdrawing tokens from EMP..", async () => {
					const s1Balance = await strategies[0].contract.eMP_shares(eMPs[0].contract.address);
					const s2Balance = await strategies[1].contract.eMP_shares(eMPs[0].contract.address);

					// Withdraw only partial balanceOf EMP
					await eMPs[0].contract.utilizedV1EMPStrategyWithdraw([s1Balance.div(10), s2Balance.div(10)]);

					const VALID_BALANCE = await eMPs[0].contract.balanceOf(owner.address);

					await eMPs[0].contract.utilizedERC20Withdraw(VALID_BALANCE);


					const OWNER_EMP_BALANCE_AFTER = await eMPs[0].contract.balanceOf(owner.address);

					expect(OWNER_EMP_BALANCE_AFTER).to.be.equal(BeforeBalanceEMPOwner);


					const EMP_MOCK_A_BALANCE = await mockERC20A.balanceOf(eMPs[0].contract.address);
					const EMP_MOCK_B_BALANCE = await mockERC20B.balanceOf(eMPs[0].contract.address);
					const EMP_MOCK_C_BALANCE = await mockERC20C.balanceOf(eMPs[0].contract.address);

					expect(EMP_MOCK_A_BALANCE).to.be.equal(BeforeBalanceMockAEMP);
					expect(EMP_MOCK_B_BALANCE).to.be.equal(BeforeBalanceMockBEMP);
					expect(EMP_MOCK_C_BALANCE).to.be.equal(BeforeBalanceMockCEMP);


					const OWNER_MOCK_A_BALANCE = await mockERC20A.balanceOf(owner.address);
					const OWNER_MOCK_B_BALANCE = await mockERC20B.balanceOf(owner.address);
					const OWNER_MOCK_C_BALANCE = await mockERC20C.balanceOf(owner.address);

					expect(OWNER_MOCK_A_BALANCE).to.be.equal(BeforeBalanceMockAOwner);
					expect(OWNER_MOCK_B_BALANCE).to.be.equal(BeforeBalanceMockBOwner);
					expect(OWNER_MOCK_C_BALANCE).to.be.equal(BeforeBalanceMockCOwner);


					const EMP_SHARE_STRATEGY_0_BALANCE = await strategies[0].contract.eMP_shares(eMPs[0].contract.address);
					const EMP_SHARE_STRATEGY_1_BALANCE = await strategies[0].contract.eMP_shares(eMPs[0].contract.address);

					expect(EMP_SHARE_STRATEGY_0_BALANCE).to.be.equal(0);
					expect(EMP_SHARE_STRATEGY_1_BALANCE).to.be.equal(0);
				});

				it("Should allow withdrawing tokens from EMP with tolerance applied..", async () => {
					const s1Balance = await strategies[0].contract.eMP_shares(eMPs[0].contract.address);
					const s2Balance = await strategies[1].contract.eMP_shares(eMPs[0].contract.address);

					// Withdraw only partial balanceOf EMP
					await eMPs[0].contract.utilizedV1EMPStrategyWithdraw([s1Balance.div(23), s2Balance.div(35)]);

					const VALID_BALANCE = await eMPs[0].contract.balanceOf(owner.address);

					await eMPs[0].contract.utilizedERC20Withdraw(VALID_BALANCE);

					const OWNER_EMP_BALANCE_AFTER = await eMPs[0].contract.balanceOf(owner.address);

					expect(OWNER_EMP_BALANCE_AFTER).to.be.equal(BeforeBalanceEMPOwner);


					const EMP_MOCK_A_BALANCE = await mockERC20A.balanceOf(eMPs[0].contract.address);
					const EMP_MOCK_B_BALANCE = await mockERC20B.balanceOf(eMPs[0].contract.address);
					const EMP_MOCK_C_BALANCE = await mockERC20C.balanceOf(eMPs[0].contract.address);

					expect(EMP_MOCK_A_BALANCE).to.be.equal(BeforeBalanceMockAEMP);
					expect(EMP_MOCK_B_BALANCE).to.be.equal(BeforeBalanceMockBEMP);
					expect(EMP_MOCK_C_BALANCE).to.be.equal(BeforeBalanceMockCEMP.add(await eMPUtility.TOLERANCE()).sub(1));


					const OWNER_MOCK_A_BALANCE = await mockERC20A.balanceOf(owner.address);
					const OWNER_MOCK_B_BALANCE = await mockERC20B.balanceOf(owner.address);
					const OWNER_MOCK_C_BALANCE = await mockERC20C.balanceOf(owner.address);

					expect(OWNER_MOCK_A_BALANCE).to.be.equal(BeforeBalanceMockAOwner);
					expect(OWNER_MOCK_B_BALANCE).to.be.equal(BeforeBalanceMockBOwner);
					expect(OWNER_MOCK_C_BALANCE).to.be.equal(BeforeBalanceMockCOwner.sub(await eMPUtility.TOLERANCE()));


					const EMP_SHARE_STRATEGY_0_BALANCE = await strategies[0].contract.eMP_shares(eMPs[0].contract.address);
					const EMP_SHARE_STRATEGY_1_BALANCE = await strategies[0].contract.eMP_shares(eMPs[0].contract.address);

					expect(EMP_SHARE_STRATEGY_0_BALANCE).to.be.equal(0);
					expect(EMP_SHARE_STRATEGY_1_BALANCE).to.be.equal(0);
				});
			});
		});
	});
});
