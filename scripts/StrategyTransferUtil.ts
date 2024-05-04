const { ethers } = require("hardhat");

import { BigNumber, Contract } from "ethers";

import { D_18 } from "../const"


export default class StrategyTransferUtil
{
	private _eTHValueFeed: Contract;
	private _yieldSyncV1EMPStrategy: Contract;


	constructor (_yieldSyncV1EMPStrategy: Contract, _eTHValueFeed: Contract)
	{
		this._yieldSyncV1EMPStrategy = _yieldSyncV1EMPStrategy;
		this._eTHValueFeed = _eTHValueFeed;
	}


	/**
	 * Calculate ERC20 required by a total ETH Amount
	 * @param _totalAmount {BigNumber}
	 * @returns Object containing utilized ERC 20 amounts
	 */
	public async calculateERC20RequiredByTotalAmount(_totalAmount: BigNumber): Promise<BigNumber[]>
	{
		const ONE_HUNDRED_PERCENT = await this._yieldSyncV1EMPStrategy.ONE_HUNDRED_PERCENT();

		let utilizedERC20Amount: BigNumber[] = [];

		const utilizedERC20 = await this._yieldSyncV1EMPStrategy.utilizedERC20()

		for (let i: number = 0; i < utilizedERC20.length; i++)
		{
			const ALLOCATION = utilizedERC20[i].allocation.mul(D_18).div(ONE_HUNDRED_PERCENT);

			const TOKEN_AMOUNT = _totalAmount.mul(ALLOCATION).div(D_18);

			utilizedERC20Amount.push(TOKEN_AMOUNT);
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
	): Promise<{totalValue: BigNumber, utilizedERC20Amount: BigNumber[]}>
	{
		let utilizedERC20Amount: BigNumber[] = [];

		let totalValue: BigNumber = ethers.utils.parseUnits("0", 18);

		// Calculate how much of each utilized tokens are being used
		for (let i: number = 0; i < _utilizedERC20.length; i++)
		{
			// Get balance of each token
			const BALANCE: BigNumber = await _utilizedERC20[i].balanceOf(_address);

			// Get value of each token in ETH
			const ETH_VALUE: BigNumber = await this._eTHValueFeed.utilizedERC20ETHValue(_utilizedERC20[i].address);

			// total value = balance * eth value
			totalValue = totalValue.add(BALANCE.mul(ETH_VALUE).div(D_18));
		}

		return {
			totalValue,
			utilizedERC20Amount
		};
	}

	/**
	 * This function calculates the ETH value of each token as well as the total value of everything held by deposits param
	 * @param _utilizedERC20Deposits {BigNumber[]} ERC20 deposits
	 * @param _utilizedERC20 {Contract[]} ERC20 contracts
	 * @returns Object containing the ETH value of each ERC20 token and Total ETH value of all ERC20 tokens
	 */
	public async calculateValueOfERC20Deposits(
		_utilizedERC20Deposits: BigNumber[],
		_utilizedERC20: Contract[],
	): Promise<{totalValue: BigNumber, utilizedERC20Amount: BigNumber[]}>
	{
		let utilizedERC20Amount: BigNumber[] = [];

		let totalValue: BigNumber = ethers.utils.parseUnits("0", 18);

		// Calculate how much of each utilized tokens are being used
		for (let i: number = 0; i < _utilizedERC20.length; i++)
		{
			const ETH_VALUE: BigNumber = await this._eTHValueFeed.utilizedERC20ETHValue(_utilizedERC20[i].address);

			totalValue = totalValue.add(_utilizedERC20Deposits[i].mul(ETH_VALUE).div(D_18));

			utilizedERC20Amount.push(_utilizedERC20Deposits[i].mul(ETH_VALUE).div(D_18));
		}

		return {
			totalValue,
			utilizedERC20Amount
		};
	}
}
