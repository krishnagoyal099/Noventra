// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ═══════════════════════════════════════════════════════════════════
 *  ALO — MessageBus
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Purpose: Enables Agent-to-Agent communication on Somnia Agentic L1.
 *
 *  Somnia Agentic L1 Context:
 *  ─────────────────────────
 *  Agent coordination is the core primitive of Agentic L1. This
 *  MessageBus provides:
 *
 *  1. EVENT-DRIVEN SIGNALING — Agents emit typed signals (events) that
 *     other agents listen for and react to autonomously.
 *
 *  2. PERSISTENT MESSAGE STATE — Signals are stored on-chain, creating
 *     an immutable audit trail. Any observer can reconstruct the full
 *     conversation between agents.
 *
 *  3. CONSUMPTION TRACKING — When an agent processes a signal, it marks
 *     it as consumed, preventing duplicate processing and enabling
 *     "exactly-once" semantics.
 *
 *  This is how agents NEGOTIATE on Somnia — not through API calls,
 *  but through on-chain messages that form a verifiable conversation.
 * ═══════════════════════════════════════════════════════════════════
 */
contract MessageBus {

    // ─── Signal Structure ───
    struct Signal {
        address fromAgent;      // Who emitted this signal
        string signalType;      // e.g. "OPPORTUNITY_FOUND", "RISK_ALERT"
        bytes data;             // ABI-encoded payload
        uint256 timestamp;      // Block timestamp
        bool consumed;          // Has an agent processed this?
        address consumedBy;     // Which agent consumed it
    }

    // ─── Storage ───
    mapping(bytes32 => Signal) public signals;
    bytes32[] public signalIds;

    address public registry;
    address public owner;

    // ─── Events ───
    // These are the primary coordination mechanism — agents listen for these.
    event SignalSent(
        bytes32 indexed signalId,
        address indexed from,
        string signalType,
        bytes data,
        uint256 timestamp
    );
    event SignalConsumed(
        bytes32 indexed signalId,
        address indexed by,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "MessageBus: only owner");
        _;
    }

    constructor(address _registry) {
        registry = _registry;
        owner = msg.sender;
    }

    // ─── Emit a typed signal with arbitrary data ───
    // Any agent can emit signals — this is how they "speak" to the swarm.
    function emitSignal(
        string calldata _signalType,
        bytes calldata _data
    ) external returns (bytes32) {
        bytes32 signalId = keccak256(
            abi.encodePacked(
                msg.sender,
                _signalType,
                block.timestamp,
                signalIds.length
            )
        );

        signals[signalId] = Signal({
            fromAgent: msg.sender,
            signalType: _signalType,
            data: _data,
            timestamp: block.timestamp,
            consumed: false,
            consumedBy: address(0)
        });
        signalIds.push(signalId);

        emit SignalSent(signalId, msg.sender, _signalType, _data, block.timestamp);
        return signalId;
    }

    // ─── Mark a signal as consumed by the calling agent ───
    // Prevents duplicate processing and records which agent acted on it.
    function consumeSignal(bytes32 _signalId) external returns (Signal memory) {
        require(signals[_signalId].fromAgent != address(0), "MessageBus: signal not found");
        require(!signals[_signalId].consumed, "MessageBus: already consumed");

        signals[_signalId].consumed = true;
        signals[_signalId].consumedBy = msg.sender;

        emit SignalConsumed(_signalId, msg.sender, block.timestamp);
        return signals[_signalId];
    }

    // ─── View Functions ───

    function getSignal(bytes32 _signalId) external view returns (Signal memory) {
        return signals[_signalId];
    }

    function getSignalCount() external view returns (uint256) {
        return signalIds.length;
    }

    function getLatestSignalId() external view returns (bytes32) {
        require(signalIds.length > 0, "MessageBus: no signals");
        return signalIds[signalIds.length - 1];
    }

    /// @notice Returns all signals of a given type (for batch processing)
    function getSignalsByType(string calldata _signalType) external view returns (bytes32[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < signalIds.length; i++) {
            if (keccak256(bytes(signals[signalIds[i]].signalType)) == keccak256(bytes(_signalType))) {
                count++;
            }
        }

        bytes32[] memory result = new bytes32[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < signalIds.length; i++) {
            if (keccak256(bytes(signals[signalIds[i]].signalType)) == keccak256(bytes(_signalType))) {
                result[idx++] = signalIds[i];
            }
        }
        return result;
    }
}