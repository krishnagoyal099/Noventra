// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockDEX {
    uint256 public price = 100;
    function swap(uint256 amount) external { /* simulate swap */ }
    function setPrice(uint256 newPrice) external { price = newPrice; }
}