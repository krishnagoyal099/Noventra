// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MessageBus {
    event SignalSent(address indexed from, string signalType, bytes data);
    
    mapping(bytes32 => bytes) public messages;

    // Note: Using msg.sender as the 'from' address prevents signal spoofing
    function emitSignal(string memory signalType, bytes calldata data) external {
        emit SignalSent(msg.sender, signalType, data);
    }

    function storeMessage(bytes32 signalId, bytes calldata data) external {
        messages[signalId] = data;
    }
    
    function getMessage(bytes32 signalId) external view returns (bytes memory) {
        return messages[signalId];
    }
}