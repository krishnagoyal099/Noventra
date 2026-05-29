// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockYieldSource {
    uint256 public currentAPY = 5; // 5%
    function deposit(uint256 amount) external { /* simulate deposit */ }
    function getCurrentAPY() external view returns (uint256) { return currentAPY; }
    function setAPY(uint256 newAPY) external { currentAPY = newAPY; }
}