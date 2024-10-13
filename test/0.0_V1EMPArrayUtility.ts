const { ethers } = require("hardhat");


import { expect } from "chai";
import { Contract, ContractFactory, VoidSigner } from "ethers";


const stageContracts = async () => {
	const TestV1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("TestV1EMPArrayUtility");

	const arrayUtility: Contract = await (await TestV1EMPArrayUtility.deploy()).deployed();

	return {
		arrayUtility
	};
}


describe("[0.0] V1EMPArrayUtility.sol", async () => {
	let arrayUtility: Contract;

	let owner: VoidSigner;
	let manager: VoidSigner;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		const stagedContracts = await stageContracts();

		arrayUtility = stagedContracts.arrayUtility;
	});


	describe("function sort()", async () => {
		it(
			"Should sort an unordered array..",
			async () => {
				[owner, manager] = await ethers.getSigners();

				const OWNER_IN_BASE_10 = parseInt(owner.address, 16)
				const MANAGER_IN_BASE_10 = parseInt(manager.address, 16)

				// Simple
				let result = await arrayUtility.sort(
					[owner.address, owner.address, ethers.constants.AddressZero]
				);

				expect(result[0]).to.be.equal(ethers.constants.AddressZero);
				expect(result[1]).to.be.equal(owner.address);
				expect(result[2]).to.be.equal(owner.address);

				// With multiple addresses
				let result2 = await arrayUtility.sort(
					[manager.address, owner.address, ethers.constants.AddressZero]
				);

				expect(result2[0]).to.be.equal(ethers.constants.AddressZero);

				if (OWNER_IN_BASE_10 > MANAGER_IN_BASE_10)
				{
					expect(result2[1]).to.be.equal(manager.address);
					expect(result2[2]).to.be.equal(owner.address);
				}
				else
				{
					expect(result2[1]).to.be.equal(owner.address);
					expect(result2[2]).to.be.equal(manager.address);
				}
			}
		);
	});

	describe("function containsDuplicates()", async () => {
		it(
			"Should return true if duplicates are in array..",
			async () => {
				await arrayUtility.containsDuplicates([owner.address, owner.address]);

				expect(await arrayUtility.duplicateFound()).to.be.equal(true);
			}
		);

		it(
			"Should return false if duplicates NOT in array..",
			async () => {
				await arrayUtility.containsDuplicates([owner.address, manager.address]);

				expect(await arrayUtility.duplicateFound()).to.be.equal(false);
			}
		);

		it(
			"Should clear seen mapping after utilzing..",
			async () => {
				await arrayUtility.containsDuplicates([owner.address, manager.address]);

				expect(await arrayUtility.duplicateFound()).to.be.equal(false);

				expect(await arrayUtility.seen(owner.address)).to.be.equal(false);

				expect(await arrayUtility.seen(manager.address)).to.be.equal(false);
			}
		);

	});

	describe("function removeDuplicates()", async () => {
		it(
			"Should remove duplicates from an array..",
			async () => {
				await arrayUtility.removeDuplicates([owner.address, owner.address]);

				let result = await arrayUtility.uniqueAddresses();

				expect(result.length).to.be.equal(1);
				expect(result[0]).to.be.equal(owner.address);
			}
		);
	});
});
