import { Contract } from "ethers";

import { deployContract } from "../../util/UtilEMP";
import stageContracts, { StageContracts5 } from "../5-EMPStrategy/stage-contracts-5";


export type StageContracts6 = StageContracts5 & {
	eMPDeployer: Contract,
};


export default async (): Promise<StageContracts6> => {
	const CONTRACTS: StageContracts5 = await stageContracts();

	const eMPDeployer: Contract = await deployContract("V1EMPDeployer", [CONTRACTS.registry.address]);

	await CONTRACTS.registry.v1EMPDeployerUpdate(eMPDeployer.address);

	return { ...CONTRACTS, eMPDeployer, };
};
