import { Contract, ContractFactory, VoidSigner } from "ethers";

import UtilStrategyTransfer from "../../util/UtilStrategyTransfer";
import { deployContract } from "../../util/UtilEMP";


const { ethers } = require("hardhat");


/**
* @dev It is important to utilize the UtilStrategyTransfer for multiple ERC20 based strategies because they get reordered
* when setup. The strategyUtil will return the deposit amounts in the order of the what the contract returns for the
* Utilized ERC20s
*/
export default async () => {
	let addressArrayUtility: Contract;
	let governance: Contract;
	let eTHValueProvider: Contract;
	let eTHValueProviderC: Contract;
	let eRC20Handler: Contract;
	let registry: Contract;
	let strategy: Contract;
	let strategyDeployer: Contract;
	let strategyUtility: Contract;

	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;
	let mockERC20D: Contract;

	let utilStrategyTransfer: UtilStrategyTransfer;

	let owner: VoidSigner;
	let manager: VoidSigner;
	let treasury: VoidSigner;
	let badActor: VoidSigner;

	[owner, manager, treasury, badActor] = await ethers.getSigners();

	const V1EMPStrategy: ContractFactory = await ethers.getContractFactory("V1EMPStrategy");

	governance = await deployContract("YieldSyncGovernance");

	await governance.payToUpdate(treasury.address);

	addressArrayUtility = await deployContract("AddressArrayUtility");

	registry = await deployContract("V1EMPRegistry", [governance.address]);

	await registry.addressArrayUtilityUpdate(addressArrayUtility.address);

	strategyUtility = await deployContract("V1EMPStrategyUtility", [registry.address]);

	await registry.v1EMPStrategyUtilityUpdate(strategyUtility.address);

	strategyDeployer = await deployContract("V1EMPStrategyDeployer", [registry.address]);

	mockERC20A = await deployContract("MockERC20", ["Mock A", "A", 18]);
	mockERC20B = await deployContract("MockERC20", ["Mock B", "B", 18]);
	mockERC20C = await deployContract("MockERC20", ["Mock C", "C", 6]);
	mockERC20D = await deployContract("MockERC20", ["Mock D", "D", 18]);

	eTHValueProvider = await deployContract("MockERC20ETHValueProvider", [18]);
	eTHValueProviderC = await deployContract("MockERC20ETHValueProvider", [6]);

	await registry.eRC20_eRC20ETHValueProviderUpdate(mockERC20A.address, eTHValueProvider.address);
	await registry.eRC20_eRC20ETHValueProviderUpdate(mockERC20B.address, eTHValueProvider.address);
	await registry.eRC20_eRC20ETHValueProviderUpdate(mockERC20C.address, eTHValueProviderC.address);
	await registry.eRC20_eRC20ETHValueProviderUpdate(mockERC20D.address, eTHValueProvider.address);

	/**
	* @notice The owner has to be registered as the EMP deployer so that it can authorize itself as an EMP to access the
	* functions available on the strategy.
	*/
	await registry.v1EMPUtilityUpdate(owner.address);
	await registry.v1EMPDeployerUpdate(owner.address);
	await registry.v1EMPRegister(owner.address);


	// Set EMP Strategy Deployer on registry
	await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);

	// Deploy EMP Strategy
	await strategyDeployer.deployV1EMPStrategy();

	// Attach the deployed V1EMPStrategy address
	strategy = await V1EMPStrategy.attach(String(await registry.v1EMPStrategyId_v1EMPStrategy(1)));

	utilStrategyTransfer = new UtilStrategyTransfer(strategy, registry);

	eRC20Handler = await deployContract("Holder", [strategy.address]);

	return {
		addressArrayUtility,
		governance,
		eTHValueProvider,
		eTHValueProviderC,
		eRC20Handler,
		registry,
		strategy,
		strategyDeployer,
		strategyUtility,
		mockERC20A,
		mockERC20B,
		mockERC20C,
		mockERC20D,
		utilStrategyTransfer,
		owner,
		manager,
		treasury,
		badActor,
	};
}
