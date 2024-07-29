const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

import { ERROR } from "../const";


describe("[1.0] V1EMPRegistry.sol", async () => {
	let arrayUtility: Contract;
	let governance: Contract;
	let registry: Contract;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		const [OWNER, MANAGER, TREASURY] = await ethers.getSigners();

		const V1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("V1EMPArrayUtility");
		const YieldSyncGovernance: ContractFactory = await ethers.getContractFactory("YieldSyncGovernance");
		const V1EMPRegistry: ContractFactory = await ethers.getContractFactory("V1EMPRegistry");

		governance = await (await YieldSyncGovernance.deploy()).deployed();
		arrayUtility = await (await V1EMPArrayUtility.deploy()).deployed();

		registry = await (await V1EMPRegistry.deploy(governance.address)).deployed();

		// Set Treasury
		await expect(governance.payToUpdate(TREASURY.address)).to.be.not.rejected;
	});


	describe("function v1EMPArrayUtilityUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			await expect(registry.connect(ADDR_1).v1EMPArrayUtilityUpdate(arrayUtility.address)).to.be.rejectedWith(
				ERROR.NOT_AUTHORIZED
			);
		});

		it("Should allow authorized caller to update EMP Deployer..", async () => {
			await expect(registry.v1EMPArrayUtilityUpdate(arrayUtility.address)).to.be.not.rejected;

			expect(await registry.v1EMPArrayUtility()).to.be.equal(arrayUtility.address);
		});
	});

	describe("function v1EMPAmountsValidatorUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			await expect(registry.connect(ADDR_1).v1EMPAmountsValidatorUpdate(ADDR_1.address)).to.be.rejectedWith(
				ERROR.NOT_AUTHORIZED
			);
		});

		it("Should not allow to set the EMP Utility until the Array Utility is set..", async () => {
			const [TEMP] = await ethers.getSigners();

			await expect(registry.v1EMPAmountsValidatorUpdate(TEMP.address)).to.be.rejectedWith(
				ERROR.REGISTRY.ARRAY_UTILITY_NOT_SET
			);
		});

		it("Should allow authorized caller to update EMP Utility..", async () => {
			const [TEMP] = await ethers.getSigners();

			await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

			await expect(registry.v1EMPAmountsValidatorUpdate(TEMP.address)).to.be.not.rejected;

			expect(await registry.v1EMPAmountsValidator()).to.be.equal(TEMP.address);
		});
	});

	describe("function v1EMPDeployerUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [TEMP, ADDR_1] = await ethers.getSigners();

			await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

			await registry.v1EMPAmountsValidatorUpdate(TEMP.address);

			await expect(
				registry.connect(ADDR_1).v1EMPDeployerUpdate(TEMP.address)
			).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
		});

		it("Should not allow to set the EMP Deployer until the EMP Utility is set..", async () => {
			const [TEMP] = await ethers.getSigners();

			await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

			await expect(registry.v1EMPDeployerUpdate(TEMP.address)).to.be.rejectedWith(
				ERROR.REGISTRY.EMP_UTILITY_NOT_SET
			);
		});

		it("Should allow authorized caller to update EMP Deployer..", async () => {
			const [TEMP] = await ethers.getSigners();

			await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

			await registry.v1EMPAmountsValidatorUpdate(TEMP.address);

			await expect(registry.v1EMPDeployerUpdate(TEMP.address)).to.be.not.rejected;

			expect(await registry.v1EMPDeployer()).to.be.equal(TEMP.address);
		});
	});

	describe("function v1EMPRegister()", async () => {
		beforeEach(async () => {
			const [TEMP] = await ethers.getSigners();

			await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

			await registry.v1EMPAmountsValidatorUpdate(TEMP.address);

			await registry.v1EMPDeployerUpdate(TEMP.address);
		});

		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			await expect(registry.connect(ADDR_1).v1EMPRegister(ADDR_1.address)).to.be.rejectedWith(
				ERROR.REGISTRY.NOT_EMP_DEPLOYER
			);
		});

		it("Should allow authorized caller to register an EMP..", async () => {
			const [TEMP] = await ethers.getSigners();

			await expect(registry.v1EMPRegister(TEMP.address)).to.be.not.rejected;

			const v1EMPStrategyId = await registry.v1EMP_v1EMPId(TEMP.address);

			expect(v1EMPStrategyId).to.be.greaterThan(0);

			expect(await registry.v1EMPId_v1EMP(v1EMPStrategyId)).to.be.equal(TEMP.address);
		});
	});

	describe("function v1EMPStrategyDeployerUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [TEMP, ADDR_1] = await ethers.getSigners();

			await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

			await expect(
				registry.connect(ADDR_1).v1EMPStrategyDeployerUpdate(ADDR_1.address)
			).to.be.rejectedWith(ERROR.NOT_AUTHORIZED);
		});

		it("Should allow authorized caller to update EMP Strategy Deployer..", async () => {
			const [TEMP] = await ethers.getSigners();

			await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

			await expect(registry.v1EMPStrategyDeployerUpdate(TEMP.address)).to.be.not.rejected;

			expect(await registry.v1EMPStrategyDeployer()).to.be.equal(TEMP.address);
		});
	});

	describe("function v1EMPStrategyRegister()", async () => {
		beforeEach(async () => {
			const [TEMP] = await ethers.getSigners();

			await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

			await registry.v1EMPStrategyDeployerUpdate(TEMP.address);

			expect(await registry.v1EMPStrategyDeployer()).to.be.equal(TEMP.address);
		});

		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [, ADDR_1] = await ethers.getSigners();

			await expect(registry.connect(ADDR_1).v1EMPStrategyRegister(ADDR_1.address)).to.be.rejectedWith(
				ERROR.REGISTRY.NOT_STRATEGY_DEPLOYER
			);
		});

		it("Should allow authorized caller to register an EMP strategy..", async () => {
			const [TEMP] = await ethers.getSigners();

			await expect(registry.v1EMPStrategyRegister(TEMP.address)).to.be.not.rejected;

			const v1EMPStrategyId = await registry.v1EMPStrategy_v1EMPStrategyId(TEMP.address);

			expect(v1EMPStrategyId).to.be.greaterThan(0);

			expect(await registry.v1EMPStrategyId_v1EMPStrategy(v1EMPStrategyId)).to.be.equal(
				TEMP.address
			);
		});
	});

	describe("function eRC20_v1EMPERC20ETHValueFeedUpdate()", async () => {
		beforeEach(async () => {
			const [TEMP] = await ethers.getSigners();

			await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

			await registry.v1EMPStrategyDeployerUpdate(TEMP.address);

			expect(await registry.v1EMPStrategyDeployer()).to.be.equal(TEMP.address);
		});

		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			const [, ADDR_1, ERC20, ETH_VALUE_FEED] = await ethers.getSigners();

			await expect(
				registry.connect(ADDR_1).eRC20_v1EMPERC20ETHValueFeedUpdate(ERC20.address, ETH_VALUE_FEED.address)
			).to.be.rejectedWith(
				ERROR.NOT_AUTHORIZED
			);
		});

		it("Should not allow address(0) to be passed a _erc20 parameter..", async () => {
			const [, , , ETH_VALUE_FEED] = await ethers.getSigners();

			await expect(
				registry.eRC20_v1EMPERC20ETHValueFeedUpdate(ethers.constants.AddressZero, ETH_VALUE_FEED.address)
			).to.be.rejectedWith(
				ERROR.REGISTRY.ERC20_ADDRESS_ZERO
			);
		});

		it("Should not allow address(0) to be passed a _v1EMPERC20ETHValueFeed parameter..", async () => {
			const [, , ERC20] = await ethers.getSigners();

			await expect(
				registry.eRC20_v1EMPERC20ETHValueFeedUpdate(ERC20.address, ethers.constants.AddressZero)
			).to.be.rejectedWith(
				ERROR.REGISTRY.ETH_VALUE_FEED_ADDRESS_ZERO
			);
		});

		it("Should allow authorized caller to register an ETH Value Feed..", async () => {
			const [, ADDR_1, ERC20, ETH_VALUE_FEED] = await ethers.getSigners();

			await expect(
				registry.eRC20_v1EMPERC20ETHValueFeedUpdate(ERC20.address, ETH_VALUE_FEED.address)
			).to.be.not.rejected;

			expect(await registry.eRC20_v1EMPERC20ETHValueFeed(ERC20.address)).to.be.equal(ETH_VALUE_FEED.address);
		});
	});
});
