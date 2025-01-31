import { Contract, VoidSigner } from "ethers";

import { PERCENT } from "../../const";
import { deployContract, deployEMP, deployStrategies } from "../../util/UtilEMP";


const { ethers } = require("hardhat");


export default async () => {
	let addressArrayUtility: Contract;
	let governance: Contract;
	let eMPDeployer: Contract;
	let eMPUtility: Contract;
	let eTHValueProvider: Contract;
	let eTHValueProviderC: Contract;
	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;
	let registry: Contract;
	let strategyDeployer: Contract;
	let strategyUtility: Contract;

	let manager: VoidSigner;
	let badActor: VoidSigner;
	let owner: VoidSigner;
	let treasury: VoidSigner;

	let eMPs: TestEMP[] = [];
	let strategies: TestStrategy[] = [];

	[owner, manager, treasury, badActor] = await ethers.getSigners();

	// Core contracts
	governance = await deployContract("YieldSyncGovernance");

	await governance.payToUpdate(treasury.address);

	addressArrayUtility = await deployContract("AddressArrayUtility");

	registry = await deployContract("V1EMPRegistry", [governance.address]);

	await registry.addressArrayUtilityUpdate(addressArrayUtility.address);

	strategyUtility = await deployContract("V1EMPStrategyUtility", [registry.address]);

	await registry.v1EMPStrategyUtilityUpdate(strategyUtility.address);

	strategyDeployer = await deployContract("V1EMPStrategyDeployer", [registry.address]);

	await registry.v1EMPStrategyDeployerUpdate(strategyDeployer.address);

	eMPUtility = await deployContract("V1EMPUtility", [registry.address]);

	await registry.v1EMPUtilityUpdate(eMPUtility.address);

	eMPDeployer = await deployContract("V1EMPDeployer", [registry.address]);

	await registry.v1EMPDeployerUpdate(eMPDeployer.address);

	mockERC20A = await deployContract("MockERC20", ["Mock A", "A", 18]);
	mockERC20B = await deployContract("MockERC20", ["Mock B", "B", 18]);
	mockERC20C = await deployContract("MockERC20", ["Mock C", "C", 6]);

	eTHValueProvider = await deployContract("MockERC20ETHValueProvider", [18]);
	eTHValueProviderC = await deployContract("MockERC20ETHValueProvider", [6]);

	await registry.eRC20_eRC20ETHValueProviderUpdate(mockERC20A.address, eTHValueProvider.address);
	await registry.eRC20_eRC20ETHValueProviderUpdate(mockERC20B.address, eTHValueProvider.address);
	await registry.eRC20_eRC20ETHValueProviderUpdate(mockERC20C.address, eTHValueProviderC.address);

	/**
	* EMP Strategies
	*/
	strategies = await deployStrategies(
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
	eMPs = await deployEMP(
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
