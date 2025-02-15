import { expect } from "chai";
import { Contract, VoidSigner } from "ethers";

import stageContracts, { stageSpecificSetup } from "./stage-contracts-1";
import { ERROR } from "../../const";


const { ethers } = require("hardhat");


describe("[1.0] V1EMPRegistry.sol", async () => {
	let addressArrayUtility: Contract;
	let percentUtility: Contract;
	let registry: Contract;

	let owner: VoidSigner;
	let badActor: VoidSigner;
	let fakeERC20: VoidSigner;
	let fakeEthValueProvider: VoidSigner;
	let fakeStrategyDeployer: VoidSigner;
	let fakeStrategyUtility: VoidSigner;
	let fakeEMPDeployer: VoidSigner;
	let fakeEMPUtility: VoidSigner;
	let fakeEMP: VoidSigner;
	let fakeEMPStrategy: VoidSigner;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		({ owner, badActor, addressArrayUtility, percentUtility, registry, } = await stageContracts());

		(
			{
				fakeERC20,
				fakeEthValueProvider,
				fakeStrategyDeployer,
				fakeStrategyUtility,
				fakeEMPDeployer,
				fakeEMPUtility,
				fakeEMP,
				fakeEMPStrategy,
			} = await stageSpecificSetup()
		);
	});


	describe("mutative", () => {
		describe("function addressArrayUtilityUpdate()", () => {
			it("[auth] Should revert if an unauthorized sender calls..", async () => {
				await expect(
					registry.connect(badActor).addressArrayUtilityUpdate(addressArrayUtility.address)
				).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});

			it("Should not allow __addressArrayUtility to be address(0)..", async () => {
				await expect(registry.addressArrayUtilityUpdate(ethers.constants.AddressZero)).to.be.rejectedWith(
					ERROR.REGISTRY.ARRAY_UTILITY_IS_ADDRESS_ZERO
				);
			});

			it("Should update _addressArrayUtility with valid params..", async () => {
				await expect(registry.addressArrayUtilityUpdate(addressArrayUtility.address)).to.be.not.rejected;

				expect(await registry.addressArrayUtility()).to.be.equal(addressArrayUtility.address);
			});
		});

		describe("function percentUtilityUpdate()", () => {
			it("[auth] Should revert if an unauthorized sender calls..", async () => {
				await expect(
					registry.connect(badActor).percentUtilityUpdate(percentUtility.address)
				).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});

			it("Should not allow __percentUtility to be address(0)..", async () => {
				await expect(registry.percentUtilityUpdate(ethers.constants.AddressZero)).to.be.rejectedWith(
					ERROR.REGISTRY.PERCENT_UTILITY_IS_ADDRESS_ZERO
				);
			});

			it("Should update _percentUtility with valid params..", async () => {
				await expect(registry.percentUtilityUpdate(percentUtility.address)).to.be.not.rejected;

				expect(await registry.percentUtility()).to.be.equal(percentUtility.address);
			});
		});

		describe("function v1EMPDeployerUpdate()", () => {
			beforeEach(async () => {
				await registry.addressArrayUtilityUpdate(addressArrayUtility.address);
				await registry.percentUtilityUpdate(percentUtility.address);
			});


			it("[auth] Should revert if an unauthorized sender calls..", async () => {
				await registry.v1EMPUtilityUpdate(fakeEMPUtility.address);

				await expect(registry.connect(badActor).v1EMPDeployerUpdate(owner.address)).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});

			it("Should not allow __v1EMPDeployer to be address(0)..", async () => {
				await registry.v1EMPUtilityUpdate(fakeEMPUtility.address);

				await expect(registry.v1EMPDeployerUpdate(ethers.constants.AddressZero)).to.be.rejectedWith(
					ERROR.REGISTRY.EMP_DEPLOYER_IS_ADDRESS_ZERO
				);
			});

			it("Should not allow to set _v1EMPDeployer until _v1EMPUtility is set..", async () => {
				await expect(registry.v1EMPDeployerUpdate(fakeEMPDeployer.address)).to.be.rejectedWith(
					ERROR.REGISTRY.EMP_UTILITY_NOT_SET
				);
			});

			it("Should allow authorized caller to update EMP Deployer..", async () => {
				await registry.v1EMPUtilityUpdate(fakeEMPUtility.address);

				await expect(registry.v1EMPDeployerUpdate(fakeEMPDeployer.address)).to.be.not.rejected;

				expect(await registry.v1EMPDeployer()).to.be.equal(fakeEMPDeployer.address);
			});

			it("Should NOT allow EMP Deployer to updated again after being set..", async () => {
				await registry.v1EMPUtilityUpdate(fakeEMPUtility.address);

				await registry.v1EMPDeployerUpdate(fakeEMPDeployer.address);

				expect(await registry.v1EMPDeployer()).to.be.equal(fakeEMPDeployer.address);

				await expect(registry.v1EMPDeployerUpdate(badActor.address)).to.be.rejectedWith(
					ERROR.REGISTRY.EMP_DEPLOYER_ALREADY_SET
				);

				expect(await registry.v1EMPDeployer()).to.be.equal(fakeEMPDeployer.address);
			});
		});

		describe("function v1EMPStrategyDeployerUpdate()", () => {
			beforeEach(async () => {
				await registry.addressArrayUtilityUpdate(addressArrayUtility.address);
				await registry.percentUtilityUpdate(percentUtility.address);
			});


			it("[auth] Should revert if an unauthorized sender calls..", async () => {
				await expect(
					registry.connect(badActor).v1EMPStrategyDeployerUpdate(badActor.address)
				).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});

			it("Should not allow EMPStrategyDeployer to be address(0)..", async () => {
				await expect(registry.v1EMPStrategyDeployerUpdate(ethers.constants.AddressZero)).to.be.rejectedWith(
					ERROR.REGISTRY.EMP_STRATEGY_DEPLOYER_IS_ADDRESS_ZERO
				);
			});

			it("Should update _v1EMPStrategyDeployer with valid params..", async () => {
				await expect(registry.v1EMPStrategyDeployerUpdate(fakeStrategyDeployer.address)).to.be.not.rejected;

				expect(await registry.v1EMPStrategyDeployer()).to.be.equal(fakeStrategyDeployer.address);
			});

			it("Should NOT allow _v1EMPStrategyDeployer to updated again after being set..", async () => {
				await registry.v1EMPStrategyDeployerUpdate(fakeStrategyDeployer.address);

				expect(await registry.v1EMPStrategyDeployer()).to.be.equal(fakeStrategyDeployer.address);

				await expect(registry.v1EMPStrategyDeployerUpdate(badActor.address)).to.be.rejectedWith(
					ERROR.REGISTRY.EMP_STRATEGY_DEPLOYER_ALREADY_SET
				);

				expect(await registry.v1EMPStrategyDeployer()).to.be.equal(fakeStrategyDeployer.address);
			})

		});

		describe("function eRC20_eRC20ETHValueProviderUpdate()", () => {
			beforeEach(async () => {
				await registry.addressArrayUtilityUpdate(addressArrayUtility.address);
				await registry.percentUtilityUpdate(percentUtility.address);
				await registry.v1EMPStrategyDeployerUpdate(fakeStrategyDeployer.address);
			});


			it("[auth] Should revert if an unauthorized sender calls..", async () => {
				await expect(
					registry.connect(badActor).eRC20_eRC20ETHValueProviderUpdate(
						fakeERC20.address,
						fakeEthValueProvider.address
					)
				).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});

			it("Should not allow _erc20 to be address(0)..", async () => {
				await expect(
					registry.eRC20_eRC20ETHValueProviderUpdate(
						ethers.constants.AddressZero,
						fakeEthValueProvider.address
					)
				).to.be.rejectedWith(
					ERROR.REGISTRY.ERC20_ADDRESS_ZERO
				);
			});

			it("Should not allow _eRC20ETHValueProvider to be address(0)..", async () => {
				await expect(
					registry.eRC20_eRC20ETHValueProviderUpdate(
						fakeERC20.address,
						ethers.constants.AddressZero
					)
				).to.be.rejectedWith(
					ERROR.REGISTRY.ETH_VALUE_PROVIDER_ADDRESS_ZERO
				);
			});

			it("Should update eRC20_eRC20ETHValueProvider with valid params..", async () => {
				await expect(
					registry.eRC20_eRC20ETHValueProviderUpdate(
						fakeERC20.address,
						fakeEthValueProvider.address
					)
				).to.be.not.rejected;

				expect(await registry.eRC20_eRC20ETHValueProvider(fakeERC20.address)).to.be.equal(
					fakeEthValueProvider.address
				);
			});
		});

		describe("function governanceUpdate()", () => {
			it("[auth] Should revert if an unauthorized sender calls..", async () => {
				await expect(registry.connect(badActor).governanceUpdate(owner.address)).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});

			it("Should not allow __governance to be address(0)..", async () => {
				await expect(registry.governanceUpdate(ethers.constants.AddressZero)).to.be.rejectedWith(
					ERROR.REGISTRY.GOVERNANCE_IS_ADDRESS_ZERO
				);
			});

			it("Should update _governance with valid params..", async () => {
				await expect(registry.governanceUpdate(owner.address)).to.be.not.rejected;

				expect(await registry.governance()).to.be.equal(owner.address);
			});
		});

		describe("function v1EMPRegister()", () => {
			beforeEach(async () => {
				await registry.addressArrayUtilityUpdate(addressArrayUtility.address);
				await registry.percentUtilityUpdate(percentUtility.address);
				await registry.v1EMPUtilityUpdate(owner.address);
				await registry.v1EMPDeployerUpdate(owner.address);
			});

			it("[auth] Should revert if an unauthorized sender calls..", async () => {
				await expect(registry.connect(badActor).v1EMPRegister(badActor.address)).to.be.rejectedWith(
					ERROR.REGISTRY.NOT_EMP_DEPLOYER
				);
			});

			it("Should allow mock StrategyDeployer to register an EMP..", async () => {
				await expect(registry.v1EMPRegister(fakeEMP.address)).to.be.not.rejected;

				const v1EMPStrategyId = await registry.v1EMP_v1EMPId(fakeEMP.address);

				expect(v1EMPStrategyId).to.be.greaterThan(0);

				expect(await registry.v1EMPId_v1EMP(v1EMPStrategyId)).to.be.equal(fakeEMP.address);
			});
		});

		describe("function v1EMPStrategyRegister()", () => {
			beforeEach(async () => {
				await registry.addressArrayUtilityUpdate(addressArrayUtility.address);
				await registry.percentUtilityUpdate(percentUtility.address);
				await registry.v1EMPStrategyDeployerUpdate(fakeStrategyDeployer.address);
				expect(await registry.v1EMPStrategyDeployer()).to.be.equal(fakeStrategyDeployer.address);
			});

			it("[auth] Should revert if an unauthorized sender calls..", async () => {
				await expect(registry.connect(badActor).v1EMPStrategyRegister(badActor.address)).to.be.rejectedWith(
					ERROR.REGISTRY.NOT_STRATEGY_DEPLOYER
				);
			});

			it("Should allow mock StrategyDeployer caller to register an EMP strategy..", async () => {
				await expect(
					registry.connect(fakeStrategyDeployer).v1EMPStrategyRegister(fakeEMPStrategy.address)
				).to.be.not.rejected;

				const v1EMPStrategyId = await registry.v1EMPStrategy_v1EMPStrategyId(fakeEMPStrategy.address);

				expect(v1EMPStrategyId).to.be.greaterThan(0);

				const registedStrategyAddress = await registry.v1EMPStrategyId_v1EMPStrategy(v1EMPStrategyId);

				expect(registedStrategyAddress).to.be.equal(fakeEMPStrategy.address);
			});
		});

		describe("function v1EMPStrategyUtilityUpdate()", () => {
			it("[auth] Should revert if an unauthorized sender calls..", async () => {
				await expect(registry.connect(badActor).v1EMPStrategyUtilityUpdate(badActor.address)).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});

			it("Should revert if _addressArrayUtility is address(0)..", async () => {
				await expect(registry.v1EMPStrategyUtilityUpdate(fakeStrategyUtility.address)).to.be.rejectedWith(
					ERROR.REGISTRY.ARRAY_UTILITY_NOT_SET
				);
			});

			it("Should revert if _percentUtility is address(0)..", async () => {
				await registry.addressArrayUtilityUpdate(addressArrayUtility.address);

				await expect(registry.v1EMPStrategyUtilityUpdate(fakeStrategyUtility.address)).to.be.rejectedWith(
					ERROR.REGISTRY.PERCENT_UTILITY_NOT_SET
				);
			});

			it("Should not allow __v1EMPStrategyUtility to be address(0)..", async () => {
				await registry.addressArrayUtilityUpdate(addressArrayUtility.address);
				await registry.percentUtilityUpdate(percentUtility.address);

				await expect(registry.v1EMPStrategyUtilityUpdate(ethers.constants.AddressZero)).to.be.rejectedWith(
					ERROR.REGISTRY.STRATEGY_UTILITY_IS_ADDRESS_ZERO
				);
			});

			it("Should not allow to set _v1EMPStrategyUtility until _addressArrayUtility is set..", async () => {
				await expect(registry.v1EMPStrategyUtilityUpdate(fakeStrategyUtility.address)).to.be.rejectedWith(
					ERROR.REGISTRY.ARRAY_UTILITY_NOT_SET
				);
			});

			it("Should update _v1EMPStrategyUtility with valid params..", async () => {
				await registry.addressArrayUtilityUpdate(addressArrayUtility.address);
				await registry.percentUtilityUpdate(percentUtility.address);

				await expect(registry.v1EMPStrategyUtilityUpdate(fakeStrategyUtility.address)).to.be.not.rejected;

				expect(await registry.v1EMPStrategyUtility()).to.be.equal(fakeStrategyUtility.address);
			});
		});

		describe("function v1EMPUtilityUpdate()", () => {
			it("[auth] Should revert if an unauthorized sender calls..", async () => {
				await expect(registry.connect(badActor).v1EMPUtilityUpdate(badActor.address)).to.be.rejectedWith(
					ERROR.NOT_AUTHORIZED
				);
			});

			it("Should not allow __v1EMPUtility to be address(0)..", async () => {
				await registry.addressArrayUtilityUpdate(addressArrayUtility.address);
				await registry.percentUtilityUpdate(percentUtility.address);

				await expect(registry.v1EMPUtilityUpdate(ethers.constants.AddressZero)).to.be.rejectedWith(
					ERROR.REGISTRY.EMP_UTILITY_IS_ADDRESS_ZERO
				);
			});

			it("Should not allow to set v1EMPUtility until _addressArrayUtility is set..", async () => {
				await expect(registry.v1EMPUtilityUpdate(owner.address)).to.be.rejectedWith(
					ERROR.REGISTRY.ARRAY_UTILITY_NOT_SET
				);
			});

			it("Should update _v1EMPUtility with valid params..", async () => {
				await registry.addressArrayUtilityUpdate(addressArrayUtility.address);
				await registry.percentUtilityUpdate(percentUtility.address);

				await expect(registry.v1EMPUtilityUpdate(fakeEMPUtility.address)).to.be.not.rejected;

				expect(await registry.v1EMPUtility()).to.be.equal(fakeEMPUtility.address);
			});
		});
	});
});
