// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

import { IV1EMPETHValueFeed } from "../interface/IV1EMPETHValueFeed.sol";


contract USDCV1EMPETHValueFeed is
	IV1EMPETHValueFeed
{
	AggregatorV3Interface internal _usdcUsdPriceFeed;
	AggregatorV3Interface internal _ethUsdPriceFeed;


	constructor (address __usdcUsdPriceFeed, address __ethUsdPriceFeed)
	{
		_usdcUsdPriceFeed = AggregatorV3Interface(__usdcUsdPriceFeed);
		_ethUsdPriceFeed = AggregatorV3Interface(__ethUsdPriceFeed);
	}


	/// @inheritdoc IV1EMPETHValueFeed
	function utilizedERC20ETHValue()
		public
		view
		override
		returns (uint256)
	{
		// Get the latest USDC/USD price
		(, int256 usdcUsdPrice, , , ) = _usdcUsdPriceFeed.latestRoundData();

		// Get the latest ETH/USD price
		(, int256 ethUsdPrice, , , ) = _ethUsdPriceFeed.latestRoundData();

		uint8 usdcDecimals = _usdcUsdPriceFeed.decimals();
		uint8 ethDecimals = _ethUsdPriceFeed.decimals();

		// Ensure prices are positive
		require(usdcUsdPrice > 0 && ethUsdPrice > 0, "Invalid price");

		// Normalize to 18 decimals
		uint256 normalizedUsdcUsdPrice = uint256(usdcUsdPrice) * 10 ** (18 - usdcDecimals);
		uint256 normalizedEthUsdPrice = uint256(ethUsdPrice) * 10 ** (18 - ethDecimals);

		// Calculate USDC price in ETH
		return (normalizedUsdcUsdPrice * 1e18) / normalizedEthUsdPrice;
	}

	/// @inheritdoc IV1EMPETHValueFeed
	function eRC20Decimals()
		public
		view
		override
		returns (uint8)
	{
		return _usdcUsdPriceFeed.decimals();
	}
}
