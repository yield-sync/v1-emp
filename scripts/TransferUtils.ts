const { ethers } = require("hardhat");

import { BigNumber, Contract } from "ethers";

import { D_18 } from "../common"


export default class TransferUtil
{
	_eTHValueFeed: Contract;
	_strategy: Contract;


	constructor (_strategy: Contract, _eTHValueFeed: Contract)
	{
		this._strategy = _strategy;
		this._eTHValueFeed = _eTHValueFeed;
	}


	/**
	 * Calculate ERC20 required by a total ETH Amount
	 * @param _utilizedERC20 {Contract[]}
	 * @param _totalAmount {BigNumber}
	 * @returns Object containing utilized ERC 20 amounts
	 */
	async calculateERC20RequiredByTotalAmount(
		_utilizedERC20: Contract[],
		_totalAmount: BigNumber
	): Promise<BigNumber[]>
	{
		const ONE_HUNDRED_PERCENT = await this._strategy.ONE_HUNDRED_PERCENT();

		let utilizedERC20Amount: BigNumber[] = [];

		for (let i = 0; i < _utilizedERC20.length; i++)
		{
			const PURPOSE = await this._strategy.utilizedERC20_purpose(_utilizedERC20[i].address);

			const ALLOCATION = PURPOSE.allocation.mul(D_18).div(ONE_HUNDRED_PERCENT);

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
	async calculateValueOfERC20BalanceOf(
		_address: String,
		_utilizedERC20: Contract[]
	): Promise<{totalValue: BigNumber, utilizedERC20Amount: BigNumber[]}>
	{
		let utilizedERC20Amount: BigNumber[] = [];

		let totalValue = ethers.utils.parseUnits("0", 18);

		// Calculate how much of each utilized tokens are being used
		for (let i = 0; i < _utilizedERC20.length; i++)
		{
			// Get balance of each token
			let balance: BigNumber = await _utilizedERC20[i].balanceOf(_address);

			let ETHValue: BigNumber = await this._eTHValueFeed.utilizedERC20ETHValue(_utilizedERC20[i].address);

			totalValue = totalValue.add(balance.mul(ETHValue).div(D_18));
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
	async calculateValueOfERC20Deposits(
		_utilizedERC20Deposits: BigNumber[],
		_utilizedERC20: Contract[],
	): Promise<{totalValue: BigNumber, utilizedERC20Amount: BigNumber[]}>
	{
		let utilizedERC20Amount: BigNumber[] = [];

		let totalValue = ethers.utils.parseUnits("0", 18);

		// Calculate how much of each utilized tokens are being used
		for (let i = 0; i < _utilizedERC20.length; i++)
		{
			let ETHValue = await this._eTHValueFeed.utilizedERC20ETHValue(_utilizedERC20[i].address);

			totalValue = totalValue.add(_utilizedERC20Deposits[i].mul(ETHValue).div(D_18));

			utilizedERC20Amount.push(_utilizedERC20Deposits[i].mul(ETHValue).div(D_18));
		}

		return {
			totalValue,
			utilizedERC20Amount
		};
	}
}
