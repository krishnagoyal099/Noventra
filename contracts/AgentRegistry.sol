// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ═══════════════════════════════════════════════════════════════════
 *  ALO — AgentRegistry
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Purpose: The "Yellow Pages" of the ALO agent swarm.
 *
 *  Somnia Agentic L1 Context:
 *  ─────────────────────────
 *  On Somnia, agents are first-class on-chain entities. This registry
 *  defines WHO each agent is and WHAT role it plays. Only registered
 *  agents can participate in the ALO decision-making pipeline, ensuring
 *  that the on-chain receipt trail is attributable to verified agents.
 *
 *  This is the foundation of agent accountability — every receipt in
 *  ALOCore references an agent registered here.
 * ═══════════════════════════════════════════════════════════════════
 */
contract AgentRegistry {

    // ─── Agent Roles ───
    // Each role maps to a specialized responsibility in the swarm.
    enum AgentRole {
        NONE,        // 0 — Default / unregistered
        SCOUT,       // 1 — Discovers liquidity opportunities
        RISK,        // 2 — Evaluates and approves/rejects strategies
        STRATEGY,    // 3 — Composes allocation strategies
        EXECUTION,   // 4 — Executes approved trades on-chain
        COORDINATOR  // 5 — Meta-agent: orchestrates and resolves conflicts
    }

    // ─── Agent Metadata ───
    struct AgentInfo {
        address agentAddress;   // The agent's on-chain address
        AgentRole role;         // Its specialized role
        bool isActive;          // Whether it's currently active
        uint256 registeredAt;   // Registration timestamp
        string metadataURI;     // Optional: link to off-chain agent config
    }

    // ─── Storage ───
    mapping(address => AgentInfo) public agents;
    address[] public agentList;
    address public owner;

    // ─── Events ───
    event AgentRegistered(address indexed agent, AgentRole role, uint256 timestamp);
    event AgentDeactivated(address indexed agent, uint256 timestamp);
    event AgentReactivated(address indexed agent, uint256 timestamp);

    // ─── Access Control ───
    modifier onlyOwner() {
        require(msg.sender == owner, "AgentRegistry: only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ─── Register a new agent with a specific role ───
    function registerAgent(
        address _agentAddr,
        AgentRole _role,
        string calldata _metadataURI
    ) external onlyOwner {
        require(_agentAddr != address(0), "AgentRegistry: zero address");
        require(_role != AgentRole.NONE, "AgentRegistry: invalid role");
        require(agents[_agentAddr].role == AgentRole.NONE, "AgentRegistry: already registered");

        agents[_agentAddr] = AgentInfo({
            agentAddress: _agentAddr,
            role: _role,
            isActive: true,
            registeredAt: block.timestamp,
            metadataURI: _metadataURI
        });
        agentList.push(_agentAddr);

        emit AgentRegistered(_agentAddr, _role, block.timestamp);
    }



    // ─── Deactivate an agent (keeps history, stops participation) ───
    function deactivateAgent(address _agentAddr) external onlyOwner {
        require(agents[_agentAddr].role != AgentRole.NONE, "AgentRegistry: not registered");
        require(agents[_agentAddr].isActive, "AgentRegistry: already inactive");
        agents[_agentAddr].isActive = false;
        emit AgentDeactivated(_agentAddr, block.timestamp);
    }

    // ─── Reactivate a previously deactivated agent ───
    function reactivateAgent(address _agentAddr) external onlyOwner {
        require(agents[_agentAddr].role != AgentRole.NONE, "AgentRegistry: not registered");
        require(!agents[_agentAddr].isActive, "AgentRegistry: already active");
        agents[_agentAddr].isActive = true;
        emit AgentReactivated(_agentAddr, block.timestamp);
    }

    // ─── View Functions ───

    function getAgentRole(address _agentAddr) external view returns (AgentRole) {
        return agents[_agentAddr].role;
    }

    function isRegisteredAgent(address _agentAddr) external view returns (bool) {
        return agents[_agentAddr].isActive;
    }

    function getAgentInfo(address _agentAddr) external view returns (AgentInfo memory) {
        return agents[_agentAddr];
    }

    function getAgentCount() external view returns (uint256) {
        return agentList.length;
    }

    /// @notice Returns all agent addresses with a given role
    function getAgentsByRole(AgentRole _role) external view returns (address[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < agentList.length; i++) {
            if (agents[agentList[i]].role == _role && agents[agentList[i]].isActive) {
                count++;
            }
        }

        address[] memory result = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < agentList.length; i++) {
            if (agents[agentList[i]].role == _role && agents[agentList[i]].isActive) {
                result[idx++] = agentList[i];
            }
        }
        return result;
    }

    /// @notice Converts an AgentRole enum to its string representation
    function roleToString(AgentRole _role) external pure returns (string memory) {
        if (_role == AgentRole.SCOUT) return "SCOUT";
        if (_role == AgentRole.RISK) return "RISK";
        if (_role == AgentRole.STRATEGY) return "STRATEGY";
        if (_role == AgentRole.EXECUTION) return "EXECUTION";
        if (_role == AgentRole.COORDINATOR) return "COORDINATOR";
        return "NONE";
    }
}