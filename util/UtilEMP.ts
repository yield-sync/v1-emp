import { BigNumber, Contract, ContractFactory } from "ethers";

import UtilEMPTransfer from "./UtilEMPTransfer";
import UtilStrategyTransfer from "./UtilStrategyTransfer";


const { ethers } = require("hardhat");

const LOCATION_MOCKERC20: string = "MockERC20";


class TransferOpenError extends Error {}


/**
* Deploy a Contract
* @param _contractFactory {string}
* @returns Promise<Contract>
*/
export async function deployContract(_contractFactory: string, params: any[] = []): Promise<Contract>
{
	try
	{
		const contractFactory: ContractFactory = await ethers.getContractFactory(_contractFactory);

		const deployedContract = await contractFactory.deploy(...params);

		return await deployedContract.deployed();
	}
	catch (error)
	{
		console.error("Error deploying contract:", error);

		throw error;
	}
}

/**
* Approve Tokens
* @param eMP {string}
* @param utilizedERC20 {string[]}
* @param eMPDepositAmounts {BigNumber[]}
*/
export async function approveTokens(eMP: string, utilizedERC20: string[], eMPDepositAmounts: BigNumber[])
{
	if (utilizedERC20.length != eMPDepositAmounts.length)
	{
		throw new Error("function approveTokens: utilizedERC20.length != eMPDepositAmounts.length");
	}

	for (let i: number = 0; i < utilizedERC20.length; i++)
	{
		await (await ethers.getContractAt(LOCATION_MOCKERC20, utilizedERC20[i])).approve(eMP, eMPDepositAmounts[i]);
	}
}

/**
* Deploy Strategies
* @param registry {Contract}
* @param strategyDeployer {Contract}
* @param deployStrategies {DeployStrategy[]}
* @returns Promise<TestStrategy[]>
*/
export async function deployStrategies(
	registry: Contract,
	strategyDeployer: Contract,
	deployStrategies: DeployStrategy[],
): Promise<TestStrategy[]>
{
	const V1EMPStrategy = await ethers.getContractFactory("V1EMPStrategy");

	let testStrategies: TestStrategy[] = [];

	for (let i: number = 0; i < deployStrategies.length; i++)
	{
		await strategyDeployer.deployV1EMPStrategy();

		let latestId = await registry.v1EMPStrategyIdTracker();

		let deployedV1EMPStrategy = await V1EMPStrategy.attach(
			String(await registry.v1EMPStrategyId_v1EMPStrategy(latestId))
		);

		if (deployStrategies[i].eRC20Handler)
		{
			await deployedV1EMPStrategy.iERC20HandlerUpdate(deployStrategies[i].eRC20Handler);
		}

		await deployedV1EMPStrategy.utilizedERC20Update(
			deployStrategies[i].strategyUtilizedERC20,
			deployStrategies[i].strategyUtilization
		);

		if (deployStrategies[i].eRC20Handler)
		{
			await deployedV1EMPStrategy.utilizedERC20DepositOpenUpdate(true);
			await deployedV1EMPStrategy.utilizedERC20WithdrawOpenUpdate(true);
		}

		testStrategies[i] = {
			contract: deployedV1EMPStrategy,
			UtilStrategyTransfer: new UtilStrategyTransfer(deployedV1EMPStrategy, registry)
		};
	}

	return testStrategies;
}

/**
 * Deploy EMP
 * @param manager {string}
 * @param registry {Contract}
 * @param eMPDeployer {Contract}
 * @param eMPUtility {Contract}
 * @param deployEMPs {DeployEMP[]}
 * @returns Promise<TestEMP[]>
 */
export async function deployEMP(
	manager: string,
	registry: Contract,
	eMPDeployer: Contract,
	eMPUtility: Contract,
	deployEMPs: DeployEMP[]
): Promise<TestEMP[]>
{
	const V1EMP: ContractFactory = await ethers.getContractFactory("V1EMP");

	let testEMPs: TestEMP[] = [];

	for (let i: number = 0; i < deployEMPs.length; i++)
	{
		await eMPDeployer.deployV1EMP(false, deployEMPs[i].name, deployEMPs[i].ticker);

		let latestId = await registry.v1EMPIdTracker();

		let registryResults = await registry.v1EMPId_v1EMP(latestId);

		const eMPContract = await V1EMP.attach(String(registryResults));

		testEMPs[i] = ({
			contract: eMPContract,
			UtilEMPTransfer: new UtilEMPTransfer(eMPContract, registry, eMPUtility),
		});

		// Set the Manager
		await testEMPs[i].contract.managerUpdate(manager);

		if (await testEMPs[i].contract.utilizedERC20DepositOpen() || await testEMPs[i].contract.utilizedERC20WithdrawOpen())
		{
			throw new TransferOpenError("Deposits or withdraw is open");
		}

		if (0 < deployEMPs[i].utilizedEMPStrategyUpdate.length)
		{
			// Set the utilzation to 2 different strategies
			await testEMPs[i].contract.utilizedV1EMPStrategyUpdate(
				deployEMPs[i].utilizedEMPStrategyUpdate,
				deployEMPs[i].utilizedEMPStrategyAllocationUpdate
			);
		}

		// Open deposits
		await testEMPs[i].contract.utilizedERC20DepositOpenUpdate(true);

		// Open withdrawals
		await testEMPs[i].contract.utilizedERC20WithdrawOpenUpdate(true);

		if (!await testEMPs[i].contract.utilizedERC20DepositOpen() || !await testEMPs[i].contract.utilizedERC20WithdrawOpen())
		{
			throw new TransferOpenError("Deposits or withdraw is closed");
		}
	}

	return testEMPs;
}
