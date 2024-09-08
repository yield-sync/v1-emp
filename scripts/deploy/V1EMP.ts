require("dotenv").config();


import { Contract, ContractFactory } from "ethers";
import { ethers, run, network } from "hardhat";


// [const]
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

	console.log("Deploying contract with Account:", OWNER.address, "with balance of", await OWNER.getBalance());

	// Get contract factories
	const V1EMPArrayUtility: ContractFactory = await ethers.getContractFactory("V1EMPArrayUtility");
	const V1EMPDeployer: ContractFactory = await ethers.getContractFactory("V1EMPDeployer");
	const V1EMPRegistry: ContractFactory = await ethers.getContractFactory("V1EMPRegistry");
	const V1EMPStrategyDeployer: ContractFactory = await ethers.getContractFactory("V1EMPStrategyDeployer");
	const V1EMPAmountsValidator: ContractFactory= await ethers.getContractFactory("V1EMPAmountsValidator");

	let arrayUtility: Contract = await (await V1EMPArrayUtility.deploy()).deployed();

	console.log("arrayUtility Contract address:", arrayUtility.address);

	let registry = await (await V1EMPRegistry.deploy(governanceContract)).deployed();

	console.log("registry Contract address:", registry.address);

	await registry.v1EMPArrayUtilityUpdate(arrayUtility.address);

	let strategyDeployer = await (await V1EMPStrategyDeployer.deploy(registry.address)).deployed();

	console.log("strategyDeployer Contract address:", strategyDeployer.address);

	await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);

	let eMPUtility = await (await V1EMPAmountsValidator.deploy(registry.address)).deployed();

	console.log("eMPUtility Contract address:", eMPUtility.address);

	await registry.v1EMPAmountsValidatorUpdate(eMPUtility.address);

	let eMPDeployer = await (await V1EMPDeployer.deploy(registry.address)).deployed();

	console.log("eMPDeployer Contract address:", eMPDeployer.address);

	await registry.v1EMPDeployerUpdate(eMPDeployer.address);

	console.log("Waiting 30 seconds before verifying..");

	// Delay
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
				constructorArguments: [],
				contract: "contracts/V1EMPRegistry.sol:V1EMPRegistry"
			}
		);

		// V1 EMP Strategy Deployer
		await run(
			"verify:verify",
			{
				address: strategyDeployer.address,
				constructorArguments: [],
				contract: "contracts/V1EMPStrategyDeployer.sol:V1EMPStrategyDeployer"
			}
		);

		// V1 EMP Deployer
		await run(
			"verify:verify",
			{
				address: eMPDeployer.address,
				constructorArguments: [],
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
