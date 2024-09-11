const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory, VoidSigner } from "ethers";

import { D_18, ERROR, PERCENT } from "../const";
import EMPTransferUtil from "../scripts/EMPTransferUtil";
import StrategyTransferUtil from "../scripts/StrategyTransferUtil";


const LOCATION_MOCKERC20: string = "MockERC20";


describe("[6.2] V1EMP.sol - Withdrawing Tokens", async () => {
	let eTHValueEMPDepositAmount: BigNumber = ethers.utils.parseUnits("2", 18);

	let arrayUtility: Contract;
	let governance: Contract;
	let eTHValueFeed: Contract;
	let eMPDeployer: Contract;
	let eMPUtility: Contract;
	let registry: Contract;
	let strategyDeployer: Contract;
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;

	let owner: VoidSigner;
	let manager: VoidSigner;
	let treasury: VoidSigner;
	let badActor: VoidSigner;

	let eMPs: {
		contract: Contract,
		eMPTransferUtil: EMPTransferUtil
	}[] = [];


	let strategies: {
		contract: Contract,
		strategyTransferUtil: StrategyTransferUtil
	}[] = [];

	let eMPDepositAmounts: UtilizedERC20Amount;
	let depositAmount: UtilizedERC20Amount = [];


	beforeEach("[beforeEach] Set up contracts..", async () => {
		[owner, manager, treasury, badActor] = await ethers.getSigners();

		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const V1EMP: ContractFactory = await ethers.getContractFactory("V1EMP");
		const V1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("V1EMPArrayUtility");
		const V1EMPDeployer: ContractFactory = await ethers.getContractFactory("V1EMPDeployer");
		const V1EMPRegistry: ContractFactory = await ethers.getContractFactory("V1EMPRegistry");
		const V1EMPStrategy: ContractFactory = await ethers.getContractFactory("V1EMPStrategy");
		const V1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("V1EMPStrategyDeployer");
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

		strategyDeployer = await (await V1EMPStrategyDeployer.deploy(registry.address)).deployed();

		await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);

		eMPUtility = await (await V1EMPUtility.deploy(registry.address)).deployed();

		await registry.v1EMPUtilityUpdate(eMPUtility.address);

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
			let strategyInteractor: Contract = await (await StrategyInteractorDummy.deploy()).deployed();

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

		/**
		* EMP
		*/
		const deployEMPs: {
			name: string,
			ticker: string,
			utilizedEMPStrategyUpdate: UtilizedEMPStrategyUpdate,
			utilizedEMPStrategyAllocationUpdate: UtilizedEMPStrategyAllocationUpdate
		}[] = [
			{
				name: "EMP 1",
				ticker: "EMP1",
				utilizedEMPStrategyUpdate: [strategies[0].contract.address, strategies[1].contract.address],
				utilizedEMPStrategyAllocationUpdate: [PERCENT.FIFTY, PERCENT.FIFTY],
			},
		];

		for (let i: number = 0; i < deployEMPs.length; i++)
		{
			// Deploy EMPs
			await eMPDeployer.deployV1EMP(false, deployEMPs[i].name, deployEMPs[i].ticker);

			// Get address from registry
			let registryResults = await registry.v1EMPId_v1EMP(i + 1);

			// Verify that a EMP has been registered
			expect(String(registryResults)).to.be.not.equal(ethers.constants.AddressZero);

			const eMPContract = await V1EMP.attach(String(registryResults));

			eMPs[i] = ({
				contract: eMPContract,
				eMPTransferUtil: new EMPTransferUtil(eMPContract, registry),
			});

			// Set the Manager
			await eMPs[i].contract.managerUpdate(manager.address);

			expect(await eMPs[i].contract.utilizedERC20DepositOpen()).to.be.false;

			expect(await eMPs[i].contract.utilizedERC20WithdrawOpen()).to.be.false;

			// Set the utilzation to 2 different strategies
			await eMPs[i].contract.utilizedV1EMPStrategyUpdate(
				deployEMPs[i].utilizedEMPStrategyUpdate,
				deployEMPs[i].utilizedEMPStrategyAllocationUpdate
			);

			// Open deposits
			await eMPs[i].contract.utilizedERC20DepositOpenToggle();

			// Open withdrawals
			await eMPs[i].contract.utilizedERC20WithdrawOpenToggle();

			expect(await eMPs[i].contract.utilizedERC20DepositOpen()).to.be.true;

			expect(await eMPs[i].contract.utilizedERC20WithdrawOpen()).to.be.true;
		}


		eMPDepositAmounts = await eMPs[0].eMPTransferUtil.calculateERC20Required(eTHValueEMPDepositAmount);

		// Approve the ERC20 tokens for the strategy interactor
		for (let i: number = 0; i < (await eMPs[0].contract.utilizedERC20()).length; i++)
		{
			let eMPUtilizedERC20 = (await eMPs[0].contract.utilizedERC20())[i];

			await (await ethers.getContractAt(LOCATION_MOCKERC20, eMPUtilizedERC20)).approve(
				eMPs[0].contract.address,
				eMPDepositAmounts[i]
			);
		}

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


	describe("function utilizedV1EMPStrategyWithdraw()", async () => {
		describe("Modifier", async () => {
			it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
				await expect(eMPs[0].contract.connect(badActor).utilizedV1EMPStrategyWithdraw([])).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});
		});

		it("Should revert invalid lengthed _v1EMPStrategyERC20Amount param passed..", async () => {
			await expect(eMPs[0].contract.utilizedV1EMPStrategyWithdraw([])).to.be.rejectedWith(
				ERROR.EMP.INVALID_STRATEGY_ERC20_AMOUNTS_LENGTH
			);
		});

		it("Should be able to withdraw ERC20 tokens from Strategy to EMP..", async () => {
			expect(await mockERC20A.balanceOf(eMPs[0].contract.address)).to.be.equal(ethers.utils.parseUnits('0', 18));

			expect(await mockERC20B.balanceOf(eMPs[0].contract.address)).to.be.equal(ethers.utils.parseUnits('0', 18));

			expect(await mockERC20C.balanceOf(eMPs[0].contract.address)).to.be.equal(ethers.utils.parseUnits('0', 18));

			await expect(
				eMPs[0].contract.utilizedV1EMPStrategyWithdraw([
					await strategies[0].contract.eMP_equity(eMPs[0].contract.address),
					await strategies[1].contract.eMP_equity(eMPs[0].contract.address),
				])
			).to.not.be.reverted;

			expect(await mockERC20A.balanceOf(eMPs[0].contract.address)).to.be.greaterThan(ethers.utils.parseUnits('0', 18));

			expect(await mockERC20B.balanceOf(eMPs[0].contract.address)).to.be.greaterThan(ethers.utils.parseUnits('0', 18));

			expect(await mockERC20C.balanceOf(eMPs[0].contract.address)).to.be.greaterThan(ethers.utils.parseUnits('0', 18));
		});

		describe("[indirect-call] function utilizedERC20Updated() - Utilized ERC20 tokens changed..", async () => {
			let eMPUtilizedERC20: string[];


			beforeEach(async () => {
				eMPUtilizedERC20 = await eMPs[0].contract.utilizedERC20();

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
					await strategies[0].contract.eMP_equity(eMPs[0].contract.address),
					await strategies[1].contract.eMP_equity(eMPs[0].contract.address),
				]);

				eMPUtilizedERC20 = await eMPs[0].contract.utilizedERC20();

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
				await strategies[0].contract.eMP_equity(eMPs[0].contract.address),
				await strategies[1].contract.eMP_equity(eMPs[0].contract.address),
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

				// Expect that the strategy tokens are burnt after withdrawing
				expect(await strategies[0].contract.eMP_equity(eMPs[0].contract.address)).to.be.equal(0);
				expect(await strategies[1].contract.eMP_equity(eMPs[0].contract.address)).to.be.equal(0);
			});
		});


		describe("[indirect-call] function utilizedERC20Updated() - Utilized ERC20 tokens changed..", async () => {
			let eMPUtilizedERC20: string[];


			beforeEach(async () => {
				eMPUtilizedERC20 = await eMPs[0].contract.utilizedERC20();

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

				eMPUtilizedERC20 = await eMPs[0].contract.utilizedERC20();

				expect(eMPUtilizedERC20.length).to.be.equal(2);
			});
		});
	});

	describe("function utilizedERC20WithdrawFullToggle()", async () => {
		it("[modifier][auth] Should revert when unauthorized msg.sender calls..", async () => {
			await expect(eMPs[0].contract.connect(badActor).utilizedERC20WithdrawFullToggle()).to.be.rejectedWith(
				ERROR.NOT_AUTHORIZED
			);
		});

		it("Should toggle utilizedERC20WithdrawOpen..", async () => {

			expect(await eMPs[0].contract.utilizedERC20WithdrawFull()).to.be.false;

			await expect(eMPs[0].contract.utilizedERC20WithdrawFullToggle()).to.be.not.rejected;

			expect(await eMPs[0].contract.utilizedERC20WithdrawFull()).to.be.true;
		});
	});

	describe("function utilizedERC20Withdraw() (2/2) - Full Withdrawals Enabled", async () => {
		describe("Expected Success", async () => {
			beforeEach(async () => {
				expect(await eMPs[0].contract.utilizedERC20WithdrawFull()).to.be.false;

				await eMPs[0].contract.utilizedERC20WithdrawFullToggle();

				expect(await eMPs[0].contract.utilizedERC20WithdrawFull()).to.be.true;
			});


			it("Should allow withdrawing tokens from Strategy even if not prewithdrawn from stratgies..", async () => {
				const OWNER_EMP_BALANCE = await eMPs[0].contract.balanceOf(owner.address);

				await eMPs[0].contract.utilizedERC20Withdraw(OWNER_EMP_BALANCE);

				expect(await eMPs[0].contract.balanceOf(owner.address)).to.be.equal(0);

				// Expect that the strategy tokens are burnt after withdrawing
				expect(await strategies[0].contract.eMP_equity(eMPs[0].contract.address)).to.be.equal(0);
				expect(await strategies[1].contract.eMP_equity(eMPs[0].contract.address)).to.be.equal(0);
			});

			it("Should allow withdrawing tokens from Strategy even if only partially prewithdrawn from stratgies..", async () => {
				const s1Balance = await strategies[0].contract.eMP_equity(eMPs[0].contract.address);
				const s2Balance = await strategies[1].contract.eMP_equity(eMPs[0].contract.address);

				// Withdraw only partial balanceOf EMP
				await eMPs[0].contract.utilizedV1EMPStrategyWithdraw([s1Balance.div(24), s2Balance.div(13)])

				const VALID_BALANCE = await eMPs[0].contract.balanceOf(owner.address);

				await eMPs[0].contract.utilizedERC20Withdraw(VALID_BALANCE);

				expect(await eMPs[0].contract.balanceOf(owner.address)).to.be.equal(0);

				// Expect that the strategy tokens are burnt after withdrawing
				expect(await strategies[0].contract.eMP_equity(eMPs[0].contract.address)).to.be.equal(0);
				expect(await strategies[1].contract.eMP_equity(eMPs[0].contract.address)).to.be.equal(0);
			});
		});
	});
});
