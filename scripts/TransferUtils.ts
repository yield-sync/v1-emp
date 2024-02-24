const { ethers } = require("hardhat");

import { BigNumber, Contract } from "ethers";

import { D_18 } from "../common"


/**
 * This function calculates the ETH value of each token as well as the total value of everything held by balance
 * @param _address {String} The address of interest
 * @param _utilizedERC20 {Contract[]} ERC20 contracts
 * @param _ETHValueFeed {Contract} Contract that will return value of ERC20 denominated in ETH
 * @returns {[BigNumber, BigNumber[]]} Tuple containing the ETH value of each ERC20 token and Total ETH value of all ERC20 tokens
 */
export async function calculateValueOfBalanceERC20(
	_address: String,
	_ETHValueFeed: Contract,
	_utilizedERC20: Contract[],
): Promise<[BigNumber, BigNumber[]]>
{
	let utilizedERC20Amount: BigNumber[] = [];

	let totalValue = ethers.utils.parseUnits("0", 18);

	// Calculate how much of each utilized tokens are being used
	for (let i = 0; i < _utilizedERC20.length; i++)
	{
		// Get balance of each token
		let balance: BigNumber = await _utilizedERC20[i].balanceOf(_address);

		let ETHValue: BigNumber = await _ETHValueFeed.utilizedERC20ETHValue(_utilizedERC20[i].address);

		totalValue = totalValue.add(balance.mul(ETHValue).div(D_18));
	}

	return [totalValue, utilizedERC20Amount];
}

/**
 * This function calculates the ETH value of each token as well as the total value of everything held by deposits param
 * @param _ETHValueFeed {Contract} Contract that will return value of ERC20 denominated in ETH
 * @param _address {String} The address of interest
 * @param _utilizedERC20Deposits {BigNumber[]} ERC20 deposits
 * @param _utilizedERC20 {Contract[]} ERC20 contracts
 * @returns {[BigNumber, BigNumber[]]} Tuple containing the ETH value of each ERC20 token and Total ETH value of all ERC20 tokens
 */
export async function calculateValueOfERC20(
	_ETHValueFeed: Contract,
	_address: String,
	_utilizedERC20Deposits: BigNumber[],
	_utilizedERC20: Contract[],
)
{
	let utilizedERC20Amount: number[] = [];

	let totalValue = ethers.utils.parseUnits("0", 18);

	// Calculate how much of each utilized tokens are being used
	for (let i = 0; i < _utilizedERC20.length; i++)
	{
		let ETHValue = await _ETHValueFeed.utilizedERC20ETHValue(_utilizedERC20[i].address);

		totalValue = totalValue.add(_utilizedERC20Deposits[i].mul(ETHValue).div(D_18));
	}

	console.log([totalValue, utilizedERC20Amount])

	return [totalValue, utilizedERC20Amount];
}
