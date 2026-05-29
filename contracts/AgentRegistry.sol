// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentRegistry {
    mapping(address => string) public agentRoles;
    address public owner;

    event AgentRegistered(address indexed agentAddr, string role);

    constructor() {
        owner = msg.sender;
    }

    function registerAgent(address agentAddr, string memory role) external {
        // In a production Somnia environment, this would require staking or DID verification
        agentRoles[agentAddr] = role;
        emit AgentRegistered(agentAddr, role);
    }

    function getAgentRole(address agentAddr) external view returns (string memory) {
        return agentRoles[agentAddr];
    }
    
    function isRole(address agentAddr, string memory role) public view returns (bool) {
        return keccak256(abi.encodePacked(agentRoles[agentAddr])) == keccak256(abi.encodePacked(role));
    }
}