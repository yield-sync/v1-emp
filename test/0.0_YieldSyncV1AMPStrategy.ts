type VaultProperty = {
	transferDelaySeconds: number,
	voteAgainstRequired: number,
	voteForRequired: number,
};

type UpdateVaultProperty = [
	// voteAgainstRequired
	number,
	// voteForRequired
	number,
	// transferDelaySeconds
	number,
];


const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";


describe("[0.0] YieldSyncV1VaultDeployer.sol", async () => {
	let mockERC20: Contract;
	let strategyInteractorBlank: Contract;
	let yieldSyncV1AMPStrategy: Contract;

	beforeEach("[beforeEach] Set up contracts..", async () => {
		const [, addr1] = await ethers.getSigners();

		const MockERC20: ContractFactory = await ethers.getContractFactory("MockERC20");
		const StrategyInteractorBlank: ContractFactory = await ethers.getContractFactory("StrategyInteractorBlank");
		const YieldSyncV1AMPStrategy: ContractFactory = await ethers.getContractFactory("YieldSyncV1AMPStrategy");

		mockERC20 = await (await MockERC20.deploy()).deployed();
		strategyInteractorBlank = await (await StrategyInteractorBlank.deploy()).deployed();
		yieldSyncV1AMPStrategy = await (await YieldSyncV1AMPStrategy.deploy(addr1.address, "Exampe", "EX")).deployed();
	});

	describe("initializeStrategy()", async () => {
		it(
			"It should be able to set _strategy and _utilizedERC20",
			async () => {
				const [, addr1] = await ethers.getSigners();

				await yieldSyncV1AMPStrategy.connect(addr1).initializeStrategy(
					strategyInteractorBlank.address,
					[mockERC20.address]
				);

				console.log();

				expect(await yieldSyncV1AMPStrategy.yieldSyncV1AMPStrategyInteractor()).to.be.equal(
					strategyInteractorBlank.address
				);
				expect((await yieldSyncV1AMPStrategy.utilizedERC20()).length).to.be.equal(1);
				expect((await yieldSyncV1AMPStrategy.utilizedERC20())[0]).to.be.equal(mockERC20.address);
			}
		);
	});
});
