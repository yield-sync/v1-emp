const { ethers } = require("hardhat");

import { BigNumber, Contract } from "ethers";

import { D_18 } from "../const"


export default class StrategyTransferUtil
{
	private _registry: Contract;
	private _v1EMPStrategy: Contract;


	constructor (_v1EMPStrategy: Contract, _registry: Contract)
	{
		this._v1EMPStrategy = _v1EMPStrategy;
		this._registry = _registry;
	}


	/**
	 * Calculate ERC20 required by a total ETH Amount
	 * @param ETHValue {BigNumber} Deposit ETH value
	 * @returns Object containing utilized ERC 20 amounts
	 */
	public async calculateERC20Required(ETHValue: BigNumber): Promise<BigNumber[]>
	{
		const ONE_HUNDRED_PERCENT = await this._registry.ONE_HUNDRED_PERCENT();

		const UTILIZED_ERC20S = await this._v1EMPStrategy.utilizedERC20();

		let utilizedERC20Amount: BigNumber[] = [];

		for (let i: number = 0; i < UTILIZED_ERC20S.length; i++)
		{
			let tokenAmount: BigNumber = ethers.utils.parseUnits("0", 18);

			const UTILIZATION = await this._v1EMPStrategy.utilizedERC20_utilizationERC20(UTILIZED_ERC20S[i]);

			if (UTILIZATION.deposit)
			{
				const ALLOCATION: BigNumber = UTILIZATION.allocation.mul(D_18).div(ONE_HUNDRED_PERCENT);

				tokenAmount = ETHValue.mul(ALLOCATION).div(D_18);
			}

			utilizedERC20Amount.push(tokenAmount);
		}

		return utilizedERC20Amount;
	}

	/**
	 * This function calculates the ETH value of each token as well as the total value of everything held by balance
	 * @param _address {String} The address of interest
	 * @param _utilizedERC20 {Contract[]} ERC20 contracts
	 * @returns Object containing the ETH value of each ERC20 token and Total ETH value of all ERC20 tokens
	 */
	public async calculateValueOfERC20BalanceOf(
		_address: String,
		_utilizedERC20: Contract[]
	): Promise<{totalEthValue: BigNumber, utilizedERC20DepositEthValue: BigNumber[]}>
	{
		let totalEthValue: BigNumber = ethers.utils.parseUnits("0", 18);

		let utilizedERC20DepositEthValue: BigNumber[] = [];

		// Calculate how much of each utilized tokens are being used
		for (let i: number = 0; i < _utilizedERC20.length; i++)
		{
			// Get balance of each token
			const BALANCE: BigNumber = await _utilizedERC20[i].balanceOf(_address);

			const feed = await ethers.getContractAt(
				"ETHValueFeedDummy",
				await this._registry.eRC20_v1EMPERC20ETHValueFeed(_utilizedERC20[i])
			);

			// Get value of each token in ETH
			const ETH_VALUE: BigNumber = await feed.utilizedERC20ETHValue();

			// total value = balance * eth value
			totalEthValue = totalEthValue.add(BALANCE.mul(ETH_VALUE).div(D_18));

			utilizedERC20DepositEthValue.push(_utilizedERC20[i].mul(ETH_VALUE).div(D_18));
		}

		return {
			totalEthValue,
			utilizedERC20DepositEthValue
		};
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
		const UTILIZED_ERC20S = await this._v1EMPStrategy.utilizedERC20();

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
