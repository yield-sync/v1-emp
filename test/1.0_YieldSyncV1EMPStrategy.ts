const { ethers } = require("hardhat");


import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";

import { ERROR, PERCENT } from "../common";


describe("[1.0] YieldSyncV1EMPStrategy.sol - Setup", async () =>
{
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;
	let eTHValueFeedDummy: Contract;
	let strategyInteractorDummy: Contract;
	let yieldSyncV1EMPRegistry: Contract;
	let yieldSyncV1EMPStrategy: Contract;


	beforeEach("[beforeEach] Set up contracts..", async () =>
	{
		const [OWNER] = await ethers.getSigners();

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");
		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");
		const YieldSyncV1EMPStrategy: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategy");

		mockERC20A = await (await MockERC20.deploy()).deployed();
		mockERC20B = await (await MockERC20.deploy()).deployed();
		mockERC20C = await (await MockERC20.deploy()).deployed();
		eTHValueFeedDummy = await (await ETHValueFeedDummy.deploy()).deployed();
		strategyInteractorDummy = await (await StrategyInteractorDummy.deploy()).deployed();
		yieldSyncV1EMPRegistry = await (await YieldSyncV1EMPRegistry.deploy()).deployed();

		// Mock owner being an EMP Deployer
		await expect(
			yieldSyncV1EMPRegistry.yieldSyncV1EMPDeployerUpdate(OWNER.address)
		).to.not.be.reverted;

		// Mock owner being an EMP
		await expect(
			yieldSyncV1EMPRegistry.yieldSyncV1EMPRegister(OWNER.address)
		).to.not.be.reverted;

		yieldSyncV1EMPStrategy = await (
			await YieldSyncV1EMPStrategy.deploy(
				yieldSyncV1EMPRegistry.address,
				OWNER.address,
				"Exampe",
				"EX"
			)
		).deployed();
	});


	describe("function managerUpdate()", async () =>
	{
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () =>
			{
				const [, ADDR_1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.connect(ADDR_1).managerUpdate(ADDR_1.address)
				).to.be.rejectedWith(ERROR.NOT_MANAGER);
			}
		);

		it(
			"Should alow manager to be changed..",
			async () =>
			{
				const [, ADDR_1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.managerUpdate(ADDR_1.address)
				).to.be.not.reverted;

				expect(await yieldSyncV1EMPStrategy.manager()).to.be.equal(ADDR_1.address);
			}
		);
	});

	describe("function utilizedERC20AndPurposeUpdate()", async () =>
	{
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () =>
			{
				const [, ADDR_1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.connect(ADDR_1).utilizedERC20AndPurposeUpdate(
						[mockERC20A.address],
						[[true, true, PERCENT.HUNDRED]]
					)
				).to.be.rejectedWith(ERROR.NOT_MANAGER);
			}
		);

		it(
			"Should revert when invalid purpose.length passed..",
			async () =>
			{
				// Keep in mind at this point utilizedTokens is an empty array
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate([], [[true, true, PERCENT.FIFTY],])
				).to.be.rejectedWith(ERROR.INVALID_PURPOSE_LENGTH);
			}
		);

		it(
			"Should revert when INVALID allocation passed..",
			async () =>
			{
				const [OWNER] = await ethers.getSigners();

				const INVALID_ALLOCATIONS = [
					{
						addresses: [mockERC20A.address,],
						purpose: [[true, true, PERCENT.FIFTY],]
					},
					{
						addresses: [mockERC20A.address,],
						purpose: [[true, false, PERCENT.FIFTY],]
					},
					{
						addresses: [mockERC20A.address,],
						purpose: [[false, false, PERCENT.FIFTY],]
					},
					{
						addresses: [mockERC20A.address,],
						purpose: [[false, true, PERCENT.HUNDRED],]
					},
					{
						addresses: [mockERC20A.address,],
						purpose: [[false, false, PERCENT.HUNDRED],]
					},
					{
						addresses: [mockERC20A.address, mockERC20B.address],
						purpose: [[true, true, PERCENT.FIFTY], [true, true, PERCENT.TWENTY_FIVE]]
					},
					{
						addresses: [mockERC20A.address, mockERC20B.address],
						purpose: [[false, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]]
					}
				];

				for (let i = 0; i < INVALID_ALLOCATIONS.length; i++)
				{
					const _YSS = await (
						await (await ethers.getContractFactory("YieldSyncV1EMPStrategy")).deploy(
							yieldSyncV1EMPRegistry.address,
							OWNER.address,
							"Exampe",
							"EX"
						)
					).deployed();

					await expect(
						_YSS.utilizedERC20AndPurposeUpdate(INVALID_ALLOCATIONS[i].addresses, INVALID_ALLOCATIONS[i].purpose)
					).to.be.rejectedWith(ERROR.INVALID_ALLOCATION);
				}
			}
		);

		it(
			"Should not revert when VALID allocation passed..",
			async () =>
			{
				const [OWNER] = await ethers.getSigners();

				const VALID_ALLOCATION = [
					{
						addresses: [mockERC20A.address, mockERC20B.address],
						purpose: [[true, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY,]],
					},
					{
						addresses: [mockERC20A.address, mockERC20B.address, mockERC20C.address,],
						purpose: [[false, true, PERCENT.ZERO], [true, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]]
					},
					// Even if withdraw token is set to 100% it should be accepted
					{
						addresses: [mockERC20A.address, mockERC20B.address, mockERC20C.address,],
						purpose: [[false, true, PERCENT.HUNDRED], [true, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]]
					},
				];

				for (let i = 0; i < VALID_ALLOCATION.length; i++)
				{
					const _YSS = await (
						await (await ethers.getContractFactory("YieldSyncV1EMPStrategy")).deploy(
							yieldSyncV1EMPRegistry.address,
							OWNER.address,
							"Exampe",
							"EX"
						)
					).deployed();

					await expect(
						_YSS.utilizedERC20AndPurposeUpdate(VALID_ALLOCATION[i].addresses, VALID_ALLOCATION[i].purpose)
					).to.be.not.reverted;

					for (let ii = 0; ii < VALID_ALLOCATION[i].addresses.length; ii++)
					{
						const v = VALID_ALLOCATION[i];
						const u = (await _YSS.utilizedERC20())[ii];
						const p = await _YSS.utilizedERC20_purpose(u);

						expect(u).to.be.equal(v.addresses[ii]);
						expect(p.deposit).to.be.equal(v.purpose[ii][0]);
						expect(p.withdraw).to.be.equal(v.purpose[ii][1]);
						expect(p.allocation.eq(v.purpose[ii][2])).to.be.true;
					}
				}
			}
		);
	});

	describe("function iYieldSyncV1EMPETHValueFeedUpdate()", async () =>
	{
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () =>
			{
				const [, ADDR_1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.connect(ADDR_1).iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.be.rejectedWith(ERROR.NOT_MANAGER);
			}
		);

		it(
			"Should be able to set yieldSyncV1EMPETHValueFeed..",
			async () =>
			{
				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				expect(await yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeed()).to.be.equal(eTHValueFeedDummy.address);
			}
		);
	});

	describe("function iYieldSyncV1EMPStrategyInteractorUpdate()", async () =>
	{
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () =>
			{
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
			async () =>
			{
				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
				).to.not.be.reverted;

				expect(await yieldSyncV1EMPStrategy.iYieldSyncV1EMPStrategyInteractor()).to.be.equal(
					strategyInteractorDummy.address
				);
			}
		);
	});

	describe("function utilizedERC20DepositOpenToggle()", async () =>
	{
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () =>
			{
				const [, ADDR_1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.connect(ADDR_1).utilizedERC20DepositOpenToggle()
				).to.be.rejectedWith(ERROR.NOT_MANAGER);
			}
		);

		it(
			"[modifier] Should revert if ETH FEED is not set..",
			async () =>
			{
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()
				).to.be.rejectedWith(ERROR.ETH_FEED_NOT_SET);
			}
		);

		it(
			"[modifier] Should revert if strategy is not set..",
			async () =>
			{
				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()
				).to.be.rejectedWith(ERROR.STRATEGY_NOT_SET);
			}
		);

		it(
			"Should toogle utilizedERC20DepositOpen..",
			async () =>
			{
				// Initialize strategy with mock ERC20
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
						[mockERC20A.address],
						[[true, true, PERCENT.HUNDRED]]
					)
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
			}
		);
	});

	describe("function iYieldSyncV1EMPETHValueFeedUpdate() AND function utilizedERC20DepositOpenToggle()", async () =>
	{
		it(
			"Should not be able to set iYieldSyncV1EMPETHValueFeed when utilizedERC20DepositOpen is true..",
			async () =>
			{
				// Initialize strategy with mock ERC20
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
						[mockERC20A.address],
						[[true, true, PERCENT.HUNDRED]]
					)
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
			async () =>
			{
				// Initialize strategy with mock ERC20
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
						[mockERC20A.address],
						[[true, true, PERCENT.HUNDRED]]
					)
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

	describe("function iYieldSyncV1EMPStrategyInteractorUpdate() AND function utilizedERC20DepositOpenToggle()", async () =>
	{
		it(
			"Should not be able to set iYieldSyncV1EMPStrategyInteractor when utilizedERC20DepositOpen is true..",
			async () =>
			{
				// Initialize strategy with mock ERC20
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
						[mockERC20A.address],
						[[true, true, PERCENT.HUNDRED]]
					)
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
			async () =>
			{
				// Initialize strategy with mock ERC20
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
						[mockERC20A.address],
						[[true, true, PERCENT.HUNDRED]]
					)
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

	describe("function utilizedERC20WithdrawOpenToggle()", async () =>
	{
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () =>
			{
				const [, ADDR_1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.connect(ADDR_1).utilizedERC20WithdrawOpenToggle()
				).to.be.rejectedWith(ERROR.NOT_MANAGER);
			}
		);

		it(
			"[modifier] Should revert if ETH FEED is not set..",
			async () =>
			{
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle()
				).to.be.rejectedWith(ERROR.ETH_FEED_NOT_SET);
			}
		);

		it(
			"[modifier] Should revert if strategy is not set..",
			async () =>
			{
				await expect(
					yieldSyncV1EMPStrategy.iYieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle()
				).to.be.rejectedWith(ERROR.STRATEGY_NOT_SET);
			}
		);

		it(
			"Should toogle utilizedERC20WithdrawOpen..",
			async () =>
			{
				// Initialize strategy with mock ERC20
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
						[mockERC20A.address],
						[[true, true, PERCENT.HUNDRED]]
					)
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
