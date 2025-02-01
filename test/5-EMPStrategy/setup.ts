import { Contract, ContractFactory, VoidSigner } from "ethers";

import UtilStrategyTransfer from "../../util/UtilStrategyTransfer";
import { deployContract } from "../../util/UtilEMP";
import setup, { SetUpContractsStage4 } from "../4-EMPStrategyDeployer/setup";


export type SetUpContractsStage5 = SetUpContractsStage4 & {
	eTHValueProvider: Contract;
	eTHValueProviderC: Contract;
};


const { ethers } = require("hardhat");


export default async (): Promise<SetUpContractsStage5> => {
	const {
		owner,
		manager,
		treasury,
		badActor,
		eMPUtility,
		mockERC20A,
		mockERC20B,
		mockERC20C,
		mockERC20D,
		governance,
		addressArrayUtility,
		registry,
		strategyDeployer,
		strategyUtility,
	}: SetUpContractsStage4 = await setup();

	const eTHValueProvider: Contract = await deployContract("MockERC20ETHValueProvider", [18]);
	const eTHValueProviderC: Contract = await deployContract("MockERC20ETHValueProvider", [6]);

	await registry.eRC20_eRC20ETHValueProviderUpdate(mockERC20A.address, eTHValueProvider.address);
	await registry.eRC20_eRC20ETHValueProviderUpdate(mockERC20B.address, eTHValueProvider.address);
	await registry.eRC20_eRC20ETHValueProviderUpdate(mockERC20C.address, eTHValueProviderC.address);
	await registry.eRC20_eRC20ETHValueProviderUpdate(mockERC20D.address, eTHValueProvider.address);

	return {
		addressArrayUtility,
		governance,
		eTHValueProvider,
		eTHValueProviderC,
		eMPUtility,
		registry,
		strategyDeployer,
		strategyUtility,
		mockERC20A,
		mockERC20B,
		mockERC20C,
		mockERC20D,
		owner,
		manager,
		treasury,
		badActor,
	};
};


export async function suiteSpecificSetup(registry: Contract, strategyDeployer: Contract, owner: VoidSigner)
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
