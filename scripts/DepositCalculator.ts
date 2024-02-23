const { ethers } = require("hardhat");

import { Contract } from "ethers";


export async function calculateValueOfAllERC20(
	_utilizedERC20: Contract[],
	_ETHValueFeed: Contract
): Promise<number[]>
{
	let utilizedERC20Amount: number[] = [];

	let totalValue = ethers.utils.parseUnits("0", 18);

	// Calculate how much of each utilized tokens are being used
	for (let i = 0; i < _utilizedERC20.length; i++)
	{
		await _ETHValueFeed.utilizedERC20ETHValue(_utilizedERC20[i].address);
		totalValue = totalValue.add();
	}

	return utilizedERC20Amount;
}
