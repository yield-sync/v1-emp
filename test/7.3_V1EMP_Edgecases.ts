import { expect } from "chai";
import { BigNumber, Contract, ContractFactory, VoidSigner } from "ethers";

import { approveTokens, deployContract, deployEMP, deployStrategies } from "./Scripts";
import { D_18, ERROR, PERCENT } from "../const";


const { ethers } = require("hardhat");


describe("[7.3] V1EMP.sol - Edgecases", async () => {
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

	let owner: VoidSigner;
	let manager: VoidSigner;
	let treasury: VoidSigner;
	let badActor: VoidSigner;

	let eMPs: TestEMP[] = [];
	let strategies: TestStrategy[] = [];

	let eMPDepositAmounts: UtilizedERC20Amount;
	let depositAmount: UtilizedERC20Amount = [];


	beforeEach("[beforeEach] Set up contracts..", async () => {
		[owner, manager, treasury, badActor] = await ethers.getSigners();


		governance = await deployContract("YieldSyncGovernance");

		await governance.payToUpdate(treasury.address);

		arrayUtility = await deployContract("V1EMPArrayUtility");

		registry = await deployContract("V1EMPRegistry", [governance.address]);

		await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

		strategyUtility = await deployContract("V1EMPStrategyUtility", [registry.address]);

		await registry.v1EMPStrategyUtilityUpdate(strategyUtility.address);

		strategyDeployer = await deployContract("V1EMPStrategyDeployer", [registry.address]);

		await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);

		eMPUtility = await deployContract("V1EMPUtility", [registry.address]);

		await registry.v1EMPUtilityUpdate(eMPUtility.address);

		eMPDeployer = await deployContract("V1EMPDeployer", [registry.address]);

		await registry.v1EMPDeployerUpdate(eMPDeployer.address);

		mockERC20A = await deployContract("MockERC20", ["Mock A", "A", 18]);
		mockERC20B = await deployContract("MockERC20", ["Mock B", "B", 18]);
		mockERC20C = await deployContract("MockERC20", ["Mock C", "C", 6]);

		eTHValueFeed = await deployContract("ETHValueFeedDummy", [18]);
		eTHValueFeedC = await deployContract("ETHValueFeedDummy", [6]);

		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20A.address, eTHValueFeed.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20B.address, eTHValueFeed.address);
		await registry.eRC20_v1EMPERC20ETHValueFeedUpdate(mockERC20C.address, eTHValueFeedC.address);

		// Deploy Strategies
		strategies = await deployStrategies(
			registry,
			strategyDeployer,
			await ethers.getContractFactory("V1EMPStrategy"),
			[
				{
					strategyUtilizedERC20: [mockERC20A.address, mockERC20B.address],
					strategyUtilization: [[true, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]]
				},
				{
					strategyUtilizedERC20: [mockERC20C.address],
					strategyUtilization: [[true, true, PERCENT.HUNDRED]]
				},
			]
		);

		// Deploy EMPa
		eMPs = await deployEMP(
			manager.address,
			registry,
			eMPDeployer,
			eMPUtility,
			[
				{
					name: "EMP 1",
					ticker: "EMP1",
					utilizedEMPStrategyUpdate: [strategies[0].contract.address, strategies[1].contract.address],
					utilizedEMPStrategyAllocationUpdate: [PERCENT.FIFTY, PERCENT.FIFTY],
				},
			]
		);
	});

	describe("EMP with uninitialized Strategies", async () => {
		it("Should allow setting utilizedERC20 on EMP..", async () => {
			let utilizedERC20 = await eMPUtility.v1EMP_utilizedERC20(eMPs[0].contract.address);

			let myUtilizedERC20 = await arrayUtility.sort([mockERC20A.address, mockERC20B.address, mockERC20C.address])

			for (let i = 0; i < utilizedERC20.length; i++)
			{
				expect(utilizedERC20[i]).to.be.equal(myUtilizedERC20[i]);
			}

			// Reorder the ERC20
			for (let i = 0; i < utilizedERC20.length; i++)
			{
				let utilization = await eMPUtility.v1EMP_utilizedERC20_utilizationERC20(
					eMPs[0].contract.address,
					utilizedERC20[i]
				);

				switch (utilizedERC20[i])
				{
					case mockERC20A.address:
						expect(utilization.allocation).to.be.equal(PERCENT.TWENTY_FIVE);
						break;
					case mockERC20B.address:
						expect(utilization.allocation).to.be.equal(PERCENT.TWENTY_FIVE);
						break;
					case mockERC20C.address:
						expect(utilization.allocation).to.be.equal(PERCENT.FIFTY);
						break;
					default:
						break;
				}
			}
		});

		it("Should allow depositing of tokens..", async () => {
			// This test is significant because
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
	});
});
