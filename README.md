# Autonomous Liquidity Orchestrator (ALO) - Somnia MVP

Welcome to the MVP for the **Autonomous Liquidity Orchestrator (ALO)** built for the Somnia network! This project demonstrates a fully autonomous, multi-agent AI system that coordinates on-chain to find, evaluate, and execute DeFi yield strategies.

## 🚀 Overview

In this system, AI agents are treated as first-class citizens with verifiable identities (wallets) and specific roles. They communicate asynchronously using an on-chain event bus, mimicking a decentralized nervous system for smart liquidity routing.

## 🏗️ Architecture

### 1. Smart Contracts
- **AgentRegistry.sol**: The "Yellow Pages" of the swarm. Registers agent identities and enforces role-based access control.
- **MessageBus.sol**: The event-driven coordination layer. Agents emit and read signals here.
- **ALOCore.sol**: The main state engine. Tracks proposed strategies, risk approvals, and final execution receipts.
- **MockDEX & MockYieldSource**: Simulated DeFi protocols used for the demo.

### 2. The AI Agents
The system is powered by 5 specialized off-chain TypeScript agents:
1. **CoordinatorAgent** (🎛️): Bootstraps the system, registers all other agents to the `AgentRegistry`, and assigns their roles.
2. **ScoutAgent** (🟢): Constantly scans the DeFi landscape (MockYieldSource) for high-APY opportunities.
3. **StrategyAgent** (🧠): Listens for opportunities and proposes concrete capital allocation strategies to `ALOCore`.
4. **RiskAgent** (🛡️): Acts as the safeguard. Evaluates proposed strategies against hardcoded safety parameters (e.g., rejects highly anomalous yields).
5. **ExecutionAgent** (⚡): Monitors `ALOCore` for risk-approved strategies and executes the final trades on the DEX, leaving an immutable receipt on-chain.

## 💻 How to Run the Demo

1. **Install Dependencies** (if you haven't already)
   ```bash
   npm install
   ```

2. **Run the Simulation**
   ```bash
   npm run demo
   ```

### 🔍 What to expect in the Demo:
- The system will deploy the contracts to a local Hardhat network and register the agents.
- The `ScoutAgent` will start scanning.
- A market anomaly is simulated: The yield APY spikes to **500%**.
- The `ScoutAgent` detects this and signals an opportunity.
- The `StrategyAgent` proposes allocating 50,000 to the new pool.
- **The Twist:** The `RiskAgent` has a strict safety parameter (`APY < 100%`). It identifies the 500% APY as a potential exploit or rug-pull and **rejects** the strategy (`Approved: false`).
- Because of the rejection, the `ExecutionAgent` does not trade, securing the treasury.

*(Note: To see a successful execution where a final receipt is printed, lower the simulated APY in `scripts/demo.ts` to something under 100%, or raise the safety threshold in `agents/RiskAgent.ts`!)*
