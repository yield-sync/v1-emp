const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

const ERROR_NOT_MANAGER = "manager != msg.sender";
const ERROR_INVALID_ALLOCATION = "_utilizedERC20AllocationTotal != ONE_HUNDRED_PERCENT";
const ERROR_STRATEGY_ALREADY_SET = "address(yieldSyncV1EMPStrategyInteractor) != address(0)";

const HUNDRED_PERCENT = ethers.utils.parseUnits('1', 18);
const FIFTY_PERCENT = ethers.utils.parseUnits('.5', 18);
const TWENTY_FIVE_PERCENT = ethers.utils.parseUnits('.25', 18);
const SEVENTY_FIVE_PERCENT = ethers.utils.parseUnits('.75', 18);


describe("[0.0] YieldSyncV1EMPStrategy.sol - Setup", async ()  =>
{
	let mockERC20A: Contract;
	let mockERC20B: Contract;
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
		eTHValueFeedDummy = await (await ETHValueFeedDummy.deploy()).deployed();
		strategyInteractorDummy = await (await StrategyInteractorDummy.deploy()).deployed();
		yieldSyncV1EMPStrategy = await (await YieldSyncV1EMPStrategy.deploy(owner.address, "Exampe", "EX")).deployed();
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
						[HUNDRED_PERCENT]
					)
				).to.be.rejectedWith(ERROR_NOT_MANAGER);
			}
		);

		it(
			"Should revert when invalid allocation passed..",
			async ()  =>
			{
				await expect(
					yieldSyncV1EMPStrategy.initializeStrategy(
						eTHValueFeedDummy.address,
						strategyInteractorDummy.address,
						[mockERC20A.address],
						[FIFTY_PERCENT]
					)
				).to.be.rejectedWith(ERROR_INVALID_ALLOCATION);
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
						[HUNDRED_PERCENT]
					)
				).to.not.be.reverted;

				expect(await yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractor()).to.be.equal(
					strategyInteractorDummy.address
				);
				expect((await yieldSyncV1EMPStrategy.utilizedERC20()).length).to.be.equal(1);
				expect((await yieldSyncV1EMPStrategy.utilizedERC20())[0]).to.be.equal(mockERC20A.address);
				expect(await yieldSyncV1EMPStrategy.utilizedERC20_allocation(mockERC20A.address)).to.be.equal(
					HUNDRED_PERCENT
				);
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
						[HUNDRED_PERCENT]
					)
				).to.not.be.reverted;

				await expect(
					yieldSyncV1EMPStrategy.initializeStrategy(
						eTHValueFeedDummy.address,
						strategyInteractorDummy.address,
						[mockERC20A.address],
						[HUNDRED_PERCENT]
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
							[FIFTY_PERCENT, FIFTY_PERCENT]
						)
					).to.not.be.reverted;

					expect(await yieldSyncV1EMPStrategy.yieldSyncV1EMPStrategyInteractor()).to.be.equal(
						strategyInteractorDummy.address
					);
					expect((await yieldSyncV1EMPStrategy.utilizedERC20()).length).to.be.equal(2);
					expect((await yieldSyncV1EMPStrategy.utilizedERC20())[0]).to.be.equal(mockERC20A.address);
					expect((await yieldSyncV1EMPStrategy.utilizedERC20())[1]).to.be.equal(mockERC20B.address);
					expect(await yieldSyncV1EMPStrategy.utilizedERC20_allocation(mockERC20A.address)).to.be.equal(
						FIFTY_PERCENT
					);
					expect(await yieldSyncV1EMPStrategy.utilizedERC20_allocation(mockERC20B.address)).to.be.equal(
						FIFTY_PERCENT
					);
				}
			);

			it(
				"Should revert when invalid allocation passed..",
				async ()  =>
				{
					await expect(
						yieldSyncV1EMPStrategy.initializeStrategy(
							eTHValueFeedDummy.address,
							strategyInteractorDummy.address,
							[mockERC20A.address, mockERC20B.address],
							[FIFTY_PERCENT, TWENTY_FIVE_PERCENT]
						)
					).to.be.rejectedWith(ERROR_INVALID_ALLOCATION);
				}
			);
		});
	});

	describe("function utilizedERC20AllocationUpdate()", async ()  =>
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
						[FIFTY_PERCENT, FIFTY_PERCENT]
					)
				).to.not.be.reverted;

				const mockERC20AdepositAmount = ethers.utils.parseUnits("1", 18);

				// Approve the StrategyInteractorDummy contract to spend tokens on behalf of owner
				await mockERC20A.approve(strategyInteractorDummy.address, mockERC20AdepositAmount);

				const NEW_ALLOCATION = [SEVENTY_FIVE_PERCENT, TWENTY_FIVE_PERCENT]

				await expect(yieldSyncV1EMPStrategy.utilizedERC20AllocationUpdate(NEW_ALLOCATION)).to.not.be.reverted;

				expect(await yieldSyncV1EMPStrategy.utilizedERC20_allocation(mockERC20A.address)).to.be.equal(
					SEVENTY_FIVE_PERCENT
				);
				expect(await yieldSyncV1EMPStrategy.utilizedERC20_allocation(mockERC20B.address)).to.be.equal(
					TWENTY_FIVE_PERCENT
				);
			}
		);
	});
});
