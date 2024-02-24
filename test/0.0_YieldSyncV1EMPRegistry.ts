const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

import { ERROR } from "../common";


describe("[0.0] YieldSyncV1EMPRegistry.sol - Setup", async () =>
{
	let yieldSyncV1EMPRegistry: Contract;


	beforeEach("[beforeEach] Set up contracts..", async () =>
	{
		const YieldSyncV1EMPRegistry: ContractFactory = await ethers.getContractFactory("YieldSyncV1EMPRegistry");

		yieldSyncV1EMPRegistry = await (await YieldSyncV1EMPRegistry.deploy()).deployed();
	});

	describe("function yieldSyncV1EMPDeployerUpdate()", async () =>
	{
		it(
			"[auth] Should revert when unauthorized msg.sender calls..",
			async () =>
			{
				const [, ADDR_1] = await ethers.getSigners();

				await expect(
					yieldSyncV1EMPRegistry.connect(ADDR_1).yieldSyncV1EMPDeployerUpdate(ADDR_1.address)
				).to.be.rejectedWith(ERROR.NOT_MANAGER);
			}
		);
	});
});
