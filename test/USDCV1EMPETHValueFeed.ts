import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("USDCV1EMPETHValueFeed", function () {
	const ETH_USD_PRICE = ethers.utils.parseUnits("1800", 8); // 1800 USD/ETH with 8 decimals
	const USDC_USD_PRICE = ethers.utils.parseUnits("1", 8); // 1 USD/USDC with 8 decimals

	let ethUsdPriceFeed: Contract;
	let usdcUsdPriceFeed: Contract;
	let valueFeed: Contract;
	let deployer: Signer;


	beforeEach(async () => {
		// Get signers
		[deployer] = await ethers.getSigners();

		// Deploy mock price feed contracts
		const MockAggregator = await ethers.getContractFactory("MockV3Aggregator");

		ethUsdPriceFeed = await MockAggregator.deploy(8, ETH_USD_PRICE); // 8 decimals

		await ethUsdPriceFeed.deployed();

		usdcUsdPriceFeed = await MockAggregator.deploy(8, USDC_USD_PRICE); // 8 decimals

		await usdcUsdPriceFeed.deployed();

		// Deploy the value feed contract
		const ValueFeed = await ethers.getContractFactory("USDCV1EMPETHValueFeed");

		valueFeed = await ValueFeed.deploy(ethUsdPriceFeed.address, usdcUsdPriceFeed.address);

		await valueFeed.deployed();
	});

	it("should return the correct ETH price in USDC", async () => {
		const usdcInEth = await valueFeed.utilizedERC20ETHValue();
		const expectedUsdcInEth = USDC_USD_PRICE.mul(ethers.utils.parseUnits("1", 18)).div(ETH_USD_PRICE);

		expect(usdcInEth).to.equal(expectedUsdcInEth);
	});

	it("should return the correct decimals for the USDC price feed", async () => {
		const decimals = await valueFeed.eRC20Decimals();
		expect(decimals).to.equal(8); // USDC price feed has 8 decimals
	});

	it("should revert if ETH/USD price is zero", async () => {
		await ethUsdPriceFeed.updateAnswer(0); // Set ETH/USD price to zero
		await expect(valueFeed.utilizedERC20ETHValue()).to.be.revertedWith("Invalid price");
	});

	it("should revert if USDC/USD price is zero", async () => {
		await usdcUsdPriceFeed.updateAnswer(0); // Set USDC/USD price to zero
		await expect(valueFeed.utilizedERC20ETHValue()).to.be.revertedWith("Invalid price");
	});
});
