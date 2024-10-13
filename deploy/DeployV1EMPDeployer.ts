require("dotenv").config();

const fs = require('fs');
const path = require('path');

import { Contract, ContractFactory } from "ethers";
import { writeFileSync } from "fs";
import { ethers, run, network } from "hardhat";


// [const]
const filePath = path.join(__dirname, '..', '..', 'deployed.txt');
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


async function main() {
	let governanceContract: string;

	switch (network.name)
	{
		case "sepolia":
			if (!process.env.YIELD_SYNC_GOVERNANCE_ADDRESS_SEPOLIA)
			{
				console.error("Error: No Yield Sync Governance contract set for Sepolia.");

				process.exit(2)
			}

			governanceContract = process.env.YIELD_SYNC_GOVERNANCE_ADDRESS_SEPOLIA;

			break;

		case "base-sepolia":
			if (!process.env.YIELD_SYNC_GOVERNANCE_ADDRESS_BASE_SEPOLIA)
			{
				console.error("Error: No Yield Sync Governance contract set for Base Sepolia.");

				process.exit(2)
			}

			governanceContract = process.env.YIELD_SYNC_GOVERNANCE_ADDRESS_BASE_SEPOLIA;

			break;

		default:
			process.exit(999)
	}

	const [OWNER] = await ethers.getSigners();

	const startingStatement = `Deploying \nNetwork: ${network.name} \nAccount: ${OWNER.address} \nBalance: ${await OWNER.getBalance()}\n`;

	writeFileSync(filePath, startingStatement, { flag: "a" });

	console.log(startingStatement);

	// Get contract factories
	const V1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("V1EMPArrayUtility");
	const V1EMPUtility: ContractFactory= await ethers.getContractFactory("V1EMPUtility");
	const V1EMPStrategyUtility: ContractFactory= await ethers.getContractFactory("V1EMPStrategyUtility");
	const V1EMPDeployer: ContractFactory = await ethers.getContractFactory("V1EMPDeployer");
	const V1EMPRegistry: ContractFactory = await ethers.getContractFactory("V1EMPRegistry");
	const V1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("V1EMPStrategyDeployer");

	// Registry
	let registry = await (await V1EMPRegistry.deploy(governanceContract)).deployed();

	console.log("registry contract address:", registry.address);

	writeFileSync(filePath, `V1EMPRegistry: ${registry.address}\n`, { flag: "a" });

	// Array Utility
	let arrayUtility: Contract = await (await V1EMPArrayUtility.deploy()).deployed();

	console.log("arrayUtility contract address:", arrayUtility.address);

	writeFileSync(filePath, `V1EMPArrayUtility: ${arrayUtility.address}\n`, { flag: "a" });

	// Register the Array Utility
	await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);


	// Strategy Utility
	let eMPStrategyUtility = await (await V1EMPStrategyUtility.deploy(registry.address)).deployed();

	console.log("eMPStrategyUtility contract address:", eMPStrategyUtility.address);

	writeFileSync(filePath, `V1EMPStrategyUtility: ${eMPStrategyUtility.address}\n`, { flag: "a" });

	await registry.v1EMPStrategyUtilityUpdate(eMPStrategyUtility.address);


	// EMP Utility
	let eMPUtility = await (await V1EMPUtility.deploy(registry.address)).deployed();

	console.log("eMPUtility contract address:", eMPUtility.address);

	writeFileSync(filePath, `V1EMPUtility: ${eMPUtility.address}\n`, { flag: "a" });

	await registry.v1EMPUtilityUpdate(eMPUtility.address);


	// Strategy Deployer
	let strategyDeployer = await (await V1EMPStrategyDeployer.deploy(registry.address)).deployed();

	console.log("strategyDeployer contract address:", strategyDeployer.address);

	writeFileSync(filePath, `V1EMPStrategyDeployer: ${strategyDeployer.address}\n`, { flag: "a" });

	await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);


	// EMP Deployer
	let eMPDeployer = await (await V1EMPDeployer.deploy(registry.address)).deployed();

	console.log("eMPDeployer contract address:", eMPDeployer.address);

	writeFileSync(filePath, `V1EMPDeployer: ${eMPDeployer.address}\n`, { flag: "a" });

	await registry.v1EMPDeployerUpdate(eMPDeployer.address);


	// Delay
	console.log("Waiting 30 seconds before verifying..");
	await delay(30000);


	// verify
	try
	{
		// V1 EMP Array Utility
		await run(
			"verify:verify",
			{
				address: arrayUtility.address,
				constructorArguments: [],
				contract: "contracts/V1EMPArrayUtility.sol:V1EMPArrayUtility"
			}
		);

		// V1 EMP Registry
		await run(
			"verify:verify",
			{
				address: registry.address,
				constructorArguments: [governanceContract],
				contract: "contracts/V1EMPRegistry.sol:V1EMPRegistry"
			}
		);

		// V1 EMP Strategy Utility
		await run(
			"verify:verify",
			{
				address: eMPStrategyUtility.address,
				constructorArguments: [registry.address],
				contract: "contracts/V1EMPStrategyUtility.sol:V1EMPStrategyUtility"
			}
		);

		// V1 EMP Utility
		await run(
			"verify:verify",
			{
				address: eMPUtility.address,
				constructorArguments: [registry.address],
				contract: "contracts/V1EMPUtility.sol:V1EMPUtility"
			}
		);

		// V1 EMP Strategy Deployer
		await run(
			"verify:verify",
			{
				address: strategyDeployer.address,
				constructorArguments: [registry.address],
				contract: "contracts/V1EMPStrategyDeployer.sol:V1EMPStrategyDeployer"
			}
		);

		// V1 EMP Deployer
		await run(
			"verify:verify",
			{
				address: eMPDeployer.address,
				constructorArguments: [registry.address],
				contract: "contracts/V1EMPDeployer.sol:V1EMPDeployer"
			}
		);
	}
	catch (e: any)
	{
		if (e.message.toLowerCase().includes("already verified"))
		{
			console.log("Already verified!");
		}
		else
		{
			console.error(e);
		}
	}

	console.log("Account Balance:", await OWNER.getBalance());

}


main()
	.then(() => {
		process.exit(0);
	})
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
;
