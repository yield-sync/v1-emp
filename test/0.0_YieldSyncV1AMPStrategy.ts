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
	let strategyInteractorBlank: Contract;
	let yieldSyncV1AMPStrategy: Contract;

	beforeEach("[beforeEach] Set up contracts..", async () => {
		const [, addr1] = await ethers.getSigners();

		const YieldSyncV1AMPStrategy: ContractFactory = await ethers.getContractFactory("YieldSyncV1AMPStrategy");
		const StrategyInteractorBlank: ContractFactory = await ethers.getContractFactory("StrategyInteractorBlank");

		yieldSyncV1AMPStrategy = await (await YieldSyncV1AMPStrategy.deploy(addr1.address, "Exampe", "EX")).deployed();
		strategyInteractorBlank = await (await StrategyInteractorBlank.deploy()).deployed();
	});

	describe("initializeStrategy()", async () => {
		it(
			"It should be able to set _strategy and _utilizedERC20",
			async () => {
				const [, addr1] = await ethers.getSigners();

				await yieldSyncV1AMPStrategy.connect(addr1).initializeStrategy(strategyInteractorBlank.address, []);

				expect((await yieldSyncV1AMPStrategy.utilizedERC20()).length).to.be.equal(0);
			}
		);
	});
});
