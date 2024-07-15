const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory, VoidSigner } from "ethers";

import { D_18, ERROR, PERCENT } from "../const";
import EMPTransferUtil from "../scripts/EMPTransferUtil";
import StrategyTransferUtil from "../scripts/StrategyTransferUtil";


const LOCATION_MOCKERC20: string = "MockERC20";


describe("[7.2] YieldSyncV1EMP.sol - Withdrawing Tokens", async () => {
	let eMPUtilizedERC20: string[];

	let eTHValueEMPDepositAmount: BigNumber = ethers.utils.parseUnits("2", 18);

	let arrayUtility: Contract;
	let governance: Contract;
	let eTHValueFeed: Contract;
	let eMP: Contract;
	let eMPDeployer: Contract;
	let eMPUtility: Contract;
	let registry: Contract;
	let strategyDeployer: Contract;
	let strategyUtility: Contract;

	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;

	let eMPTransferUtil: EMPTransferUtil;

	let owner: VoidSigner;
	let manager: VoidSigner;
	let treasury: VoidSigner;
	let outsider: VoidSigner;

	let eMPDepositAmounts: UtilizedERC20Amount;

	let strategies: {
		contract: Contract,
		strategyTransferUtil: StrategyTransferUtil
	}[] = [];

	let depositAmount: BigNumber[][] = [];


	beforeEach("[beforeEach] Set up contracts..", async () => {
		/**
		* @notice
		* This beforeEach process does the following:
		* 1) Deploy a registry
		* 2) SEt the utilized tokens for the strats
		* 3) Deploys an EMP Deployer and registers it on the registry
		* 4) Attach the deployed EMP to a local variable (for accessing fn.)
		* 5) Set the manager
		* 6) Update the EMP Transfer Util
		* 7) Deploy 2 strategies and make them fully operational by doing the following:
		* 	a) Attach the deployed EMP Strategy to a local variable
		* 	b) Set the ETH Value feed
		* 	c) Set the strategy interactor
		* 	d) Set the tokens for the strategy
		* 	e) Toggle on the withdrawals and depositing of tokens
		* 	f) Set the strategies[0].strategyTransferUtil for strategy
		* 8) Set the stratgies on the EMP
		* 9) Enable deposting into EMP
		* 10) Calculate EMP Deposit Amounts
		* 11) Store the utilized ERC20 tokens
		* 12) Approve the tokens
		* 13) Deposit the tokens into the EMP
		* 14) calcualte the Strategy deposit amounts
		* 15) Deposit the tokens in the stratgies from the EMP
		* 16) Open the withdrawals
		*/

		[owner, manager, treasury, outsider] = await ethers.getSigners();

		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const YieldSyncV1EMP: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMP");
		const YieldSyncV1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPArrayUtility");
		const YieldSyncV1EMPDeployer: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPDeployer");
		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");
		const YieldSyncV1EMPStrategy: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategy");
		const YieldSyncV1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategyDeployer");
		const YieldSyncV1EMPStrategyUtility: ContractFactory= await ethers.getContractFactory("YieldSyncV1EMPStrategyUtility");
		const YieldSyncV1EMPUtility: ContractFactory= await ethers.getContractFactory("YieldSyncV1EMPUtility");

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");


		// Core contracts
		governance = await (await YieldSyncGovernance.deploy()).deployed();

		await governance.payToUpdate(treasury.address);

		arrayUtility = await (await YieldSyncV1EMPArrayUtility.deploy()).deployed();

		registry = await (await YieldSyncV1EMPRegistry.deploy(governance.address)).deployed();

		await registry.yieldSyncV1EMPArrayUtilityUpdate(arrayUtility.address);

		strategyUtility = await (await YieldSyncV1EMPStrategyUtility.deploy(registry.address)).deployed();

		await registry.yieldSyncV1EMPStrategyUtilityUpdate(strategyUtility.address);

		strategyDeployer = await (await YieldSyncV1EMPStrategyDeployer.deploy(registry.address)).deployed();

		await registry.yieldSyncV1EMPStrategyDeployerUpdate(strategyDeployer.address);

		eMPUtility = await (await YieldSyncV1EMPUtility.deploy(registry.address)).deployed();

		await registry.yieldSyncV1EMPUtilityUpdate(eMPUtility.address);

		eMPDeployer = await (await YieldSyncV1EMPDeployer.deploy(registry.address)).deployed();

		await registry.yieldSyncV1EMPDeployerUpdate(eMPDeployer.address);


		// Testing contracts
		mockERC20A = await (await MockERC20.deploy("Mock A", "A")).deployed();
		mockERC20B = await (await MockERC20.deploy("Mock B", "B")).deployed();
		mockERC20C = await (await MockERC20.deploy("Mock C", "C")).deployed();

		eTHValueFeed = await (await ETHValueFeedDummy.deploy()).deployed();

		await registry.eRC20_yieldSyncV1EMPERC20ETHValueFeedUpdate(mockERC20A.address, eTHValueFeed.address);
		await registry.eRC20_yieldSyncV1EMPERC20ETHValueFeedUpdate(mockERC20B.address, eTHValueFeed.address);
		await registry.eRC20_yieldSyncV1EMPERC20ETHValueFeedUpdate(mockERC20C.address, eTHValueFeed.address);


		/**
		* EMP
		*/
		// Deploy an EMP
		await eMPDeployer.deployYieldSyncV1EMP("EMP Name", "EMP");

		// Verify that a EMP has been registered
		expect(await registry.yieldSyncV1EMPId_yieldSyncV1EMP(1)).to.be.not.equal(ethers.constants.AddressZero);

		// Attach the deployed EMP address to a variable
		eMP = await YieldSyncV1EMP.attach(String(await registry.yieldSyncV1EMPId_yieldSyncV1EMP(1)));

		// Set the Manager
		await eMP.managerUpdate(manager.address);

		// Update the EMP transfer Util
		eMPTransferUtil = new EMPTransferUtil(eMP, registry);


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
			await strategyDeployer.deployYieldSyncV1EMPStrategy(`EMP Strategy ${i}`, `EMPS${i}`);

			// Attach the deployed YieldSyncV1EMPStrategy address to variable
			let deployedYieldSyncV1EMPStrategy = await YieldSyncV1EMPStrategy.attach(
				String(await registry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(i + 1))
			);

			// Set the Strategy Interactor
			await deployedYieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractor.address);

			await deployedYieldSyncV1EMPStrategy.utilizedERC20Update(
				deployStrategies[i].strategyUtilizedERC20,
				deployStrategies[i].strategyUtilization
			);

			// Enable Deposits and Withdraws
			await deployedYieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle();

			expect(await deployedYieldSyncV1EMPStrategy.utilizedERC20DepositOpen()).to.be.true;

			await deployedYieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle();

			expect(await deployedYieldSyncV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.true;

			strategies[i] = {
				contract: deployedYieldSyncV1EMPStrategy,
				strategyTransferUtil: new StrategyTransferUtil(deployedYieldSyncV1EMPStrategy, eTHValueFeed)
			};
		}

		// Set the utilzation to 2 different strategies
		await eMP.utilizedYieldSyncV1EMPStrategyUpdate(
			[strategies[0].contract.address, strategies[1].contract.address] as UtilizedEMPStrategyUpdate,
			[PERCENT.FIFTY, PERCENT.FIFTY] as UtilizedEMPStrategyAllocationUpdate
		);

		// Turn on deposits
		await eMP.utilizedERC20DepositOpenToggle();

		eMPDepositAmounts = await eMPTransferUtil.calculateERC20Required(eTHValueEMPDepositAmount);

		eMPUtilizedERC20 = await eMP.utilizedERC20();

		// Approve the ERC20 tokens for the strategy interactor
		for (let i: number = 0; i < eMPUtilizedERC20.length; i++)
		{
			await (await ethers.getContractAt(LOCATION_MOCKERC20, eMPUtilizedERC20[i])).approve(
				eMP.address,
				eMPDepositAmounts[i]
			);
		}

		// Deposit the utilized ERC20 tokens into EMP
		await eMP.utilizedERC20Deposit(eMPDepositAmounts);

		depositAmount[0] = await strategies[0].strategyTransferUtil.calculateERC20Required(
			eTHValueEMPDepositAmount.mul(PERCENT.FIFTY).div(D_18)
		);

		depositAmount[1] = await strategies[1].strategyTransferUtil.calculateERC20Required(
			eTHValueEMPDepositAmount.mul(PERCENT.FIFTY).div(D_18)
		);

		// Pass incorrect length of deposit amounts
		await eMP.utilizedYieldSyncV1EMPStrategyDeposit([depositAmount[0], depositAmount[1]]);

		await eMP.utilizedERC20WithdrawOpenToggle();

		expect(await eMP.utilizedERC20WithdrawOpen()).to.be.true;
	});


	describe("function utilizedYieldSyncV1EMPStrategyWithdraw()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			await expect(eMP.connect(outsider).utilizedYieldSyncV1EMPStrategyWithdraw([])).to.be.rejectedWith(
				ERROR.NOT_AUTHORIZED
			);
		});

		it("Should revert invalid lengthed _yieldSyncV1EMPStrategyERC20Amount param passed..", async () => {
			await expect(eMP.utilizedYieldSyncV1EMPStrategyWithdraw([])).to.be.rejectedWith(
				ERROR.EMP.INVALID_STRATEGY_ERC20_AMOUNTS_LENGTH
			);
		});

		it("Should be able to withdraw ERC20 tokens from Strategy to EMP..", async () => {
			expect(await mockERC20A.balanceOf(eMP.address)).to.be.equal(ethers.utils.parseUnits('0', 18));

			expect(await mockERC20B.balanceOf(eMP.address)).to.be.equal(ethers.utils.parseUnits('0', 18));

			expect(await mockERC20C.balanceOf(eMP.address)).to.be.equal(ethers.utils.parseUnits('0', 18));

			await expect(
				eMP.utilizedYieldSyncV1EMPStrategyWithdraw([
					await strategies[0].contract.balanceOf(eMP.address),
					await strategies[1].contract.balanceOf(eMP.address),
				])
			).to.not.be.reverted;

			expect(await mockERC20A.balanceOf(eMP.address)).to.be.greaterThan(ethers.utils.parseUnits('0', 18));

			expect(await mockERC20B.balanceOf(eMP.address)).to.be.greaterThan(ethers.utils.parseUnits('0', 18));

			expect(await mockERC20C.balanceOf(eMP.address)).to.be.greaterThan(ethers.utils.parseUnits('0', 18));
		});

		describe("[indirect-call] function utilizedERC20Updated() - Utilized ERC20 tokens changed..", async () => {
			let eMPUtilizedERC20: string[];


			beforeEach(async () => {
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

				if (!await strategies[0].contract.utilizedERC20WithdrawOpen())
				{
					await strategies[0].contract.utilizedERC20WithdrawOpenToggle();
				}
			});


			it("Should update EMP's utilizedERC20 array to be a union of the strategy's utilizedERC20s..", async () => {
				await eMP.utilizedYieldSyncV1EMPStrategyWithdraw([
					await strategies[0].contract.balanceOf(eMP.address),
					await strategies[1].contract.balanceOf(eMP.address),
				]);

				eMPUtilizedERC20 = await eMP.utilizedERC20();

				expect(eMPUtilizedERC20.length).to.be.equal(2);
			});
		});
	});


	describe("function utilizedERC20Withdraw()", async () => {
		beforeEach(async () => {
			await eMP.utilizedYieldSyncV1EMPStrategyWithdraw([
				await strategies[0].contract.balanceOf(eMP.address),
				await strategies[1].contract.balanceOf(eMP.address),
			])
		});


		describe("Invalid", async () => {
			it("Should NOT allow withdrawing if not open..", async () => {
				/**
				* @notice This test is to check that depositing must be toggled on in order to call the function properly.
				*/

				await eMP.utilizedERC20WithdrawOpenToggle();

				expect(await eMP.utilizedERC20WithdrawOpen()).to.be.false;

				// Even if utilizedERC20Amounts, the function should revert with reason that deposits are NOT open
				await expect(eMP.utilizedERC20Withdraw(0)).to.be.rejectedWith(
					ERROR.EMP.WITHDRAW_NOT_OPEN
				);
			});

			it("Should not allow msg.sender to withdraw with EMP ERC20 that they do not have..", async () => {
				/**
				* @notice This test should test that msg.sender cannot withdraw more than what they have.
				*/

				// Expect that the owner address received something
				expect(await eMP.balanceOf(owner.address)).to.be.greaterThan(0);

				const INVALID_BALANCE = (await eMP.balanceOf(owner.address)).add(1);

				await expect(eMP.utilizedERC20Withdraw(INVALID_BALANCE)).to.be.rejectedWith(
					ERROR.EMP.INVALID_BALANCE
				);
			});
		});

		describe("Valid", async () => {
			it("Should allow withdrawing tokens from strategy..", async () => {
				/**
				* @notice This test should test that msg.sender cannot withdraw more than what they have.
				*/

				// Expect that the owner address received something
				expect(await eMP.balanceOf(owner.address)).to.be.greaterThan(0);

				const VALID_BALANCE = await eMP.balanceOf(owner.address);

				await eMP.utilizedERC20Withdraw(VALID_BALANCE);

				expect(await eMP.balanceOf(owner.address)).to.be.equal(0);

				// Expect that the strategy tokens are burnt after withdrawing
				expect(await strategies[0].contract.balanceOf(eMP.address)).to.be.equal(0);
				expect(await strategies[1].contract.balanceOf(eMP.address)).to.be.equal(0);
			});
		});


		describe("[indirect-call] function utilizedERC20Updated() - Utilized ERC20 tokens changed..", async () => {
			let eMPUtilizedERC20: string[];


			beforeEach(async () => {
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

				if (!await strategies[0].contract.utilizedERC20WithdrawOpen())
				{
					await strategies[0].contract.utilizedERC20WithdrawOpenToggle();
				}
			});


			it("Should update EMP's utilizedERC20 array to be a union of the strategy's utilizedERC20s..", async () => {
				const VALID_BALANCE = await eMP.balanceOf(owner.address);

				await eMP.utilizedERC20Withdraw(VALID_BALANCE);

				eMPUtilizedERC20 = await eMP.utilizedERC20();

				expect(eMPUtilizedERC20.length).to.be.equal(2);
			});
		});
	});
});
