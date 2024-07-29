const { ethers } = require("hardhat");

import { BigNumber, Contract } from "ethers";

import { D_18 } from "../const"


export default class EMPTransferUtil
{
	private _registry: Contract;
	private _eMP: Contract;


	constructor (_eMP: Contract, _registry: Contract)
	{
		this._eMP = _eMP;
		this._registry = _registry;
	}


	/**
	 * Calculate ERC20 required by a total ETH Amount
	 * @param ETHValue {BigNumber} Deposit ETH value
	 * @returns Object containing utilized ERC 20 amounts
	 */
	public async calculateERC20Required(ETHValue: BigNumber): Promise<BigNumber[]>
	{
		const UTILIZED_ERC20S = await this._eMP.utilizedERC20();

		let utilizedERC20Amount: BigNumber[] = [];

		for (let i: number = 0; i < UTILIZED_ERC20S.length; i++)
		{
			const ERC20_ETH_VALUE = await (
				await ethers.getContractAt(
					"IV1EMPETHValueFeed",
					await this._registry.eRC20_v1EMPERC20ETHValueFeed(UTILIZED_ERC20S[i])
				)
			).utilizedERC20ETHValue();

			const UTILIZATION = await this._eMP.utilizedERC20_utilizationERC20(UTILIZED_ERC20S[i]);

			let tokenAmount: BigNumber = ethers.utils.parseUnits("0", 18);

			if (UTILIZATION.deposit)
			{
				tokenAmount = ETHValue.mul(UTILIZATION.allocation).div(ERC20_ETH_VALUE);
			}

			utilizedERC20Amount.push(tokenAmount);
		}

		return utilizedERC20Amount;
	}

	/**
	 * This function calculates the ETH value of each token as well as the total value of everything held by deposits param
	 * @param _utilizedERC20Deposits {BigNumber[]} ERC20 deposits
	 * @returns Object containing the ETH value of each ERC20 token and Total ETH value of all ERC20 tokens
	 */
	public async valueOfERC20Deposits(
		_utilizedERC20Deposits: BigNumber[]
	): Promise<{totalEthValue: BigNumber, utilizedERC20DepositEthValue: BigNumber[]}>
	{
		const UTILIZED_ERC20S = await this._eMP.utilizedERC20();

		let totalEthValue: BigNumber = ethers.utils.parseUnits("0", 18);

		let utilizedERC20DepositEthValue: BigNumber[] = [];

		// Calculate how much of each utilized tokens are being used
		for (let i: number = 0; i < UTILIZED_ERC20S.length; i++)
		{
			const feed = await ethers.getContractAt(
				"ETHValueFeedDummy",
				await this._registry.eRC20_v1EMPERC20ETHValueFeed(UTILIZED_ERC20S[i])
			);

			const ETH_VALUE: BigNumber = await feed.utilizedERC20ETHValue();

			totalEthValue = totalEthValue.add(_utilizedERC20Deposits[i].mul(ETH_VALUE).div(D_18));

			utilizedERC20DepositEthValue.push(_utilizedERC20Deposits[i].mul(ETH_VALUE).div(D_18));
		}

		return {
			totalEthValue,
			utilizedERC20DepositEthValue
		};
	}
}
