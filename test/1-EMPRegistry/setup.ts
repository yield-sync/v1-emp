const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, VoidSigner } from "ethers";

import { ERROR } from "../../const";
import { deployContract } from "../../util/UtilEMP";


describe("[1.0] V1EMPRegistry.sol", async () => {
	let addressArrayUtility: Contract;
	let governance: Contract;
	let registry: Contract;

	let owner: VoidSigner;
	let manager: VoidSigner;
	let treasury: VoidSigner;
	let fakeERC20: VoidSigner;
	let fakeEthValueProvider: VoidSigner;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		[owner, manager, treasury, fakeERC20, fakeEthValueProvider] = await ethers.getSigners();

		governance = await deployContract("YieldSyncGovernance");
		addressArrayUtility = await deployContract("AddressArrayUtility");
		registry = await deployContract("V1EMPRegistry", [governance.address]);

		await governance.payToUpdate(treasury.address);
	});


	describe("function governanceUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			await expect(registry.connect(manager).governanceUpdate(owner.address)).to.be.rejectedWith(
				ERROR.NOT_AUTHORIZED
			);
		});

		it("Should not allow invalid addressArrayUtility to be set..", async () => {
			await expect(registry.governanceUpdate(ethers.constants.AddressZero)).to.be.rejectedWith(
				ERROR.REGISTRY.GOVERNANCE_IS_ADDRESS_ZERO
			);
		});

		it("Should allow authorized caller to update EMP Deployer..", async () => {
			await expect(registry.governanceUpdate(owner.address)).to.be.not.rejected;

			expect(await registry.governance()).to.be.equal(owner.address);
		});
	});


	describe("function addressArrayUtilityUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			await expect(registry.connect(manager).addressArrayUtilityUpdate(addressArrayUtility.address)).to.be.rejectedWith(
				ERROR.NOT_AUTHORIZED
			);
		});

		it("Should not allow invalid addressArrayUtility to be set..", async () => {
			await expect(registry.addressArrayUtilityUpdate(ethers.constants.AddressZero)).to.be.rejectedWith(
				ERROR.REGISTRY.ARRAY_UTILITY_IS_ADDRESS_ZERO
			);
		});

		it("Should allow authorized caller to update EMP Deployer..", async () => {
			await expect(registry.addressArrayUtilityUpdate(addressArrayUtility.address)).to.be.not.rejected;

			expect(await registry.addressArrayUtility()).to.be.equal(addressArrayUtility.address);
		});
	});

	describe("function v1EMPUtilityUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			await expect(registry.connect(manager).v1EMPUtilityUpdate(manager.address)).to.be.rejectedWith(
				ERROR.NOT_AUTHORIZED
			);
		});

		it("Should not allow to set the EMP Utility until the Array Utility is set..", async () => {
			await expect(registry.v1EMPUtilityUpdate(owner.address)).to.be.rejectedWith(
				ERROR.REGISTRY.ARRAY_UTILITY_NOT_SET
			);
		});

		it("Should not allow invalid v1EMPUtility to be set..", async () => {
			await registry.addressArrayUtilityUpdate(addressArrayUtility.address);

			await expect(registry.v1EMPUtilityUpdate(ethers.constants.AddressZero)).to.be.rejectedWith(
				ERROR.REGISTRY.EMP_UTILITY_IS_ADDRESS_ZERO
			);
		});

		it("Should allow authorized caller to update EMP Utility..", async () => {
			await registry.addressArrayUtilityUpdate(addressArrayUtility.address);

			await expect(registry.v1EMPUtilityUpdate(owner.address)).to.be.not.rejected;

			expect(await registry.v1EMPUtility()).to.be.equal(owner.address);
		});
	});

	describe("function v1EMPStrategyUtilityUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			await expect(registry.connect(manager).v1EMPStrategyUtilityUpdate(manager.address)).to.be.rejectedWith(
				ERROR.NOT_AUTHORIZED
			);
		});

		it("Should not allow to set the EMP Strategy Utility until the Array Utility is set..", async () => {
			await expect(registry.v1EMPStrategyUtilityUpdate(owner.address)).to.be.rejectedWith(
				ERROR.REGISTRY.ARRAY_UTILITY_NOT_SET
			);
		});

		it("Should not allow invalid __v1EMPStrategyUtility to be set..", async () => {
			await registry.addressArrayUtilityUpdate(addressArrayUtility.address);

			await expect(registry.v1EMPStrategyUtilityUpdate(ethers.constants.AddressZero)).to.be.rejectedWith(
				ERROR.REGISTRY.STRATEGY_UTILITY_IS_ADDRESS_ZERO
			);
		});

		it("Should allow authorized caller to update EMP Strategy Utility..", async () => {
			await registry.addressArrayUtilityUpdate(addressArrayUtility.address);

			await expect(registry.v1EMPStrategyUtilityUpdate(owner.address)).to.be.not.rejected;

			expect(await registry.v1EMPStrategyUtility()).to.be.equal(owner.address);
		});
	});

	describe("function v1EMPDeployerUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			await registry.addressArrayUtilityUpdate(addressArrayUtility.address);

			await registry.v1EMPUtilityUpdate(owner.address);

			await expect(registry.connect(manager).v1EMPDeployerUpdate(owner.address)).to.be.rejectedWith(
				ERROR.NOT_AUTHORIZED
			);
		});

		it("Should not allow to set the EMP Deployer until the EMP Utility is set..", async () => {
			await registry.addressArrayUtilityUpdate(addressArrayUtility.address);

			await expect(registry.v1EMPDeployerUpdate(owner.address)).to.be.rejectedWith(
				ERROR.REGISTRY.EMP_UTILITY_NOT_SET
			);
		});

		it("Should not allow invalid EMPDeployer to be set..", async () => {
			await registry.addressArrayUtilityUpdate(addressArrayUtility.address);

			await registry.v1EMPUtilityUpdate(owner.address);

			await expect(registry.v1EMPDeployerUpdate(ethers.constants.AddressZero)).to.be.rejectedWith(
				ERROR.REGISTRY.EMP_DEPLOYER_IS_ADDRESS_ZERO
			);
		});

		it("Should allow authorized caller to update EMP Deployer..", async () => {
			await registry.addressArrayUtilityUpdate(addressArrayUtility.address);

			await registry.v1EMPUtilityUpdate(owner.address);

			await expect(registry.v1EMPDeployerUpdate(owner.address)).to.be.not.rejected;

			expect(await registry.v1EMPDeployer()).to.be.equal(owner.address);
		});

		it("Should NOT allow EMP Deployer to updated again after being set..", async () => {
			// Set prerequisites
			await registry.addressArrayUtilityUpdate(addressArrayUtility.address);
			await registry.v1EMPUtilityUpdate(owner.address);

			// Set EMP Deployer for the first time
			await registry.v1EMPDeployerUpdate(owner.address);

			// Ensure the EMP Deployer is correctly set
			expect(await registry.v1EMPDeployer()).to.be.equal(owner.address);

			// Attempt to set EMP Deployer again
			await expect(registry.v1EMPDeployerUpdate(manager.address)).to.be.rejectedWith(
				ERROR.REGISTRY.EMP_DEPLOYER_ALREADY_SET
			);

			// Ensure the EMP Deployer remains unchanged
			expect(await registry.v1EMPDeployer()).to.be.equal(owner.address);
		});
	});

	describe("function v1EMPRegister()", async () => {
		beforeEach(async () => {
			await registry.addressArrayUtilityUpdate(addressArrayUtility.address);

			await registry.v1EMPUtilityUpdate(owner.address);

			await registry.v1EMPDeployerUpdate(owner.address);
		});

		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			await expect(registry.connect(manager).v1EMPRegister(manager.address)).to.be.rejectedWith(
				ERROR.REGISTRY.NOT_EMP_DEPLOYER
			);
		});

		it("Should allow authorized caller to register an EMP..", async () => {
			await expect(registry.v1EMPRegister(owner.address)).to.be.not.rejected;

			const v1EMPStrategyId = await registry.v1EMP_v1EMPId(owner.address);

			expect(v1EMPStrategyId).to.be.greaterThan(0);

			expect(await registry.v1EMPId_v1EMP(v1EMPStrategyId)).to.be.equal(owner.address);
		});
	});

	describe("function v1EMPStrategyDeployerUpdate()", async () => {
		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			await registry.addressArrayUtilityUpdate(addressArrayUtility.address);

			await expect(registry.connect(manager).v1EMPStrategyDeployerUpdate(manager.address)).to.be.rejectedWith(
				ERROR.NOT_AUTHORIZED
			);
		});

		it("Should not allow invalid EMPStrategyDeployer to be set..", async () => {
			await registry.addressArrayUtilityUpdate(addressArrayUtility.address);

			await expect(registry.v1EMPStrategyDeployerUpdate(ethers.constants.AddressZero)).to.be.rejectedWith(
				ERROR.REGISTRY.EMP_STRATEGY_DEPLOYER_IS_ADDRESS_ZERO
			);
		});

		it("Should allow authorized caller to update EMP Strategy Deployer..", async () => {
			await registry.addressArrayUtilityUpdate(addressArrayUtility.address);

			await expect(registry.v1EMPStrategyDeployerUpdate(owner.address)).to.be.not.rejected;

			expect(await registry.v1EMPStrategyDeployer()).to.be.equal(owner.address);
		});

		it("Should NOT allow EMP Strategy Deployer to updated again after being set..", async () => {
			// Set prerequisites
			await registry.addressArrayUtilityUpdate(addressArrayUtility.address);

			// Set EMP Strategy Deployer for the first time
			await registry.v1EMPStrategyDeployerUpdate(owner.address);

			// Ensure the EMP Strategy Deployer is correctly set
			expect(await registry.v1EMPStrategyDeployer()).to.be.equal(owner.address);

			// Attempt to set EMP Strategy Deployer again
			await expect(registry.v1EMPStrategyDeployerUpdate(manager.address)).to.be.rejectedWith(
				ERROR.REGISTRY.EMP_STRATEGY_DEPLOYER_ALREADY_SET
			);

			// Ensure the EMP Strategy Deployer remains unchanged
			expect(await registry.v1EMPStrategyDeployer()).to.be.equal(owner.address);
		})

	});

	describe("function v1EMPStrategyRegister()", async () => {
		beforeEach(async () => {
			await registry.addressArrayUtilityUpdate(addressArrayUtility.address);

			await registry.v1EMPStrategyDeployerUpdate(owner.address);

			expect(await registry.v1EMPStrategyDeployer()).to.be.equal(owner.address);
		});

		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			await expect(registry.connect(manager).v1EMPStrategyRegister(manager.address)).to.be.rejectedWith(
				ERROR.REGISTRY.NOT_STRATEGY_DEPLOYER
			);
		});

		it("Should allow authorized caller to register an EMP strategy..", async () => {
			await expect(registry.v1EMPStrategyRegister(owner.address)).to.be.not.rejected;

			const v1EMPStrategyId = await registry.v1EMPStrategy_v1EMPStrategyId(owner.address);

			expect(v1EMPStrategyId).to.be.greaterThan(0);

			expect(await registry.v1EMPStrategyId_v1EMPStrategy(v1EMPStrategyId)).to.be.equal(owner.address);
		});
	});

	describe("function eRC20_eRC20ETHValueProviderUpdate()", async () => {
		beforeEach(async () => {
			await registry.addressArrayUtilityUpdate(addressArrayUtility.address);

			await registry.v1EMPStrategyDeployerUpdate(owner.address);

			expect(await registry.v1EMPStrategyDeployer()).to.be.equal(owner.address);
		});

		it("[auth] Should revert when unauthorized msg.sender calls..", async () => {
			await expect(
				registry.connect(manager).eRC20_eRC20ETHValueProviderUpdate(fakeERC20.address, fakeEthValueProvider.address)
			).to.be.rejectedWith(
				ERROR.NOT_AUTHORIZED
			);
		});

		it("Should not allow _erc20 parameter to be address(0)..", async () => {
			await expect(
				registry.eRC20_eRC20ETHValueProviderUpdate(ethers.constants.AddressZero, fakeEthValueProvider.address)
			).to.be.rejectedWith(
				ERROR.REGISTRY.ERC20_ADDRESS_ZERO
			);
		});

		it("Should not allow _eRC20ETHValueProvider parameter to be address(0)..", async () => {
			await expect(
				registry.eRC20_eRC20ETHValueProviderUpdate(fakeERC20.address, ethers.constants.AddressZero)
			).to.be.rejectedWith(
				ERROR.REGISTRY.ETH_VALUE_PROVIDER_ADDRESS_ZERO
			);
		});

		it("Should allow authorized caller to register an ETH Value Feed..", async () => {
			await expect(
				registry.eRC20_eRC20ETHValueProviderUpdate(fakeERC20.address, fakeEthValueProvider.address)
			).to.be.not.rejected;

			expect(await registry.eRC20_eRC20ETHValueProvider(fakeERC20.address)).to.be.equal(fakeEthValueProvider.address);
		});
	});
});
