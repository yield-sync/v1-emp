import { Contract, ContractFactory, VoidSigner } from "ethers";

import UtilStrategyTransfer from "../../util/UtilStrategyTransfer";
import { deployContract } from "../../util/UtilEMP";
import stageContracts, { StageContracts4 } from "../4-EMPStrategyDeployer/stage-contracts-4";


const { ethers } = require("hardhat");


export type StageContracts5 = StageContracts4 & {
	eTHValueProvider: Contract,
	eTHValueProviderC: Contract,
};


export default async (): Promise<StageContracts5> => {
	const CONTRACTS: StageContracts4 = await stageContracts();

	const eTHValueProvider: Contract = await deployContract("MockERC20ETHValueProvider", [18]);
	const eTHValueProviderC: Contract = await deployContract("MockERC20ETHValueProvider", [6]);

	await CONTRACTS.registry.eRC20_eRC20ETHValueProviderUpdate(CONTRACTS.eRC20A.address, eTHValueProvider.address);
	await CONTRACTS.registry.eRC20_eRC20ETHValueProviderUpdate(CONTRACTS.eRC20B.address, eTHValueProvider.address);
	await CONTRACTS.registry.eRC20_eRC20ETHValueProviderUpdate(CONTRACTS.eRC20C.address, eTHValueProviderC.address);
	await CONTRACTS.registry.eRC20_eRC20ETHValueProviderUpdate(CONTRACTS.eRC20D.address, eTHValueProvider.address);

	return { ...CONTRACTS, eTHValueProvider, eTHValueProviderC, };
};


export async function stageSpecificSetup(registry: Contract, strategyDeployer: Contract, owner: VoidSigner)
{
	/**
	* @notice The owner has to be registered as the EMP deployer so that it can authorize itself as an EMP to access the
	* functions available on the strategy.
	*/
	await registry.v1EMPDeployerUpdate(owner.address);

	await registry.v1EMPRegister(owner.address);

	// Deploy EMP Strategy
	await strategyDeployer.deployV1EMPStrategy();

	const V1EMPStrategy: ContractFactory = await ethers.getContractFactory("V1EMPStrategy");

	// Attach the deployed V1EMPStrategy address
	const strategy: Contract = await V1EMPStrategy.attach(String(await registry.v1EMPStrategyId_v1EMPStrategy(1)));

	/**
	* @dev It is important to utilize the UtilStrategyTransfer for multiple ERC20 based strategies because they get reordered
	* when setup. The strategyUtil will return the deposit amounts in the order of the what the contract returns for the
	* Utilized ERC20s
	*/
	const utilStrategyTransfer: UtilStrategyTransfer = new UtilStrategyTransfer(strategy, registry);

	const eRC20Handler: Contract = await deployContract("Holder", [strategy.address]);

	return { eRC20Handler, strategy, utilStrategyTransfer }
}
