// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ═══════════════════════════════════════════════════════════════════
 *  ALO — MockYieldSource
 * ═══════════════════════════════════════════════════════════════════
 *  Simulated yield-bearing pool for demo. Emits events when APY
 *  changes, which Scout Agents detect as opportunities.
 *
 *  In production: Aave, Compound, Yearn, etc.
 * ═══════════════════════════════════════════════════════════════════
 */
contract MockYieldSource {

    uint256 public currentAPY = 50; // In basis points (50 = 0.5%)
    uint256 public totalDeposits;
    address public owner;
    string public poolName;

    mapping(address => uint256) public deposits;
    mapping(address => uint256) public depositTimestamps;

    event APYChanged(
        uint256 oldAPY,
        uint256 newAPY,
        uint256 timestamp,
        string reason
    );
    event Deposited(
        address indexed user,
        uint256 amount,
        uint256 apy,
        uint256 timestamp
    );
    event Withdrawn(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );

    constructor(string memory _poolName, uint256 _initialAPY) {
        owner = msg.sender;
        poolName = _poolName;
        currentAPY = _initialAPY;
    }

    /// @notice Simulates a market event — APY changes
    function setAPY(uint256 _newAPY, string calldata _reason) external {
        uint256 oldAPY = currentAPY;
        currentAPY = _newAPY;
        emit APYChanged(oldAPY, _newAPY, block.timestamp, _reason);
    }

    function deposit() external payable {
        deposits[msg.sender] += msg.value;
        depositTimestamps[msg.sender] = block.timestamp;
        totalDeposits += msg.value;
        emit Deposited(msg.sender, msg.value, currentAPY, block.timestamp);
    }

    function withdraw(uint256 _amount) external {
        require(deposits[msg.sender] >= _amount, "MockYieldSource: insufficient balance");
        deposits[msg.sender] -= _amount;
        totalDeposits -= _amount;
        emit Withdrawn(msg.sender, _amount, block.timestamp);
    }

    function getCurrentAPY() external view returns (uint256) {
        return currentAPY;
    }

    function getPoolInfo() external view returns (
        string memory name,
        uint256 apy,
        uint256 tvl
    ) {
        return (poolName, currentAPY, totalDeposits);
    }

    /// @notice Simulate accrued yield for a depositor
    function simulateYield(address _user) external view returns (uint256) {
        if (deposits[_user] == 0) return 0;
        uint256 timeElapsed = block.timestamp - depositTimestamps[_user];
        return (deposits[_user] * currentAPY * timeElapsed) / (10000 * 365 days);
    }
}