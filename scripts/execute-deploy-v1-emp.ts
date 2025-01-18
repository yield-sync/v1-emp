require("dotenv").config();


import { Contract, ContractFactory } from "ethers";
import { ethers, run, network } from "hardhat";


// [const]
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


async function main()
{
	let v1EMPDeployer: string;
	let v1EMPRegistry: string;

	switch (network.name)
	{
		case "sepolia":
			if (!process.env.V1_EMP_DEPLOYER_SEPOLIA || !process.env.V1_EMP_REGISTER_SEPOLIA)
			{
				console.error("Error: V1EMPDeployer or v1EMPRegistry set for Sepolia.");

				process.exit(2)
			}

			v1EMPRegistry = process.env.V1_EMP_REGISTER_SEPOLIA;

			v1EMPDeployer = process.env.V1_EMP_DEPLOYER_SEPOLIA;

			break;

		case "base-sepolia":
			if (!process.env.V1_EMP_DEPLOYER_BASE_SEPOLIA || !process.env.V1_EMP_REGISTER_BASE_SEPOLIA)
			{
				console.error("Error: No V1EMPDeployer or v1EMPRegistry set for Base Sepolia.");

				process.exit(2)
			}

			v1EMPRegistry = process.env.V1_EMP_REGISTER_BASE_SEPOLIA;

			v1EMPDeployer = process.env.V1_EMP_DEPLOYER_BASE_SEPOLIA;

			break;

		default:
			process.exit(999)
	}

	const [OWNER] = await ethers.getSigners();

	const V1EMPRegistry: ContractFactory = await ethers.getContractFactory("V1EMPRegistry");
	const V1EMPDeployer: ContractFactory = await ethers.getContractFactory("V1EMPDeployer");

	const registry: Contract = await V1EMPRegistry.attach(String(v1EMPRegistry));
	const empDeployer: Contract = await V1EMPDeployer.attach(String(v1EMPDeployer));

	// Main function
	await empDeployer.deployV1EMP(false, "EMP1", "EMP1");

	// Delay
	console.log("Waiting 30 seconds before verifying..");
	await delay(30000);


	// verify
	try
	{
		// V1 EMP
		await run(
			"verify:verify",
			{
				address: await registry.v1EMPId_v1EMP(await registry.v1EMPIdTracker() - 1),
				constructorArguments: [OWNER.address, String(v1EMPRegistry), false, "EMP1", "EMP1"],
				contract: "contracts/V1EMP.sol:V1EMP"
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
