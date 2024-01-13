const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

const ERROR_NOT_MANAGER = "Manager != msg.sender";
const ERROR_INVALID_PURPOSE_LENGTH = "__utilizedERC20.length != _purpose.length";
const ERROR_INVALID_ALLOCATION = "_utilizedERC20AllocationTotal != ONE_HUNDRED_PERCENT";
const ERROR_ETH_FEED_NOT_SET = "address(iYieldSyncV1EMPETHValueFeed) == address(0)";
const ERROR_STRATEGY_NOT_SET = "address(iYieldSyncV1EMPStrategyInteractor) == address(0)";
const ERROR_NOT_COMPUTED = "!computed";

const HUNDRED_PERCENT = ethers.utils.parseUnits('1', 18);
const FIFTY_PERCENT = ethers.utils.parseUnits('.5', 18);
const TWENTY_FIVE_PERCENT = ethers.utils.parseUnits('.25', 18);
const ZERO_PERCENT = ethers.utils.parseUnits('0', 18);


describe("[0.0] YieldSyncV1EMPStrategy.sol - Setup", async () =>
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

		await expect(
			yieldSyncV1EMPRegistry.yieldSynV1EMPDeployer_yieldSyncV1EMP_registeredUpdate(OWNER.address)
		).to.not.be.reverted;

		yieldSyncV1EMPStrategy = await (
			await YieldSyncV1EMPStrategy.deploy(
				// For now set the deployer as OWNER to bypass auth
				OWNER.address,
				yieldSyncV1EMPRegistry.address,
				OWNER.address,
				"Exampe",
				"EX"
			)
		).deployed();
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
						[[true, true, HUNDRED_PERCENT]]
					)
				).to.be.rejectedWith(ERROR_NOT_MANAGER);
			}
		);

		it(
			"Should revert when invalid purpose.length passed..",
			async () =>
			{
				// Keep in mind at this point utilizedTokens is an empty array
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate([], [[true, true, FIFTY_PERCENT],])
				).to.be.rejectedWith(ERROR_INVALID_PURPOSE_LENGTH);
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
						purpose: [[true, true, FIFTY_PERCENT],]
					},
					{
						addresses: [mockERC20A.address,],
						purpose: [[true, false, FIFTY_PERCENT],]
					},
					{
						addresses: [mockERC20A.address,],
						purpose: [[false, false, FIFTY_PERCENT],]
					},
					{
						addresses: [mockERC20A.address,],
						purpose: [[false, true, HUNDRED_PERCENT],]
					},
					{
						addresses: [mockERC20A.address,],
						purpose: [[false, false, HUNDRED_PERCENT],]
					},
					{
						addresses: [mockERC20A.address, mockERC20B.address],
						purpose: [[true, true, FIFTY_PERCENT], [true, true, TWENTY_FIVE_PERCENT]]
					},
					{
						addresses: [mockERC20A.address, mockERC20B.address],
						purpose: [[false, true, FIFTY_PERCENT], [true, true, FIFTY_PERCENT]]
					}
				];

				for (let i = 0; i < INVALID_ALLOCATIONS.length; i++)
				{
					const _YSS = await (
						await (await ethers.getContractFactory("YieldSyncV1EMPStrategy")).deploy(
							OWNER.address,
							yieldSyncV1EMPRegistry.address,
							OWNER.address,
							"Exampe",
							"EX"
						)
					).deployed();

					await expect(
						_YSS.utilizedERC20AndPurposeUpdate(INVALID_ALLOCATIONS[i].addresses, INVALID_ALLOCATIONS[i].purpose)
					).to.be.rejectedWith(ERROR_INVALID_ALLOCATION);
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
						purpose: [[true, true, FIFTY_PERCENT], [true, true, FIFTY_PERCENT,]],
					},
					{
						addresses: [mockERC20A.address, mockERC20B.address, mockERC20C.address,],
						purpose: [[false, true, ZERO_PERCENT], [true, true, FIFTY_PERCENT], [true, true, FIFTY_PERCENT]]
					},
					// Even if withdraw token is set to 100% it should be accepted
					{
						addresses: [mockERC20A.address, mockERC20B.address, mockERC20C.address,],
						purpose: [[false, true, HUNDRED_PERCENT], [true, true, FIFTY_PERCENT], [true, true, FIFTY_PERCENT]]
					},
				];

				for (let i = 0; i < VALID_ALLOCATION.length; i++)
				{
					const _YSS = await (
						await (await ethers.getContractFactory("YieldSyncV1EMPStrategy")).deploy(
							OWNER.address,
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
				).to.be.rejectedWith(ERROR_NOT_MANAGER);
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
				).to.be.rejectedWith(ERROR_NOT_MANAGER);
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

	describe("function utilizedERC20AmountPerBurn()", async () =>
	{
		it(
			"[modifier] Should revert if ETH FEED is not set..",
			async () =>
			{
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20AmountPerBurn()
				).to.be.rejectedWith(ERROR_ETH_FEED_NOT_SET);
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
					yieldSyncV1EMPStrategy.utilizedERC20AmountPerBurn()
				).to.be.rejectedWith(ERROR_STRATEGY_NOT_SET);
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
				).to.be.rejectedWith(ERROR_NOT_MANAGER);
			}
		);

		it(
			"[modifier] Should revert if ETH FEED is not set..",
			async () =>
			{
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()
				).to.be.rejectedWith(ERROR_ETH_FEED_NOT_SET);
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
				).to.be.rejectedWith(ERROR_STRATEGY_NOT_SET);
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
						[[true, true, HUNDRED_PERCENT]]
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

	describe("function utilizedERC20WithdrawOpenToggle()", async () =>
	{
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () =>
			{
				const [, ADDR_1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.connect(ADDR_1).utilizedERC20WithdrawOpenToggle()
				).to.be.rejectedWith(ERROR_NOT_MANAGER);
			}
		);

		it(
			"[modifier] Should revert if ETH FEED is not set..",
			async () =>
			{
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle()
				).to.be.rejectedWith(ERROR_ETH_FEED_NOT_SET);
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
				).to.be.rejectedWith(ERROR_STRATEGY_NOT_SET);
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
						[[true, true, HUNDRED_PERCENT]]
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
