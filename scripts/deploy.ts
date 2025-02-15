import { writeFileSync } from "fs";
import { ethers, run, network } from "hardhat";
import { deployContract } from "../util/UtilEMP";


require("dotenv").config();

const path = require('path');


const filePath = path.join(__dirname, '..', 'deployed.txt');
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


async function main()
{
	console.log("Attempting Deployment..");

	let governanceContract: string;
	let addressArrayUtilityContract: string;

	switch (network.name)
	{
		case "sepolia":
			if (!process.env.YIELD_SYNC_GOVERNANCE_ADDRESS_SEPOLIA)
			{
				console.error("Error: No Yield Sync Governance contract set for Sepolia.");

				process.exit(2);
			}

			governanceContract = process.env.YIELD_SYNC_GOVERNANCE_ADDRESS_SEPOLIA;

			if (!process.env.YIELD_SYNC_UTILITY_ARRAY_UTILITY_SEPOLIA)
			{
				console.error("Error: No Yield Sync addressArrayUtility contract set for Sepolia.");

				process.exit(2);
			}

			addressArrayUtilityContract = process.env.YIELD_SYNC_UTILITY_ARRAY_UTILITY_SEPOLIA;

			break;

		case "base-sepolia":
			if (!process.env.YIELD_SYNC_GOVERNANCE_ADDRESS_BASE_SEPOLIA)
			{
				console.error("Error: No Yield Sync Governance contract set for Base Sepolia.");

				process.exit(2);
			}

			governanceContract = process.env.YIELD_SYNC_GOVERNANCE_ADDRESS_BASE_SEPOLIA;

			if (!process.env.YIELD_SYNC_UTILITY_ARRAY_UTILITY_BASE_SEPOLIA)
			{
				console.error("Error: No Yield Sync addressArrayUtility contract set for Base Sepolia.");

				process.exit(2);
			}

			addressArrayUtilityContract = process.env.YIELD_SYNC_UTILITY_ARRAY_UTILITY_BASE_SEPOLIA;

			break;

		default:
			console.error("Error: Unknown network");
			process.exit(999);
	}

	const [DEPLOYER] = await ethers.getSigners();

	writeFileSync(filePath, `Attempted Deployment Timestamp: ${Date.now()}\n`, { flag: "a" });

	const notice_network: string = `Network: ${network.name}\n`;

	writeFileSync(filePath, notice_network, { flag: "a" });
	console.log(notice_network);

	const notice_account: string = `Account: ${DEPLOYER.address}\n`;

	writeFileSync(filePath, notice_account, { flag: "a" });
	console.log(notice_account);

	const notice_balance: string = `Balance: ${await DEPLOYER.getBalance()}\n`;

	writeFileSync(filePath, notice_balance, { flag: "a" });
	console.log(notice_balance);


	// Registry
	const registry = await deployContract("V1EMPRegistry", [governanceContract]);

	writeFileSync(filePath, `V1EMPRegistry: ${registry.address}\n`, { flag: "a" });

	console.log("registry contract address:", registry.address);


	// Strategy Utility
	const eMPStrategyUtility = await deployContract("V1EMPStrategyUtility", [registry.address]);

	writeFileSync(filePath, `V1EMPStrategyUtility: ${eMPStrategyUtility.address}\n`, { flag: "a" });

	console.log("eMPStrategyUtility contract address:", eMPStrategyUtility.address);


	// EMP Utility
	const eMPUtility = await deployContract("V1EMPUtility", [registry.address]);

	writeFileSync(filePath, `V1EMPUtility: ${eMPUtility.address}\n`, { flag: "a" });

	console.log("eMPUtility contract address:", eMPUtility.address);


	// Strategy Deployer
	const strategyDeployer = await deployContract("V1EMPStrategyDeployer", [registry.address]);

	writeFileSync(filePath, `V1EMPStrategyDeployer: ${strategyDeployer.address}\n`, { flag: "a" });

	console.log("strategyDeployer contract address:", strategyDeployer.address);


	// EMP Deployer
	const eMPDeployer = await deployContract("V1EMPDeployer", [registry.address]);

	writeFileSync(filePath, `V1EMPDeployer: ${eMPDeployer.address}\n`, { flag: "a" });

	console.log("eMPDeployer contract address:", eMPDeployer.address);


	// Register the contract on the register contract
	/// TODO: await registry.percentUtilityUpdate(percentUtilityContract);

	await registry.addressArrayUtilityUpdate(addressArrayUtilityContract);

	await registry.v1EMPStrategyUtilityUpdate(eMPStrategyUtility.address);

	await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);

	await registry.v1EMPUtilityUpdate(eMPUtility.address);

	await registry.v1EMPDeployerUpdate(eMPDeployer.address);


	// Delay
	console.log("Waiting 30 seconds before verifying..");
	await delay(30000);


	// verify
	try
	{
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

	const notice_balance_after: string = `Account Balance After: ${await DEPLOYER.getBalance()}\n`;

	writeFileSync(filePath, notice_balance_after, { flag: "a" });

	writeFileSync(
		filePath,
		`================================================================================\n\n`,
		{ flag: "a" }
	);

	console.log(notice_balance_after);
}


main().then(() => {
	process.exit(0);
}).catch((error) => {
	console.error(error);
	process.exit(1);
});
