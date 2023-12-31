const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

const ERROR_NOT_MANAGER = "manager != msg.sender";
const ERROR_INVALID_PURPOSE_LENGTH = "_utilizedERC20.length != _purpose.length";
const ERROR_INVALID_ALLOCATION = "_utilizedERC20_purposeAllocationTotal != ONE_HUNDRED_PERCENT";
const ERROR_STRATEGY_ALREADY_SET = "address(yieldSyncV1EMPStrategyInteractor) != address(0)";

const HUNDRED_PERCENT = ethers.utils.parseUnits('1', 18);
const FIFTY_PERCENT = ethers.utils.parseUnits('.5', 18);
const SEVENTY_FIVE_PERCENT = ethers.utils.parseUnits('.75', 18);
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

	describe("function utilizedERC20_purposeUpdate() (1/2)", async ()  => {
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async ()  =>
			{
				const [, addr1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.connect(addr1).utilizedERC20_purposeUpdate(
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
					yieldSyncV1EMPStrategy.utilizedERC20_purposeUpdate([[true, true, FIFTY_PERCENT],])
				).to.be.rejectedWith(ERROR_INVALID_PURPOSE_LENGTH);
			}
		);
	});

	describe("function initializeStrategy()", async ()  =>
	{
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async ()  =>
			{
				const [, addr1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPStrategy.connect(addr1).initializeStrategy(
						eTHValueFeedDummy.address,
						strategyInteractorDummy.address,
						[mockERC20A.address],
						[[true, true, HUNDRED_PERCENT]]
					)
				).to.be.rejectedWith(ERROR_NOT_MANAGER);
			}
		);

		it(
			"Should revert when invalid allocation passed..",
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
						_yieldSyncV1EMPStrategy.initializeStrategy(
							eTHValueFeedDummy.address,
							strategyInteractorDummy.address,
							INVALID_ALLOCATIONS[i].addresses,
							INVALID_ALLOCATIONS[i].purpose,
						)
					).to.be.rejectedWith(ERROR_INVALID_ALLOCATION);
				}
			}
		);

		it(
			"Should NOT revert when invalid allocation passed..",
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
						_yieldSyncV1EMPStrategy.initializeStrategy(
							eTHValueFeedDummy.address,
							strategyInteractorDummy.address,
							VALID_ALLOCATION[i].addresses,
							VALID_ALLOCATION[i].purpose
						)
					).to.be.not.reverted;
				}
			}
		);

		it(
			"It should be able to set _strategy and _utilizedERC20..",
			async ()  =>
			{
				// Initialize strategy with mock ERC20
				await expect(
					yieldSyncV1EMPStrategy.initializeStrategy(
						eTHValueFeedDummy.address,
						strategyInteractorDummy.address,
						[mockERC20A.address],
						[[true, true, HUNDRED_PERCENT]]
					)
				).to.not.be.reverted;

				expect(await yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractor()).to.be.equal(
					strategyInteractorDummy.address
				);
				expect((await yieldSyncV1EMPStrategy.utilizedERC20()).length).to.be.equal(1);
				expect((await yieldSyncV1EMPStrategy.utilizedERC20())[0]).to.be.equal(mockERC20A.address);

				const PURPOSE = await yieldSyncV1EMPStrategy.utilizedERC20_purpose(mockERC20A.address);

				expect(PURPOSE.allocation).to.be.equal(HUNDRED_PERCENT);
			}
		);

		it(
			"It should be able only be able to set once..",
			async ()  =>
			{
				// Initialize strategy with mock ERC20
				await expect(
					yieldSyncV1EMPStrategy.initializeStrategy(
						eTHValueFeedDummy.address,
						strategyInteractorDummy.address,
						[mockERC20A.address],
						[[true, true, HUNDRED_PERCENT]]
					)
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.initializeStrategy(
						eTHValueFeedDummy.address,
						strategyInteractorDummy.address,
						[mockERC20A.address],
						[[true, true, HUNDRED_PERCENT]]
					)
				).to.be.rejectedWith(ERROR_STRATEGY_ALREADY_SET);
			}
		);

		describe("[MULTIPLE ERC20]", async ()  =>
		{
			it(
				"It should be able to set multiple _utilizedERC20..",
				async ()  =>
				{
					// Initialize strategy with mock ERC20
					await expect(
						yieldSyncV1EMPStrategy.initializeStrategy(
							eTHValueFeedDummy.address,
							strategyInteractorDummy.address,
							[mockERC20A.address, mockERC20B.address],
							[[true, true, FIFTY_PERCENT], [true, true, FIFTY_PERCENT]]
						)
					).to.not.be.reverted;

					expect(await yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractor()).to.be.equal(
						strategyInteractorDummy.address
					);
					expect((await yieldSyncV1EMPStrategy.utilizedERC20()).length).to.be.equal(2);
					expect((await yieldSyncV1EMPStrategy.utilizedERC20())[0]).to.be.equal(mockERC20A.address);
					expect((await yieldSyncV1EMPStrategy.utilizedERC20())[1]).to.be.equal(mockERC20B.address);

					const PURPOSE_A = await yieldSyncV1EMPStrategy.utilizedERC20_purpose(mockERC20A.address);

					expect(PURPOSE_A.allocation).to.be.equal(FIFTY_PERCENT);

					const PURPOSE_B = await yieldSyncV1EMPStrategy.utilizedERC20_purpose(mockERC20B.address);

					expect(PURPOSE_B.allocation).to.be.equal(FIFTY_PERCENT);
				}
			);
		});
	});

	describe("function utilizedERC20_purposeUpdate() (2/2)", async ()  =>
	{
		it(
			"[MULTIPLE-ONLY] Should be able to update utilizedERC20Allocation..",
			async ()  =>
			{
				// Initialize strategy with mock ERC20
				await expect(
					yieldSyncV1EMPStrategy.initializeStrategy(
						eTHValueFeedDummy.address,
						strategyInteractorDummy.address,
						[mockERC20A.address, mockERC20B.address],
						[[true, true, FIFTY_PERCENT], [true, true, FIFTY_PERCENT]]
						)
				).to.not.be.reverted;

				const mockERC20AdepositAmount = ethers.utils.parseUnits("1", 18);

				// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
				await mockERC20A.approve(strategyInteractorDummy.address, mockERC20AdepositAmount);

				const NEW_ALLOCATION = [[true, true, SEVENTY_FIVE_PERCENT], [true, true, TWENTY_FIVE_PERCENT]];

				await expect(yieldSyncV1EMPStrategy.utilizedERC20_purposeUpdate(NEW_ALLOCATION)).to.not.be.reverted;

				const PURPOSE_A = await yieldSyncV1EMPStrategy.utilizedERC20_purpose(mockERC20A.address);

				expect(PURPOSE_A.allocation).to.be.equal(SEVENTY_FIVE_PERCENT);

				const PURPOSE_B = await yieldSyncV1EMPStrategy.utilizedERC20_purpose(mockERC20B.address);

				expect(PURPOSE_B.allocation).to.be.equal(TWENTY_FIVE_PERCENT);
			}
		);
	});

	describe("function utilizedERC20AmountValid()", async ()  =>
	{

	});
});
