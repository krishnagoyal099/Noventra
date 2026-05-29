// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ═══════════════════════════════════════════════════════════════════
 *  ALO — MockDEX
 * ═══════════════════════════════════════════════════════════════════
 *  Simulated DEX for demo purposes. In production, this would be
 *  replaced by actual DEX integrations (Uniswap, Curve, etc.)
 * ═══════════════════════════════════════════════════════════════════
 */
contract MockDEX {

    uint256 public swapFeeBps = 30; // 0.3% fee
    address public owner;

    // Track simulated token balances
    mapping(address => mapping(address => uint256)) public balances;
    // Token pair reserves (for price simulation)
    mapping(address => mapping(address => uint256)) public reserves;

    event SwapExecuted(
        address indexed trader,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee,
        uint256 timestamp
    );

    event LiquidityProvided(
        address indexed provider,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    constructor() {
        owner = msg.sender;
    }

    function swap(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn
    ) external returns (uint256 amountOut) {
        require(_amountIn > 0, "MockDEX: zero amount");

        // Calculate output with fee
        uint256 fee = (_amountIn * swapFeeBps) / 10000;
        uint256 amountAfterFee = _amountIn - fee;
        amountOut = amountAfterFee; // 1:1 minus fee for simplicity

        // Update balances
        balances[msg.sender][_tokenIn] -= _amountIn;
        balances[msg.sender][_tokenOut] += amountOut;

        // Update reserves
        reserves[_tokenIn][_tokenOut] += _amountIn;
        reserves[_tokenOut][_tokenIn] -= amountOut;

        emit SwapExecuted(msg.sender, _tokenIn, _tokenOut, _amountIn, amountOut, fee, block.timestamp);
    }

    function depositTokens(
        address _token,
        uint256 _amount
    ) external {
        balances[msg.sender][_token] += _amount;
        reserves[_token][_token] += _amount;

        emit LiquidityProvided(msg.sender, _token, _amount, block.timestamp);
    }

    function setSwapFee(uint256 _bps) external {
        require(_bps <= 1000, "MockDEX: fee too high");
        swapFeeBps = _bps;
    }

    function getBalance(address _user, address _token) external view returns (uint256) {
        return balances[_user][_token];
    }

    function getQuote(
        address, /* _tokenIn  — unused in mock, kept for interface parity */
        address, /* _tokenOut — unused in mock, kept for interface parity */
        uint256 _amountIn
    ) external view returns (uint256) {
        uint256 fee = (_amountIn * swapFeeBps) / 10000;
        return _amountIn - fee;
    }
}