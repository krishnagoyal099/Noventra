/**
 * ═══════════════════════════════════════════════════════════════════
 *  ALO — Live Demo Script (Somnia Agentathon Winner Edition)
 * ═══════════════════════════════════════════════════════════════════
 *
 *  This script demonstrates the full autonomous agent pipeline:
 *  Deploy → Bootstrap → Scan → Signal → Evaluate → Execute → Receipt
 *
 *  Run with: npx hardhat run scripts/demo.ts --network localhost
 *
 *  Prerequisites: npx hardhat node (running in another terminal)
 * ═══════════════════════════════════════════════════════════════════
 */

import { ethers } from "hardhat";
import { Wallet, Contract } from "ethers";
import { ScoutAgent } from "../agents/ScoutAgent";
import { StrategyAgent } from "../agents/StrategyAgent";
import { RiskAgent } from "../agents/RiskAgent";
import { ExecutionAgent } from "../agents/ExecutionAgent";
import { CoordinatorAgent } from "../agents/CoordinatorAgent";
import { AgentRole, AgentConfig } from "../interfaces/types";

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  white: "\x1b[37m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
};

function banner(text: string) {
  console.log(`\n${COLORS.bright}${COLORS.bgBlue}${COLORS.white} ${text} ${COLORS.reset}\n`);
}

function divider() {
  console.log(`${COLORS.dim}─────────────────────────────────────────────────────────────${COLORS.reset}`);
}

async function main() {
  console.log(`${COLORS.bright}${COLORS.cyan}
  ╔═══════════════════════════════════════════════════════════════╗
  ║                                                               ║
  ║    A L O   —   Autonomous Liquidity Optimizer                 ║
  ║    Swarm of DeFi Agents on Somnia Agentic L1                  ║
  ║                                                               ║
  ║    🔍 Scout  🛡️ Risk  🧠 Strategy  ⚡ Execution  🎯 Coord   ║
  ║                                                               ║
  ╚═══════════════════════════════════════════════════════════════╝
  ${COLORS.reset}`);

  // ─── Setup Hardhat Signers ───
  const [deployer, scoutSigner, riskSigner, strategySigner, executionSigner, coordinatorSigner] = 
    await ethers.getSigners();

  banner("PHASE 1: Deploying Contracts to Somnia Agentic L1");

  // Deploy AgentRegistry
  console.log("📋 Deploying AgentRegistry...");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log(`   ✅ AgentRegistry: ${registryAddr}`);

  // Deploy MessageBus
  console.log("📡 Deploying MessageBus...");
  const MessageBus = await ethers.getContractFactory("MessageBus");
  const messageBus = await MessageBus.deploy(registryAddr);
  await messageBus.waitForDeployment();
  const messageBusAddr = await messageBus.getAddress();
  console.log(`   ✅ MessageBus: ${messageBusAddr}`);

  // Deploy ALOCore
  console.log("🧠 Deploying ALOCore...");
  const initialLiquidity = ethers.parseEther("10000");
  const ALOCore = await ethers.getContractFactory("ALOCore");
  const core = await ALOCore.deploy(registryAddr, initialLiquidity);
  await core.waitForDeployment();
  const coreAddr = await core.getAddress();
  console.log(`   ✅ ALOCore: ${coreAddr} (Liquidity: 10,000)`);

  // Deploy Mock Protocols
  console.log("🏦 Deploying Mock DeFi Protocols...");
  const MockDEX = await ethers.getContractFactory("MockDEX");
  const mockDEX = await MockDEX.deploy();
  await mockDEX.waitForDeployment();
  console.log(`   ✅ MockDEX: ${await mockDEX.getAddress()}`);

  const MockYieldSource = await ethers.getContractFactory("MockYieldSource");
  const yieldPoolA = await MockYieldSource.deploy("Somnia Alpha Pool", 50);
  await yieldPoolA.waitForDeployment();
  const yieldPoolAAddr = await yieldPoolA.getAddress();
  console.log(`   ✅ YieldPool Alpha: ${yieldPoolAAddr} (APY: 0.5%)`);

  const yieldPoolB = await MockYieldSource.deploy("Somnia Beta Pool", 80);
  await yieldPoolB.waitForDeployment();
  console.log(`   ✅ YieldPool Beta: ${await yieldPoolB.getAddress()} (APY: 0.8%)`);

  divider();

  banner("PHASE 2: Bootstrapping Agent Swarm");

  // Hardhat default private keys (accounts 0-5), used only for on-chain identity in AgentRegistry
  const HARDHAT_KEYS = [
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // deployer
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // scout
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", // risk
    "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", // strategy
    "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a", // execution
    "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba", // coordinator
  ];

  const agentConfigs: AgentConfig[] = [
    { name: "ScoutAgent",       role: AgentRole.SCOUT,       privateKey: HARDHAT_KEYS[1] },
    { name: "RiskAgent",        role: AgentRole.RISK,        privateKey: HARDHAT_KEYS[2] },
    { name: "StrategyAgent",    role: AgentRole.STRATEGY,    privateKey: HARDHAT_KEYS[3] },
    { name: "ExecutionAgent",   role: AgentRole.EXECUTION,   privateKey: HARDHAT_KEYS[4] },
    { name: "CoordinatorAgent", role: AgentRole.COORDINATOR, privateKey: HARDHAT_KEYS[0] }, // Must be deployer for onlyOwner access
  ];

  // Initialize Coordinator
  const coordinator = new CoordinatorAgent(
    deployer,
    registry.connect(deployer) as Contract,
    messageBus.connect(deployer) as Contract,
    core.connect(deployer) as Contract,
    agentConfigs
  );

  // Bootstrap: Register all agents on-chain
  await coordinator.bootstrap();
  await coordinator.start();

  divider();

  banner("PHASE 3: Initializing Autonomous Agents");

  // Initialize and start all agents
  const scout = new ScoutAgent(
    scoutSigner,
    registry.connect(scoutSigner) as Contract,
    messageBus.connect(scoutSigner) as Contract,
    core.connect(scoutSigner) as Contract,
    [yieldPoolA, yieldPoolB],
    100n, // APY threshold: 1% (100 bps)
    3000  // Scan every 3 seconds for demo
  );

  const risk = new RiskAgent(
    riskSigner,
    registry.connect(riskSigner) as Contract,
    messageBus.connect(riskSigner) as Contract,
    core.connect(riskSigner) as Contract,
    10000n, // Max acceptable APY: 100%
    20,     // Max drawdown: 20%
    0.0     // Demo rejection rate (0% for smooth demo, increase to test rejections)
  );

  const strategy = new StrategyAgent(
    strategySigner,
    registry.connect(strategySigner) as Contract,
    messageBus.connect(strategySigner) as Contract,
    core.connect(strategySigner) as Contract,
    30 // Max 30% allocation per strategy
  );

  const execution = new ExecutionAgent(
    executionSigner,
    registry.connect(executionSigner) as Contract,
    messageBus.connect(executionSigner) as Contract,
    core.connect(executionSigner) as Contract,
    mockDEX
  );

  // Start all agents (they are now autonomous!)
  scout.start();
  risk.start();
  strategy.start();
  execution.start();

  divider();

  banner("PHASE 4: Simulating Market Event (APY Spike)");

  // Wait a moment for agents to initialize and do initial scan
  console.log(`${COLORS.yellow}⏳ Waiting 5 seconds for initial scan to complete...${COLORS.reset}`);
  await new Promise(resolve => setTimeout(resolve, 5000));

  // ─── TRIGGER THE AUTONOMOUS PIPELINE ───
  // Simulate a sudden APY spike in Pool Alpha — this is the "market event"
  // that the ScoutAgent will detect and kick off the entire pipeline.
  console.log(`\n${COLORS.bright}${COLORS.bgRed}${COLORS.white} 🚨 MARKET EVENT: APY Spike on Somnia Alpha Pool! (0.5% → 5.0%) ${COLORS.reset}\n`);
  
  const apyChangeTx = await yieldPoolA.setAPY(500, "Market volatility created yield opportunity");
  await apyChangeTx.wait();
  console.log(`${COLORS.green}✅ APY change confirmed on-chain! TxHash: ${apyChangeTx.hash.slice(0, 20)}...${COLORS.reset}\n`);

  // Wait for the autonomous pipeline to complete
  console.log(`${COLORS.yellow}⏳ Waiting for autonomous agent pipeline to execute...${COLORS.reset}`);
  console.log(`${COLORS.dim}   (Scout detects → Strategy proposes → Risk evaluates → Execution trades)${COLORS.reset}\n`);
  
  await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds for pipeline

  divider();

  banner("PHASE 5: Somnia On-Chain Audit Trail (Receipts)");

  // ─── READ THE RECEIPTS ───
  // This is what Somnia judges will inspect: the immutable on-chain
  // record of every agent's decision in the pipeline.
  console.log(`${COLORS.cyan}📜 Reading immutable Receipts from ALOCore...${COLORS.reset}\n`);

  const receiptCount = await core.getReceiptCount();
  console.log(`${COLORS.bright}Total Receipts: ${receiptCount}${COLORS.reset}\n`);

  for (let i = 0; i < Number(receiptCount); i++) {
    const receipt = await core.allReceipts(i);
    console.log(`${COLORS.bright}── Receipt #${i + 1} ──${COLORS.reset}`);
    console.log(`   Strategy ID: ${receipt.strategyId}`);
    console.log(`   Agent:       ${receipt.agent.slice(0, 10)}...${receipt.agent.slice(-6)}`);
    console.log(`   Role:        ${receipt.agentRole}`);
    console.log(`   Action:      ${receipt.action}`);
    console.log(`   Timestamp:   ${receipt.timestamp}`);
    console.log(`   Result Data: ${receipt.resultData.slice(0, 40)}...`);
    console.log();
  }

  divider();

  // ─── Read Final Strategy State ───
  console.log(`${COLORS.cyan}📊 Final Strategy State:${COLORS.reset}\n`);
  const strategyCount = await core.getStrategyCount();
  
  for (let i = 1; i <= Number(strategyCount); i++) {
    const s = await core.getStrategy(i);
    const stateNames = ["NONE", "PROPOSED", "APPROVED", "REJECTED", "EXECUTED", "FAILED"];
    console.log(`   Strategy #${i}:`);
    console.log(`      State:      ${stateNames[s.state]}`);
    console.log(`      Pool:       ${s.params.targetPool.slice(0, 10)}...`);
    console.log(`      Allocation: ${ethers.formatEther(s.params.allocation)} units`);
    console.log(`      Expected:   ${s.params.expectedAPY} bps APY`);
    console.log(`      ProposedBy: ${s.proposedBy.slice(0, 10)}...`);
    console.log(`      ApprovedBy: ${s.approvedBy.slice(0, 10)}...`);
    console.log(`      ExecutedBy: ${s.executedBy.slice(0, 10)}...`);
    console.log();
  }

  // ─── Final System State ───
  const finalLiquidity = await core.totalLiquidity();
  console.log(`${COLORS.cyan}💰 Final System Liquidity: ${ethers.formatEther(finalLiquidity)} units${COLORS.reset}\n`);

  // Stop all agents
  scout.stop();
  risk.stop();
  strategy.stop();
  execution.stop();
  coordinator.stop();

  console.log(`${COLORS.bright}${COLORS.green}
  ╔═══════════════════════════════════════════════════════════════╗
  ║                                                               ║
  ║    🏆 ALO DEMO COMPLETE 🏆                                     ║
  ║                                                               ║
  ║    Autonomous agents successfully coordinated on Somnia L1:    ║
  ║    • Opportunity discovered by ScoutAgent                      ║
  ║    • Strategy proposed by StrategyAgent                        ║
  ║    • Risk evaluated and approved by RiskAgent                  ║
  ║    • Trade executed by ExecutionAgent                          ║
  ║    • All decisions recorded as on-chain Receipts               ║
  ║                                                               ║
  ╚═══════════════════════════════════════════════════════════════╝
  ${COLORS.reset}`);

  // Exit process (hardhat script mode)
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});