// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";


contract PriceConsumerV3 {
    AggregatorV3Interface internal priceFeed;


    constructor(address feed)
	{
        // Replace the address below with the correct address for your desired ERC20/ETH or ERC20/USD feed
        priceFeed = AggregatorV3Interface(feed);
    }

    function getLatestPrice()
		public
		view
		returns (int)
	{
        (
            /*uint80 roundID*/,
            int price,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();
        return price;
    }
}
