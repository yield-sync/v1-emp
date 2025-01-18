const { ethers } = require("hardhat");

import { BigNumber, Contract } from "ethers";

import { D_18 } from "../const"



export default class UtilEMPTransfer
{
	private _registry: Contract;
	private _eMP: Contract;
	private _eMPUtility: Contract;


	constructor (_eMP: Contract, _registry: Contract, _eMPUtility: Contract)
	{
		this._eMP = _eMP;
		this._registry = _registry;
		this._eMPUtility = _eMPUtility;
	}


	/**
	* Determin if the utilized ERC20 on EMP needs to be resynced with the utilized ERC20 on the EMP's utilized strategies
	* @returns {boolean} If the strategies utilized needs to be updated
	*/
	public async utilizedERC20UpdateRequiredStatus(): Promise<Boolean>
	{
		const strategies = await this._eMP.utilizedV1EMPStrategy()

		// Check that the utilized erc20 for the strategies has not changed
		for (let i = 0; i < strategies.length; i++)
		{
			const CONTRACT_STRATEGY = await ethers.getContractAt("V1EMPStrategy", strategies[i]);

			const strategyUtilizedERC20UpdateTracker = await CONTRACT_STRATEGY.utilizedERC20UpdateTracker();

			const EMPUtilityERC20UpdateTracker = await this._eMPUtility.v1EMP_v1EMPStrategy_utilizedERC20UpdateTracker(
				this._eMP.address,
				strategies[i]
			);

			if (strategyUtilizedERC20UpdateTracker.eq(EMPUtilityERC20UpdateTracker) == false)
			{
				return true;
			}
		}

		return false;
	}

	/**
	 * Calculate ERC20 required by a total ETH Amount
	 * @param ETHValue {BigNumber} Deposit ETH value
	 * @returns Object containing utilized ERC 20 amounts
	 */
	public async calculatedUtilizedERC20Amount(ETHValue: BigNumber): Promise<BigNumber[]>
	{
		if (await this.utilizedERC20UpdateRequiredStatus())
		{
			throw new Error("EMP needs to synchronize new strategy utilized ERC20");
		}

		const UTILIZED_ERC20S = await this._eMPUtility.v1EMP_utilizedERC20(this._eMP.address);

		let utilizedERC20Amount: BigNumber[] = [];

		for (let i: number = 0; i < UTILIZED_ERC20S.length; i++)
		{
			const ETH_VALUE_PROVIDER = await ethers.getContractAt(
				"@yield-sync/erc20-eth-value-provider/contracts/interface/IERC20ETHValueProvider.sol:IERC20ETHValueProvider",
				await this._registry.eRC20_eRC20ETHValueProvider(UTILIZED_ERC20S[i])
			);

			const UTILIZATION = await this._eMPUtility.v1EMP_utilizedERC20_utilizationERC20(
				this._eMP.address,
				UTILIZED_ERC20S[i]
			);

			let tokenAmount: BigNumber = ethers.utils.parseUnits("0", 18);

			if (UTILIZATION.deposit)
			{
				let ETHValuePortion = ETHValue.mul(UTILIZATION.allocation).div(ethers.utils.parseUnits("1", 18));

				const erc20Decimals = BigNumber.from(10).pow(await ETH_VALUE_PROVIDER.eRC20Decimals());

				const utilizedERC20ETHValue = await ETH_VALUE_PROVIDER.utilizedERC20ETHValue();

				tokenAmount = ETHValuePortion.mul(erc20Decimals).div(utilizedERC20ETHValue);
			}

			utilizedERC20Amount.push(tokenAmount);
		}

		return utilizedERC20Amount;
	}

	/**
	 * @notice In the case that utilizedERC20 on the EMP needs to be updated this function computes the UtilizedERC20Deposit
	 * without referring the the EMP utilizedERC20 function.
	 *
	 * This is neccessary because there is always a possibility that the utilizedERC20 is not updated.
	 */
	public async calculatedUtilizedERC20AmountExpected(depositAmountEthValue: BigNumber): Promise<{
		updatedUtilizedERC20: string[],
		calculatedERC20Required: BigNumber[]
	}>
	{
		const UTILIZED_ERC20: { [key: string]: BigNumber; } = {};

		const STRATEGIES: string[] = await this._eMP.utilizedV1EMPStrategy();

		let updatedUtilizedERC20: string[] = [];

		for (let i = 0; i < STRATEGIES.length; i++)
		{
			const STRATEGY = await ethers.getContractAt("V1EMPStrategy", STRATEGIES[i]);

			const STRATEGY_UTILIZED_ERC20 = await STRATEGY.utilizedERC20();

			for (let ii = 0; ii < STRATEGY_UTILIZED_ERC20.length; ii++)
			{
				const ERC20 = STRATEGY_UTILIZED_ERC20[ii];

				const STRATEGY_ERC20_ALLOC: BigNumber = (await STRATEGY.utilizedERC20_utilizationERC20(ERC20)).allocation;

				const EMP_STRATEGY_ALLOC: BigNumber = await this._eMP.utilizedV1EMPStrategy_allocation(STRATEGIES[i]);

				// Calculate EMP's ERC20 allocation
				const EMP_ERC20_ALLOC: BigNumber = STRATEGY_ERC20_ALLOC.mul(EMP_STRATEGY_ALLOC).div(D_18);

				if (!UTILIZED_ERC20[ERC20])
				{
					// Set to 0
					UTILIZED_ERC20[ERC20] = EMP_ERC20_ALLOC;

					updatedUtilizedERC20.push(ERC20);

					continue;
				}

				UTILIZED_ERC20[ERC20] = UTILIZED_ERC20[ERC20].add(EMP_ERC20_ALLOC);
			}
		}

		const ARRAY_UTILITY = await ethers.getContractAt("ArrayUtility", await this._registry.arrayUtility());

		// Reorder the ERC20
		updatedUtilizedERC20 = await ARRAY_UTILITY.sort(updatedUtilizedERC20);

		let calculatedERC20Required: BigNumber[] = [];

		for (const ERC20 of updatedUtilizedERC20)
		{
			const ALLOCATION = UTILIZED_ERC20[ERC20];

			const UTILIZATION = await this._eMPUtility.v1EMP_utilizedERC20_utilizationERC20(this._eMP.address, ERC20);

			const ETH_VALUE_PROVIDER = await ethers.getContractAt(
				"@yield-sync/erc20-eth-value-provider/contracts/interface/IERC20ETHValueProvider.sol:IERC20ETHValueProvider",
				await this._registry.eRC20_eRC20ETHValueProvider(ERC20)
			);

			let tokenAmount: BigNumber = ethers.utils.parseUnits("0", 18);

			if (UTILIZATION.deposit)
			{
				let ETHValuePortion = depositAmountEthValue.mul(ALLOCATION).div(ethers.utils.parseUnits("1", 18));

				const erc20Decimals = BigNumber.from(10).pow(await ETH_VALUE_PROVIDER.eRC20Decimals());

				const utilizedERC20ETHValue = await ETH_VALUE_PROVIDER.utilizedERC20ETHValue();

				tokenAmount = ETHValuePortion.mul(erc20Decimals).div(utilizedERC20ETHValue);
			}

			calculatedERC20Required.push(tokenAmount);
		}

		return { updatedUtilizedERC20, calculatedERC20Required };
	}

	/**
	 * This function calculates the ETH value of each token as well as the total value of everything held by deposits param
	 * @param _utilizedERC20Deposits {BigNumber[]} ERC20 deposits
	 * @returns Object containing the ETH value of each ERC20 token and Total ETH value of all ERC20 tokens
	 */
	public async valueOfERC20Deposits(_utilizedERC20Deposits: BigNumber[]): Promise<{
		totalEthValue: BigNumber,
		utilizedERC20DepositEthValue: BigNumber[]
	}>
	{
		const UTILIZED_ERC20S = await this._eMPUtility.v1EMP_utilizedERC20(this._eMP.address);

		let totalEthValue: BigNumber = ethers.utils.parseUnits("0", 18);

		let utilizedERC20DepositEthValue: BigNumber[] = [];

		// Calculate how much of each utilized tokens are being used
		for (let i: number = 0; i < UTILIZED_ERC20S.length; i++)
		{
			const ETH_VALUE_PROVIDER = await ethers.getContractAt(
				"MockERC20ETHValueProvider",
				await this._registry.eRC20_eRC20ETHValueProvider(UTILIZED_ERC20S[i])
			);

			// Value of the each token denominated in ETH
			const ETH_VALUE_PER_TOKEN: BigNumber = await ETH_VALUE_PROVIDER.utilizedERC20ETHValue();

			// 10 ** eRC20Decimals
			const ERC20_DECIMALS: BigNumber = BigNumber.from(10).pow(await ETH_VALUE_PROVIDER.eRC20Decimals());

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
