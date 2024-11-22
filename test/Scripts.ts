import { BigNumber, Contract, ContractFactory } from "ethers";

import EMPTransferUtil from "../util/EMPTransferUtil";
import StrategyTransferUtil from "../util/StrategyTransferUtil";


const { ethers } = require("hardhat");

const LOCATION_MOCKERC20: string = "MockERC20";


class TransferOpenError extends Error {}


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
* @param strategyDeployer {Conract}
* @param V1EMPStrategy {ContractFactory}
* @param deployStrategies {DeployStrategy[]}
* @returns Promise<TestStrategy[]>
*/
export async function deployStrategies(
	registry: Contract,
	strategyDeployer: Contract,
	V1EMPStrategy: ContractFactory,
	deployStrategies: DeployStrategy[]
): Promise<TestStrategy[]>
{
	let testStrategies: TestStrategy[] = [];

	for (let i: number = 0; i < deployStrategies.length; i++)
	{
		await strategyDeployer.deployV1EMPStrategy();

		let deployedV1EMPStrategy = await V1EMPStrategy.attach(String(await registry.v1EMPStrategyId_v1EMPStrategy(i + 1)));

		if (deployStrategies[i].strategyInteractor)
		{
			await deployedV1EMPStrategy.iV1EMPStrategyInteractorUpdate(deployStrategies[i].strategyInteractor);
		}

		await deployedV1EMPStrategy.utilizedERC20Update(
			deployStrategies[i].strategyUtilizedERC20,
			deployStrategies[i].strategyUtilization
		);

		if (deployStrategies[i].strategyInteractor)
		{
			if (await deployedV1EMPStrategy.utilizedERC20DepositOpen() == false)
			{
				await deployedV1EMPStrategy.utilizedERC20DepositOpenToggle();
			}

			if (await deployedV1EMPStrategy.utilizedERC20WithdrawOpen() == false)
			{
				await deployedV1EMPStrategy.utilizedERC20WithdrawOpenToggle();
			}
		}

		testStrategies[i] = {
			contract: deployedV1EMPStrategy,
			strategyTransferUtil: new StrategyTransferUtil(deployedV1EMPStrategy, registry)
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

		let registryResults = await registry.v1EMPId_v1EMP(i + 1);

		const eMPContract = await V1EMP.attach(String(registryResults));

		testEMPs[i] = ({
			contract: eMPContract,
			eMPTransferUtil: new EMPTransferUtil(eMPContract, registry, eMPUtility),
		});

		// Set the Manager
		await testEMPs[i].contract.managerUpdate(manager);

		if (await testEMPs[i].contract.utilizedERC20DepositOpen() || await testEMPs[i].contract.utilizedERC20WithdrawOpen())
		{
			throw new TransferOpenError("Deposits or withdraw is open");
		}

		// Set the utilzation to 2 different strategies
		await testEMPs[i].contract.utilizedV1EMPStrategyUpdate(
			deployEMPs[i].utilizedEMPStrategyUpdate,
			deployEMPs[i].utilizedEMPStrategyAllocationUpdate
		);

		// Open deposits
		await testEMPs[i].contract.utilizedERC20DepositOpenToggle();

		// Open withdrawals
		await testEMPs[i].contract.utilizedERC20WithdrawOpenToggle();

		if (!await testEMPs[i].contract.utilizedERC20DepositOpen() || !await testEMPs[i].contract.utilizedERC20WithdrawOpen())
		{
			throw new TransferOpenError("Deposits or withdraw is closed");
		}
	}

	return testEMPs;
}
