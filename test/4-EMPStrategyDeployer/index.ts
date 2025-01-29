import { expect } from "chai";
import { Contract, VoidSigner } from "ethers";
import { deployContract } from "../../util/UtilEMP";


const { ethers } = require("hardhat");


describe("[4.0] V1EMPStrategyDeployer.sol", async () => {
	let addressArrayUtility: Contract;
	let governance: Contract;
	let registry: Contract;
	let strategyDeployer: Contract;

	let treasury: VoidSigner;
	let badActor: VoidSigner;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		[, , treasury, badActor] = await ethers.getSigners();

		governance = await deployContract("YieldSyncGovernance");
		addressArrayUtility = await deployContract("AddressArrayUtility");
		registry = await deployContract("V1EMPRegistry", [governance.address]);
		strategyDeployer = await deployContract("V1EMPStrategyDeployer", [registry.address]);

		await governance.payToUpdate(treasury.address);
		await registry.addressArrayUtilityUpdate(addressArrayUtility.address);
		await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);
	});


	describe("function deployV1EMPStrategyOpenUpdate()", async () => {
		it("[auth] Should revert if an unauthorized sender calls..", async () => {
			await expect(strategyDeployer.connect(badActor).deployV1EMPStrategyOpenUpdate(true)).to.be.rejectedWith(
				"!authorized"
			);
		});

		it("Should update deployV1EMPStrategyOpen..", async () => {
			expect(await strategyDeployer.deployV1EMPStrategyOpen()).to.be.equal(false);

			await expect(strategyDeployer.deployV1EMPStrategyOpenUpdate(true)).to.be.not.rejected;

			expect(await strategyDeployer.deployV1EMPStrategyOpen()).to.be.equal(true);
		});
	});

	describe("function deployV1EMPStrategy()", async () => {
		it("[auth] Should revert if an unauthorized sender calls..", async () => {
			await expect(strategyDeployer.connect(badActor).deployV1EMPStrategy()).to.be.rejectedWith(
				"!authorized"
			);
		});

		it("Should be able to deploy a strategy..", async () => {
			await expect(strategyDeployer.deployV1EMPStrategy()).to.be.not.rejected;

			expect(await registry.v1EMPStrategyId_v1EMPStrategy(1)).to.be.not.equal(ethers.constants.AddressZero);
		});

		it("Should allow anyone to deploy EMP Strategy if open..", async () => {
			await strategyDeployer.deployV1EMPStrategyOpenUpdate(true);

			await expect(strategyDeployer.connect(badActor).deployV1EMPStrategy()).to.be.not.rejected;

			expect(await registry.v1EMPStrategyId_v1EMPStrategy(1)).to.be.not.equal(ethers.constants.AddressZero);
		});
	});
});
