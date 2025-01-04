// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/**
 * @notice WARNING: This contract is ONLY for TESTING.
* @notice This is supposed to mock a Chainlink price oracle.
*/
contract MockV3Aggregator
{
    uint8 public decimals;
    int256 private _answer;

    constructor(uint8 _decimals, int256 initialAnswer) {
        decimals = _decimals;
        _answer = initialAnswer;
    }

    function latestRoundData() external view returns (
        uint80, int256 answer, uint256, uint256, uint80
    ) {
        return (0, _answer, 0, 0, 0);
    }

    function updateAnswer(int256 newAnswer) external {
        _answer = newAnswer;
    }
}
