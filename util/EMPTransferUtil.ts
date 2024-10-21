const { ethers } = require("hardhat");

import { BigNumber, Contract } from "ethers";

import { D_18 } from "../const"



export default class EMPTransferUtil
{
	private _registry: Contract;
	private _eMP: Contract;
	private _eMPUtility: Contract;
	private _utilizedV1EMPStrategy: string[] = [];
	private _utilizedERC20: { [key: string]: BigNumber; } = {};



	constructor (_eMP: Contract, _registry: Contract, _eMPUtility: Contract)
	{
		this._eMP = _eMP;
		this._registry = _registry;
		this._eMPUtility = _eMPUtility;
	}


	/**
	 * @notice Checks if an update is needed for the
	 */
	public async updateNeeded()
	{

	}

	/**
	 * @notice Update the utilized V1 EMP Strategies
	 */
	public async updateUtilizedV1EMPStrategy()
	{
		this._utilizedV1EMPStrategy = await this._eMP.utilizedV1EMPStrategy();
	}


	/**
	 * @notice This function computes what ERC20 are utiized without referring the the EMP utilizedERC20 function. This is
	 * neccessary because there is always a possibility that the utilizedERC20 is not updated.
	 */
	public async updateUtilizedERC20()
	{
		await this.updateUtilizedV1EMPStrategy();

		for (let i = 0; i < this._utilizedV1EMPStrategy.length; i++)
		{
			const STRATEGY = await ethers.getContractAt("V1EMPStrategy", this._utilizedV1EMPStrategy[i]);

			const STRATEGY_UTILIZED_ERC20 = await STRATEGY.utilizedERC20();

			for (let ii = 0; ii < STRATEGY_UTILIZED_ERC20.length; ii++)
			{
				const ERC20 = STRATEGY_UTILIZED_ERC20[ii];

				const ERC20_ALLOC: BigNumber = (await STRATEGY.utilizedERC20_utilizationERC20(ERC20)).allocation;

				const EMP_ERC20_ALLOC: BigNumber = ERC20_ALLOC.mul(
					await this._eMP.utilizedV1EMPStrategy_allocation(this._utilizedV1EMPStrategy[i])
				).div(
					D_18
				);

				if (!this._utilizedERC20[ERC20])
				{
					// Set to 0
					this._utilizedERC20[ERC20] = EMP_ERC20_ALLOC;

					continue;
				}

				this._utilizedERC20[ERC20] = this._utilizedERC20[ERC20].add(EMP_ERC20_ALLOC);
			}
		}
	}

	/**
	 * Calculate ERC20 required by a total ETH Amount
	 * @param ETHValue {BigNumber} Deposit ETH value
	 * @returns Object containing utilized ERC 20 amounts
	 */
	public async calculateERC20Required(ETHValue: BigNumber): Promise<BigNumber[]>
	{
		/**
		 * TODO: This should tell u what tokens are being used in the case that the utilized ERC20 has NOT been updated and
		 * needs to be recomputed
		*/

		const UTILIZED_ERC20S = await this._eMPUtility.v1EMP_utilizedERC20(this._eMP.address);

		let utilizedERC20Amount: BigNumber[] = [];

		for (let i: number = 0; i < UTILIZED_ERC20S.length; i++)
		{
			const ETH_VALUE_FEED = await ethers.getContractAt(
				"IV1EMPETHValueFeed",
				await this._registry.eRC20_v1EMPERC20ETHValueFeed(UTILIZED_ERC20S[i])
			);

			const UTILIZATION = await this._eMPUtility.v1EMP_utilizedERC20_utilizationERC20(
				this._eMP.address,
				UTILIZED_ERC20S[i]
			);

			let tokenAmount: BigNumber = ethers.utils.parseUnits("0", 18);

			if (UTILIZATION.deposit)
			{
				let ETHValuePortion = ETHValue.mul(UTILIZATION.allocation).div(ethers.utils.parseUnits("1", 18));

				const erc20Decimals = BigNumber.from(10).pow(await ETH_VALUE_FEED.eRC20Decimals());

				const utilizedERC20ETHValue = await ETH_VALUE_FEED.utilizedERC20ETHValue();

				tokenAmount = ETHValuePortion.mul(erc20Decimals).div(utilizedERC20ETHValue);
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
		const UTILIZED_ERC20S = await this._eMPUtility.v1EMP_utilizedERC20(this._eMP.address);

		let totalEthValue: BigNumber = ethers.utils.parseUnits("0", 18);

		let utilizedERC20DepositEthValue: BigNumber[] = [];

		// Calculate how much of each utilized tokens are being used
		for (let i: number = 0; i < UTILIZED_ERC20S.length; i++)
		{
			const ETH_VALUE_FEED = await ethers.getContractAt(
				"ETHValueFeedDummy",
				await this._registry.eRC20_v1EMPERC20ETHValueFeed(UTILIZED_ERC20S[i])
			);

			// Value of the each token denominated in ETH
			const ETH_VALUE_PER_TOKEN: BigNumber = await ETH_VALUE_FEED.utilizedERC20ETHValue();

			// 10 ** eRC20Decimals
			const ERC20_DECIMALS: BigNumber = BigNumber.from(10).pow(await ETH_VALUE_FEED.eRC20Decimals());

			const TOTAL_ETH_VALUE = _utilizedERC20Deposits[i].mul(ETH_VALUE_PER_TOKEN).div(ERC20_DECIMALS);

			totalEthValue = totalEthValue.add(TOTAL_ETH_VALUE);

			utilizedERC20DepositEthValue.push(TOTAL_ETH_VALUE);
		}

		return {
			totalEthValue,
			utilizedERC20DepositEthValue
		};
	}
}
