// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


import { IERC20, ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { Allocation, IYieldSyncV1Strategy } from "../interface/IYieldSyncV1Strategy.sol";


using SafeERC20 for IERC20;


interface IUniswapV2Router {
	function addLiquidity(
		address tokenA,
		address tokenB,
		uint amountADesired,
		uint amountBDesired,
		uint amountAMin,
		uint amountBMin,
		address to,
		uint deadline
	) external returns (uint amountA, uint amountB, uint liquidity);
}


/**
* @notice This strategy adds liquidity to a uniswap pool
*/
contract StrategyUniswapV2LiquidityPool is
	IYieldSyncV1Strategy,
	ERC20
{
	address[] internal _utilizedToken;
    IUniswapV2Router public uniswapRouter;


	mapping (address token => bool utilized) internal _token_utilized;

	mapping (address token => Allocation allocation) internal _token_allocation;


	constructor (string memory name, string memory symbol, address _tokenA, address _tokenB, address _uniswapRouter)
		ERC20(name, symbol)
	{
		_utilizedToken.push(_tokenA);
		_utilizedToken.push(_tokenB);

		uniswapRouter = IUniswapV2Router(_uniswapRouter);
	}

	/// @inheritdoc IYieldSyncV1Strategy
	function token_allocation(address token)
		external
		view
		override
		returns (Allocation memory)
	{
		return _token_allocation[token];
	}

	/// @inheritdoc IYieldSyncV1Strategy
	function positionValueInWETH(address target)
		public
		view
		override
		returns (uint256 positionValueInEth_)
	{
		// This is a placeholder until i have a proper way to calculate the position value
		return balanceOf(target);
	}

	/// @inheritdoc IYieldSyncV1Strategy
	function token_utilized(address _token)
		public
		view
		override
		returns (bool utilized_)
	{
		return _token_utilized[_token];
	}

	/// @inheritdoc IYieldSyncV1Strategy
	function utilizedToken()
		public
		view
		override
		returns (address[] memory)
	{
		return _utilizedToken;
	}

	/// @inheritdoc IYieldSyncV1Strategy
	function utilizedTokenValueInWETH(address _token)
		public
		view
		override
		returns (uint256 tokenValueInEth_)
	{
		// This is a placeholder until i have a proper way to calculate the position value
		return 1;
	}

	/// @inheritdoc IYieldSyncV1Strategy
	function utilizedTokensDeposit(uint256[] memory _amounts)
		public
		override
	{
		IERC20(_utilizedToken[0]).safeTransferFrom(msg.sender, address(this), _amounts[0]);
        IERC20(_utilizedToken[1]).safeTransferFrom(msg.sender, address(this), _amounts[1]);

        IERC20(_utilizedToken[0]).safeApprove(address(uniswapRouter), _amounts[0]);
        IERC20(_utilizedToken[1]).safeApprove(address(uniswapRouter), _amounts[1]);

        uniswapRouter.addLiquidity(
            _utilizedToken[0],
            _utilizedToken[1],
            _amounts[0],
            _amounts[1],
            0, // amountAMin (set to 0 for simplicity, consider using a slippage mechanism in production)
            0, // amountBMin (set to 0 for simplicity)
            address(this),
            block.timestamp
        );

        // Handle the minting of strategy-specific tokens or other logic...
	}

	/// @inheritdoc IYieldSyncV1Strategy
	function utilizedTokensWithdraw(uint256[] memory _amounts)
		public
		override
	{}
}
