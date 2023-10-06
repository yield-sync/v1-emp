// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


interface IERC20
{
    function approve(address spender, uint256 amount) external returns (bool);
}


interface IUniswapV2Router02
{
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

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB);
}


contract UniswapLiquidityManager
{
    address private owner;
    IUniswapV2Router02 public uniswapRouter;

    constructor (address _uniswapRouter)
	{
        owner = msg.sender;
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
    }

    modifier onlyOwner()
	{
        require(msg.sender == owner, "Not the contract owner");

        _;
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin
    )
		external
		onlyOwner
	{
        // Approve the Uniswap Router to move tokens
        IERC20(tokenA).approve(address(uniswapRouter), amountADesired);
        IERC20(tokenB).approve(address(uniswapRouter), amountBDesired);

        // Add liquidity - Deadline 20 minutes from now
        uniswapRouter.addLiquidity(
            tokenA,
            tokenB,
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin,
            address(this),
            block.timestamp + 1200
        );
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin
    )
		external
		onlyOwner
	{
        // Approve the Uniswap Router to burn LP tokens
        IERC20(pairFor(tokenA, tokenB)).approve(address(uniswapRouter), liquidity);

        // Remove liquidity - Deadline 20 minutes from now
        uniswapRouter.removeLiquidity(
            tokenA,
            tokenB,
            liquidity,
            amountAMin,
            amountBMin,
            address(this),
            block.timestamp + 1200
        );
    }

    function pairFor(address tokenA, address tokenB)
		public
		pure
		returns (address pair)
	{
        // This function can return the pair address using the Uniswap V2 formula
        // Or you can use the factory contract to get this address
        // Implement this based on your needs
    }
}
