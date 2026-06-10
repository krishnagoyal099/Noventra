// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * NoventraVault — Share-based yield vault for Somnia Testnet
 * Deposit STT → get shares → agents add yield → withdraw more STT
 */
contract NoventraVault {

    mapping(address => uint256) public shares;
    uint256 public totalShares;
    uint256 public totalAssets;

    event Deposited(address indexed user, uint256 amount, uint256 sharesIssued);
    event Withdrawn(address indexed user, uint256 amount, uint256 sharesBurned);
    event YieldAdded(address indexed source, uint256 amount);

    function deposit() external payable {
        require(msg.value > 0, "Must deposit > 0");
        uint256 toIssue;
        if (totalShares == 0 || totalAssets == 0) {
            toIssue = msg.value;
        } else {
            toIssue = (msg.value * totalShares) / totalAssets;
        }
        shares[msg.sender] += toIssue;
        totalShares += toIssue;
        totalAssets += msg.value;
        emit Deposited(msg.sender, msg.value, toIssue);
    }

    function withdrawAll() external {
        uint256 userShares = shares[msg.sender];
        require(userShares > 0, "No shares");
        uint256 sttOut = (userShares * totalAssets) / totalShares;
        require(address(this).balance >= sttOut, "Insufficient balance");
        shares[msg.sender] = 0;
        totalShares -= userShares;
        totalAssets -= sttOut;
        (bool ok,) = payable(msg.sender).call{value: sttOut}("");
        require(ok, "Transfer failed");
        emit Withdrawn(msg.sender, sttOut, userShares);
    }

    function addYield() external payable {
        require(msg.value > 0, "No yield");
        totalAssets += msg.value;
        emit YieldAdded(msg.sender, msg.value);
    }

    function assetsOf(address user) external view returns (uint256) {
        if (totalShares == 0 || shares[user] == 0) return 0;
        return (shares[user] * totalAssets) / totalShares;
    }

    function pricePerShare() external view returns (uint256) {
        if (totalShares == 0) return 1e6;
        return (totalAssets * 1e6) / totalShares;
    }

    function yieldOf(address user) external view returns (uint256) {
        if (totalShares == 0 || shares[user] == 0) return 0;
        uint256 current = (shares[user] * totalAssets) / totalShares;
        return current > shares[user] ? current - shares[user] : 0;
    }

    receive() external payable {
        totalAssets += msg.value;
    }
}
