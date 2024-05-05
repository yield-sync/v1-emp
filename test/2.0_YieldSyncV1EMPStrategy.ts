const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";

import { ERROR, PERCENT } from "../const";


describe("[2.0] YieldSyncV1EMPStrategy.sol - Setup", async () => {
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;
	let eTHValueFeedDummy: Contract;
	let strategyInteractorDummy: Contract;
	let yieldSyncV1EMPRegistry: Contract;
	let yieldSyncV1EMPStrategy: Contract;
	let yieldSyncV1EMPStrategyDeployer: Contract;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		/**
		* This process mocks the OWNER address to be an EMP to give authorization to access the functions of a strategy.
		*
		*/
		const [OWNER] = await ethers.getSigners();

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");
		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");
		const YieldSyncV1EMPStrategy: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategy");
		const YieldSyncV1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategyDeployer");

		mockERC20A = await (await MockERC20.deploy()).deployed();
		mockERC20B = await (await MockERC20.deploy()).deployed();
		mockERC20C = await (await MockERC20.deploy()).deployed();
		eTHValueFeedDummy = await (await ETHValueFeedDummy.deploy()).deployed();
		strategyInteractorDummy = await (await StrategyInteractorDummy.deploy()).deployed();
		yieldSyncV1EMPRegistry = await (await YieldSyncV1EMPRegistry.deploy(OWNER.address)).deployed();
		yieldSyncV1EMPStrategyDeployer = await (
			await YieldSyncV1EMPStrategyDeployer.deploy(yieldSyncV1EMPRegistry.address)
		).deployed();

		// Mock owner being an EMP Deployer
		await expect(
			yieldSyncV1EMPRegistry.yieldSyncV1EMPDeployerUpdate(OWNER.address)
		).to.not.be.reverted;

		// Mock owner being an EMP for authorization
		await expect(
			yieldSyncV1EMPRegistry.yieldSyncV1EMPRegister(OWNER.address)
		).to.not.be.reverted;

		// Set EMP Strategy Deployer on registry
		await expect(
			yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyDeployerUpdate(yieldSyncV1EMPStrategyDeployer.address)
		).to.not.be.reverted;

		await expect(
			yieldSyncV1EMPStrategyDeployer.deployYieldSyncV1EMPStrategy("Strategy", "S")
		).to.be.not.reverted;

		expect(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(1)).to.be.not.equal(
			ethers.constants.AddressZero
		);

		// Attach the deployed YieldSyncV1EMPStrategy address
		yieldSyncV1EMPStrategy = await YieldSyncV1EMPStrategy.attach(
			String(await yieldSyncV1EMPRegistry.yieldSyncV1EMPStrategyId_yieldSyncV1EMPStrategy(1))
		);
	});


	describe("function managerUpdate()", async () => {
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () => {
				const [, ADDR_1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.connect(ADDR_1).managerUpdate(ADDR_1.address)
				).to.be.rejectedWith(ERROR.NOT_MANAGER);
			}
		);

		it(
			"Should allow manager to be changed..",
			async () => {
				const [, ADDR_1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.managerUpdate(ADDR_1.address)
				).to.be.not.reverted;

				expect(await yieldSyncV1EMPStrategy.manager()).to.be.equal(ADDR_1.address);
			}
		);
	});

	describe("function utilizedERC20Update()", async () => {
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () => {
				const [, ADDR_1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.connect(ADDR_1).utilizedERC20Update(
						[[mockERC20A.address, true, true, PERCENT.HUNDRED]]
					)
				).to.be.rejectedWith(ERROR.NOT_MANAGER);
			}
		);

		it(
			"Should revert when INVALID allocation passed..",
			async () => {
				const [OWNER] = await ethers.getSigners();

				const INVALID_ALLOCATIONS: StrategyUtilizedERC20[] = [
					[[mockERC20A.address, true, true, PERCENT.FIFTY]],
					[[mockERC20A.address, true, false, PERCENT.FIFTY]],
					[[mockERC20A.address, false, false, PERCENT.FIFTY]],
					[[mockERC20A.address, false, true, PERCENT.HUNDRED]],
					[[mockERC20A.address, false, false, PERCENT.HUNDRED]],
					[
						[mockERC20A.address, true, true, PERCENT.FIFTY],
						[mockERC20B.address, true, true, PERCENT.TWENTY_FIVE]
					],
					[[mockERC20A.address, false, true, PERCENT.FIFTY], [mockERC20B.address, true, true, PERCENT.FIFTY]]
				];

				for (let i: number = 0; i < INVALID_ALLOCATIONS.length; i++)
				{
					const _YSS = await (
						await (await ethers.getContractFactory("YieldSyncV1EMPStrategy")).deploy(
							OWNER.address,
							yieldSyncV1EMPRegistry.address,
							"Exampe",
							"EX"
						)
					).deployed();

					await expect(_YSS.utilizedERC20Update(INVALID_ALLOCATIONS[i])).to.be.rejectedWith(
						ERROR.INVALID_ALLOCATION
					);
				}
			}
		);

		it(
			"Should not revert when VALID allocation passed..",
			async () => {
				const [OWNER] = await ethers.getSigners();

				const VALID_ALLOCATION: StrategyUtilizedERC20[] = [
					[
						[mockERC20A.address, true, true, PERCENT.FIFTY],
						[mockERC20B.address, true, true, PERCENT.FIFTY],
					],
					[
						[mockERC20A.address, false, true, PERCENT.ZERO],
						[mockERC20B.address, true, true, PERCENT.FIFTY],
						[mockERC20C.address, true, true, PERCENT.FIFTY],
					],
					// Even if withdraw token is set to 100% it should be accepted
					[
						[mockERC20A.address, false, true, PERCENT.HUNDRED],
						[mockERC20B.address, true, true, PERCENT.FIFTY],
						[mockERC20C.address, true, true, PERCENT.FIFTY],
					],
				];

				for (let i: number = 0; i < VALID_ALLOCATION.length; i++)
				{
					const _YSS = await (
						await (await ethers.getContractFactory("YieldSyncV1EMPStrategy")).deploy(
							OWNER.address,
							yieldSyncV1EMPRegistry.address,
							"Exampe",
							"EX"
						)
					).deployed();

					await expect(_YSS.utilizedERC20Update(VALID_ALLOCATION[i])).to.be.not.reverted;

					const utilizedERC20 = await _YSS.utilizedERC20();

					await expect(utilizedERC20.length).to.be.equal(VALID_ALLOCATION[i].length);

					for (let ii: number = 0; ii < VALID_ALLOCATION[i].length; ii++)
					{
						const allocation = VALID_ALLOCATION[i][ii];
						const utilizedERC20 = (await _YSS.utilizedERC20())[ii];

						expect(utilizedERC20.eRC20).to.be.equal(allocation[0]);
						expect(utilizedERC20.deposit).to.be.equal(allocation[1]);
						expect(utilizedERC20.withdraw).to.be.equal(allocation[2]);
						expect(utilizedERC20.allocation.eq(allocation[3])).to.be.true;
					}
				}
			}
		);
	});

	describe("function iYieldSyncV1EMPETHValueFeedUpdate()", async () => {
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () => {
				const [, ADDR_1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.connect(ADDR_1).iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.be.rejectedWith(ERROR.NOT_MANAGER);
			}
		);

		it(
			"Should be able to set yieldSyncV1EMPETHValueFeed..",
			async () => {
				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				expect(await yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeed()).to.be.equal(eTHValueFeedDummy.address);
			}
		);
	});

	describe("function iYieldSyncV1EMPStrategyInteractorUpdate()", async () => {
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () => {
				const [, ADDR_1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.connect(ADDR_1).iYieldSyncV1EMPStrategyInteractorUpdate(
						strategyInteractorDummy.address
					)
				).to.be.rejectedWith(ERROR.NOT_MANAGER);
			}
		);

		it(
			"Should be able to set iYieldSyncV1EMPStrategyInteractor..",
			async () => {
				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
				).to.not.be.reverted;

				expect(await yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractor()).to.be.equal(
					strategyInteractorDummy.address
				);
			}
		);
	});

	describe("function utilizedERC20DepositOpenToggle()", async () => {
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () => {
				const [, ADDR_1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.connect(ADDR_1).utilizedERC20DepositOpenToggle()
				).to.be.rejectedWith(ERROR.NOT_MANAGER);
			}
		);

		it(
			"[modifier] Should revert if ETH FEED is not set..",
			async () => {
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()
				).to.be.rejectedWith(ERROR.ETH_FEED_NOT_SET);
			}
		);

		it(
			"[modifier] Should revert if strategy is not set..",
			async () => {
				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()
				).to.be.rejectedWith(ERROR.STRATEGY_NOT_SET);
			}
		);

		it(
			"Should toggle utilizedERC20DepositOpen..",
			async () => {
				// Initialize strategy with mock ERC20
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Update([[mockERC20A.address, true, true, PERCENT.HUNDRED]])
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
				).to.not.be.reverted;

				expect(await yieldSyncV1EMPStrategy.utilizedERC20DepositOpen()).to.be.false;

				await expect(yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()).to.be.not.reverted;

				expect(await yieldSyncV1EMPStrategy.utilizedERC20DepositOpen()).to.be.true;
			}
		);
	});

	describe("function iYieldSyncV1EMPETHValueFeedUpdate() AND function utilizedERC20DepositOpenToggle()", async () => {
		it(
			"Should not be able to set iYieldSyncV1EMPETHValueFeed when utilizedERC20DepositOpen is true..",
			async () => {
				// Initialize strategy with mock ERC20
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Update([[mockERC20A.address, true, true, PERCENT.HUNDRED]])
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
				).to.not.be.reverted;

				expect(await yieldSyncV1EMPStrategy.utilizedERC20DepositOpen()).to.be.false;

				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()
				).to.be.not.reverted;

				expect(await yieldSyncV1EMPStrategy.utilizedERC20DepositOpen()).to.be.true;

				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(strategyInteractorDummy.address)
				).to.be.revertedWith(ERROR.UTILIZED_ERC20_DEPOSIT_OPEN);
			}
		);

		it(
			"Should not be able to set iYieldSyncV1EMPETHValueFeed when utilizedERC20DepositOpen is true..",
			async () => {
				// Initialize strategy with mock ERC20
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Update([[mockERC20A.address, true, true, PERCENT.HUNDRED]])
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
				).to.not.be.reverted;

				expect(await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.false;

				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle()
				).to.be.not.reverted;

				expect(await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.true;

				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(strategyInteractorDummy.address)
				).to.be.revertedWith(ERROR.UTILIZED_ERC20_DEPOSIT_OPEN);
			}
		);
	});

	describe("function iYieldSyncV1EMPStrategyInteractorUpdate() AND function utilizedERC20DepositOpenToggle()", async () => {
		it(
			"Should not be able to set iYieldSyncV1EMPStrategyInteractor when utilizedERC20DepositOpen is true..",
			async () => {
				// Initialize strategy with mock ERC20
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Update([[mockERC20A.address, true, true, PERCENT.HUNDRED]])
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
				).to.not.be.reverted;

				expect(await yieldSyncV1EMPStrategy.utilizedERC20DepositOpen()).to.be.false;

				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()
				).to.be.not.reverted;

				expect(await yieldSyncV1EMPStrategy.utilizedERC20DepositOpen()).to.be.true;

				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
				).to.be.revertedWith(ERROR.UTILIZED_ERC20_DEPOSIT_OPEN);
			}
		);

		it(
			"Should not be able to set iYieldSyncV1EMPStrategyInteractor when utilizedERC20WithdrawOpen is true..",
			async () => {
				// Initialize strategy with mock ERC20
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Update([[mockERC20A.address, true, true, PERCENT.HUNDRED]])
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
				).to.not.be.reverted;

				expect(await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.false;

				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle()
				).to.be.not.reverted;

				expect(await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.true;

				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
				).to.be.revertedWith(ERROR.UTILIZED_ERC20_DEPOSIT_OPEN);
			}
		);
	});

	describe("function utilizedERC20WithdrawOpenToggle()", async () => {
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () => {
				const [, ADDR_1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.connect(ADDR_1).utilizedERC20WithdrawOpenToggle()
				).to.be.rejectedWith(ERROR.NOT_MANAGER);
			}
		);

		it(
			"[modifier] Should revert if ETH FEED is not set..",
			async () => {
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle()
				).to.be.rejectedWith(ERROR.ETH_FEED_NOT_SET);
			}
		);

		it(
			"[modifier] Should revert if strategy is not set..",
			async () => {
				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle()
				).to.be.rejectedWith(ERROR.STRATEGY_NOT_SET);
			}
		);

		it(
			"Should toggle utilizedERC20WithdrawOpen..",
			async () => {
				// Initialize strategy with mock ERC20
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20Update([[mockERC20A.address, true, true, PERCENT.HUNDRED]])
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
				).to.not.be.reverted;

				expect(await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.false;

				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle()
				).to.be.not.reverted;

				expect(await yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpen()).to.be.true;
			}
		);
	});
});
