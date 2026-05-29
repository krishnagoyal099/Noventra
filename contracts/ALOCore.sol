// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AgentRegistry.sol";
import "./MessageBus.sol";

contract ALOCore {
    struct StrategyParams {
        address poolId;
        uint256 allocation;
    }

    struct Receipt {
        address agent;
        string action;
        uint256 timestamp;
        bytes result;
    }

    StrategyParams public currentStrategy;
    uint256 public totalLiquidity;
    bool public strategyApproved;
    
    AgentRegistry public registry;
    MessageBus public messageBus;
    
    Receipt[] public receipts;

    event StrategyProposed(address poolId, uint256 allocation);
    event StrategyApproved(bool approved);
    event TradeExecuted(address dex, uint256 amount);
    event ReceiptRecorded(address agent, string action);

    constructor(address _registry, address _messageBus) {
        registry = AgentRegistry(_registry);
        messageBus = MessageBus(_messageBus);
        totalLiquidity = 1000000 * 1e18; // 1M initial liquidity
    }

    modifier onlyRole(string memory role) {
        require(registry.isRole(msg.sender, role), "Unauthorized agent role");
        _;
    }

    function proposeStrategy(StrategyParams calldata params) external onlyRole("STRATEGY") {
        currentStrategy = params;
        strategyApproved = false;
        emit StrategyProposed(params.poolId, params.allocation);
    }

    function approveStrategy(bool approved) external onlyRole("RISK") {
        strategyApproved = approved;
        emit StrategyApproved(approved);
    }

    function executeTrade(address dex, uint256 amount) external onlyRole("EXECUTION") {
        require(strategyApproved, "Strategy not approved");
        emit TradeExecuted(dex, amount);
        strategyApproved = false; // Reset state
    }

    // Note: Made external (restricted to EXECUTION) so the ExecutionAgent can log the receipt directly
    function recordReceipt(Receipt calldata receipt) external onlyRole("EXECUTION") {
        receipts.push(receipt);
        emit ReceiptRecorded(receipt.agent, receipt.action);
    }
    
    function getReceiptCount() external view returns (uint256) {
        return receipts.length;
    }
}