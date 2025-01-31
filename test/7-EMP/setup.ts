import { Contract, VoidSigner } from "ethers";

import { PERCENT } from "../../const";
import { deployContract, deployEMP, deployStrategies } from "../../util/UtilEMP";


const { ethers } = require("hardhat");


export default async () => {
	const [owner, manager, treasury, badActor]: VoidSigner[] = await ethers.getSigners();


	const governance: Contract = await deployContract("YieldSyncGovernance");

	await governance.payToUpdate(treasury.address);

	const addressArrayUtility: Contract = await deployContract("AddressArrayUtility");

	const registry: Contract = await deployContract("V1EMPRegistry", [governance.address]);

	await registry.addressArrayUtilityUpdate(addressArrayUtility.address);

	const strategyUtility: Contract = await deployContract("V1EMPStrategyUtility", [registry.address]);

	await registry.v1EMPStrategyUtilityUpdate(strategyUtility.address);

	const strategyDeployer: Contract = await deployContract("V1EMPStrategyDeployer", [registry.address]);

	await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);

	const eMPUtility: Contract = await deployContract("V1EMPUtility", [registry.address]);

	await registry.v1EMPUtilityUpdate(eMPUtility.address);

	const eMPDeployer: Contract = await deployContract("V1EMPDeployer", [registry.address]);

	await registry.v1EMPDeployerUpdate(eMPDeployer.address);

	const mockERC20A: Contract = await deployContract("MockERC20", ["Mock A", "A", 18]);
	const mockERC20B: Contract = await deployContract("MockERC20", ["Mock B", "B", 18]);
	const mockERC20C: Contract = await deployContract("MockERC20", ["Mock C", "C", 6]);

	const eTHValueProvider: Contract = await deployContract("MockERC20ETHValueProvider", [18]);
	const eTHValueProviderC: Contract = await deployContract("MockERC20ETHValueProvider", [6]);

	await registry.eRC20_eRC20ETHValueProviderUpdate(mockERC20A.address, eTHValueProvider.address);
	await registry.eRC20_eRC20ETHValueProviderUpdate(mockERC20B.address, eTHValueProvider.address);
	await registry.eRC20_eRC20ETHValueProviderUpdate(mockERC20C.address, eTHValueProviderC.address);

	/**
	* EMP Strategies
	*/
	const strategies: TestStrategy[] = await deployStrategies(
		registry,
		strategyDeployer,
		[
			{
				strategyUtilizedERC20: [mockERC20A.address, mockERC20B.address],
				strategyUtilization: [[true, true, PERCENT.FIFTY], [true, true, PERCENT.FIFTY]],
			},
			{
				strategyUtilizedERC20: [mockERC20C.address],
				strategyUtilization: [[true, true, PERCENT.HUNDRED]],
			},
		],
	);

	const eRC20Handler = await deployContract("Holder", [strategies[0].contract.address]);
	const eRC20Handler2 = await deployContract("Holder", [strategies[1].contract.address]);

	await strategies[0].contract.iERC20HandlerUpdate(eRC20Handler.address);
	await strategies[1].contract.iERC20HandlerUpdate(eRC20Handler2.address);

	await strategies[0].contract.utilizedERC20DepositOpenUpdate(true);
	await strategies[0].contract.utilizedERC20WithdrawOpenUpdate(true);

	await strategies[1].contract.utilizedERC20DepositOpenUpdate(true);
	await strategies[1].contract.utilizedERC20WithdrawOpenUpdate(true);

	/**
	* EMP
	*/
	const eMPs: TestEMP[] = await deployEMP(
		manager.address,
		registry,
		eMPDeployer,
		eMPUtility,
		[
			{
				name: "EMP 1",
				ticker: "EMP1",
				utilizedEMPStrategyUpdate: [strategies[0].contract.address, strategies[1].contract.address],
				utilizedEMPStrategyAllocationUpdate: [PERCENT.FIFTY, PERCENT.FIFTY],
			},
			{
				name: "EMP 2",
				ticker: "EMP2",
				utilizedEMPStrategyUpdate: [strategies[0].contract.address, strategies[1].contract.address],
				utilizedEMPStrategyAllocationUpdate: [PERCENT.SEVENTY_FIVE, PERCENT.TWENTY_FIVE],
			},
			{
				name: "EMP 3",
				ticker: "EMP3",
				utilizedEMPStrategyUpdate: [],
				utilizedEMPStrategyAllocationUpdate: [],
			},
		]
	);

	return {
		addressArrayUtility,
		governance,
		eTHValueProvider,
		eTHValueProviderC,
		eMPDeployer,
		eMPs,
		eMPUtility,
		manager,
		mockERC20A,
		mockERC20B,
		mockERC20C,
		badActor,
		owner,
		registry,
		strategies,
		strategyDeployer,
		strategyUtility,
		treasury,
	};
};
