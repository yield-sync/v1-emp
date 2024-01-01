const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

const ERROR_NOT_MANAGER = "manager != msg.sender";
const ERROR_INVALID_PURPOSE_LENGTH = "__utilizedERC20.length != _purpose.length";
const ERROR_INVALID_ALLOCATION = "_utilizedERC20AllocationTotal != ONE_HUNDRED_PERCENT";
const ERROR_ETH_FEED_NOT_SET = "address(yieldSyncV1EMPETHValueFeed) == address(0)";
const ERROR_STRATEGY_NOT_SET = "address(yieldSyncV1EMPStrategyInteractor) == address(0)";

const HUNDRED_PERCENT = ethers.utils.parseUnits('1', 18);
const FIFTY_PERCENT = ethers.utils.parseUnits('.5', 18);
const TWENTY_FIVE_PERCENT = ethers.utils.parseUnits('.25', 18);
const ZERO_PERCENT = ethers.utils.parseUnits('0', 18);


describe("[0.0] YieldSyncV1EMPStrategy.sol - Setup", async ()  =>
{
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;
	let eTHValueFeedDummy: Contract;
	let strategyInteractorDummy: Contract;
	let yieldSyncV1EMPStrategy: Contract;


	beforeEach("[beforeEach] Set up contracts..", async ()  =>
	{
		const [owner] = await ethers.getSigners();

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const ETHValueFeedDummy: ContractFactory = await ethers.getContractFactory("ETHValueFeedDummy");
		const StrategyInteractorDummy: ContractFactory = await ethers.getContractFactory("StrategyInteractorDummy");
		const YieldSyncV1EMPStrategy: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPStrategy");

		mockERC20A = await (await MockERC20.deploy()).deployed();
		mockERC20B = await (await MockERC20.deploy()).deployed();
		mockERC20C = await (await MockERC20.deploy()).deployed();
		eTHValueFeedDummy = await (await ETHValueFeedDummy.deploy()).deployed();
		strategyInteractorDummy = await (await StrategyInteractorDummy.deploy()).deployed();
		yieldSyncV1EMPStrategy = await (await YieldSyncV1EMPStrategy.deploy(owner.address, "Exampe", "EX")).deployed();
	});


	describe("function utilizedERC20AndPurposeUpdate()", async () =>
	{
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async ()  =>
			{
				const [, addr1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.connect(addr1).utilizedERC20AndPurposeUpdate(
						[mockERC20A.address],
						[[true, true, HUNDRED_PERCENT]]
					)
				).to.be.rejectedWith(ERROR_NOT_MANAGER);
			}
		);

		it(
			"Should revert when invalid purpose.length passed..",
			async ()  =>
			{
				// Keep in mind at this point utilizedTokens is an empty array
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate([], [[true, true, FIFTY_PERCENT],])
				).to.be.rejectedWith(ERROR_INVALID_PURPOSE_LENGTH);
			}
		);

		it(
			"Should revert when INVALID allocation passed..",
			async ()  =>
			{
				const [owner] = await ethers.getSigners();

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
					const _yieldSyncV1EMPStrategy = await (
						await (await ethers.getContractFactory("YieldSyncV1EMPStrategy")).deploy(
							owner.address,
							"Exampe",
							"EX"
						)
					).deployed();

					await expect(
						_yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
							INVALID_ALLOCATIONS[i].addresses,
							INVALID_ALLOCATIONS[i].purpose,
						)
					).to.be.rejectedWith(ERROR_INVALID_ALLOCATION);
				}
			}
		);

		it(
			"Should not revert when VALID allocation passed..",
			async ()  =>
			{
				const [owner] = await ethers.getSigners();

				const VALID_ALLOCATION = [
					{
						addresses: [mockERC20A.address, mockERC20B.address],
						purpose: [[true, true, FIFTY_PERCENT], [true, true, FIFTY_PERCENT,]],
					},
					{
						addresses: [mockERC20A.address, mockERC20B.address, mockERC20C.address,],
						purpose: [[false, true, ZERO_PERCENT], [true, true, FIFTY_PERCENT], [true, true, FIFTY_PERCENT]]
					},
					{
						addresses: [mockERC20A.address, mockERC20B.address, mockERC20C.address,],
						purpose: [[false, true, HUNDRED_PERCENT], [true, true, FIFTY_PERCENT], [true, true, FIFTY_PERCENT]]
					},
				];

				for (let i = 0; i < VALID_ALLOCATION.length; i++)
				{
					const _yieldSyncV1EMPStrategy = await (
						await (await ethers.getContractFactory("YieldSyncV1EMPStrategy")).deploy(
							owner.address,
							"Exampe",
							"EX"
						)
					).deployed();

					await expect(
						_yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
							VALID_ALLOCATION[i].addresses,
							VALID_ALLOCATION[i].purpose
						)
					).to.be.not.reverted;

					for (let ii = 0; ii < VALID_ALLOCATION[i].addresses.length; ii++)
					{
						const v = VALID_ALLOCATION[i];
						const u = (await _yieldSyncV1EMPStrategy.utilizedERC20())[ii];
						const p = await _yieldSyncV1EMPStrategy.utilizedERC20_purpose(u);

						expect(u).to.be.equal(v.addresses[ii]);
						expect(p.deposit).to.be.equal(v.purpose[ii][0]);
						expect(p.withdraw).to.be.equal(v.purpose[ii][1]);
						expect(p.allocation.eq(v.purpose[ii][2])).to.be.true;
					}
				}
			}
		);
	});

	describe("function yieldSyncV1EMPETHValueFeedUpdate()", async () =>
	{
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async ()  =>
			{
				const [, addr1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.connect(addr1).yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.be.rejectedWith(ERROR_NOT_MANAGER);
			}
		);

		it(
			"Should be able to set yieldSyncV1EMPETHValueFeed..",
			async ()  =>
			{
				await expect(
					yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				expect(await yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeed()).to.be.equal(eTHValueFeedDummy.address);
			}
		);
	});

	describe("function yieldSyncV1EMPStrategyInteractorUpdate()", async () =>
	{
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async ()  =>
			{
				const [, addr1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.connect(addr1).yieldSyncV1EMPStrategyInteractorUpdate(
						strategyInteractorDummy.address
					)
				).to.be.rejectedWith(ERROR_NOT_MANAGER);
			}
		);

		it(
			"Should be able to set yieldSyncV1EMPStrategyInteractor..",
			async ()  =>
			{
				await expect(
					yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
				).to.not.be.reverted;

				expect(await yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractor()).to.be.equal(
					strategyInteractorDummy.address
				);
			}
		);
	});

	describe("function balanceOfETHValue()", async () =>
	{
		it(
			"Should revert if ETH FEED is not set..",
			async ()  =>
			{
				const [owner] = await ethers.getSigners();

				await expect(yieldSyncV1EMPStrategy.balanceOfETHValue(owner.address)).to.be.rejectedWith(
					ERROR_ETH_FEED_NOT_SET
				);
			}
		);

		it(
			"Should revert if strategy is not set..",
			async ()  =>
			{
				const [owner] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				await expect(yieldSyncV1EMPStrategy.balanceOfETHValue(owner.address)).to.be.rejectedWith(
					ERROR_STRATEGY_NOT_SET
				);
			}
		)
	});

	describe("function utilizedERC20AmountPerBurn()", async () =>
	{
		it(
			"Should revert if ETH FEED is not set..",
			async ()  =>
			{
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20AmountPerBurn()
				).to.be.rejectedWith(ERROR_ETH_FEED_NOT_SET);
			}
		);

		it(
			"Should revert if strategy is not set..",
			async ()  =>
			{
				await expect(
					yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20AmountPerBurn()
				).to.be.rejectedWith(ERROR_STRATEGY_NOT_SET);
			}
		);
	});

	describe("function utilizedERC20AmountValid()", async ()  =>
	{
		it(
			"Should revert if ETH FEED is not set..",
			async ()  =>
			{
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20AmountValid([])
				).to.be.rejectedWith(ERROR_ETH_FEED_NOT_SET);
			}
		);

		it(
			"Should revert if strategy is not set..",
			async ()  =>
			{
				await expect(
					yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20AmountValid([])
				).to.be.rejectedWith(ERROR_STRATEGY_NOT_SET);
			}
		);

		it(
			"Should return false if INVALID ERC20 amounts passed..",
			async ()  =>
			{
				// Initialize strategy with mock ERC20
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
						[mockERC20A.address, mockERC20B.address],
						[[true, true, FIFTY_PERCENT], [true, true, FIFTY_PERCENT]]
					)
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
				).to.not.be.reverted;

				const depositAmount = ethers.utils.parseUnits("1", 18);

				expect(await yieldSyncV1EMPStrategy.utilizedERC20AmountValid([0, depositAmount])).to.be.false;
			}
		)

		it(
			"Should return true if VALID ERC20 amounts passed..",
			async ()  =>
			{
				// Initialize strategy with mock ERC20
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20AndPurposeUpdate(
						[mockERC20A.address, mockERC20B.address],
						[[true, true, FIFTY_PERCENT], [true, true, FIFTY_PERCENT]]
					)
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractorUpdate(strategyInteractorDummy.address)
				).to.not.be.reverted;

				const depositAmount = ethers.utils.parseUnits("1", 18);

				expect(await yieldSyncV1EMPStrategy.utilizedERC20AmountValid([depositAmount, depositAmount])).to.be.true;
			}
		);
	});

	describe("function utilizedERC20DepositOpenToggle()", async () =>
	{
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async ()  =>
			{
				const [, addr1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.connect(addr1).utilizedERC20DepositOpenToggle()
				).to.be.rejectedWith(ERROR_NOT_MANAGER);
			}
		);

		it(
			"Should revert if ETH FEED is not set..",
			async ()  =>
			{
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()
				).to.be.rejectedWith(ERROR_ETH_FEED_NOT_SET);
			}
		);

		it(
			"Should revert if strategy is not set..",
			async ()  =>
			{
				await expect(
					yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20DepositOpenToggle()
				).to.be.rejectedWith(ERROR_STRATEGY_NOT_SET);
			}
		);
	});

	describe("function utilizedERC20WithdrawOpenToggle()", async () =>
	{
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async ()  =>
			{
				const [, addr1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.connect(addr1).utilizedERC20WithdrawOpenToggle()
				).to.be.rejectedWith(ERROR_NOT_MANAGER);
			}
		);

		it(
			"Should revert if ETH FEED is not set..",
			async ()  =>
			{
				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle()
				).to.be.rejectedWith(ERROR_ETH_FEED_NOT_SET);
			}
		);

		it(
			"Should revert if strategy is not set..",
			async ()  =>
			{
				await expect(
					yieldSyncV1EMPStrategy.yieldSyncV1EMPETHValueFeedUpdate(eTHValueFeedDummy.address)
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.utilizedERC20WithdrawOpenToggle()
				).to.be.rejectedWith(ERROR_STRATEGY_NOT_SET);
			}
		);
	});
});
