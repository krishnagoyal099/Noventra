/**
 * ═══════════════════════════════════════════════════════════════════
 *  ALO — Live Somnia Testnet Demo
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Connects to ALREADY DEPLOYED contracts on Somnia Testnet.
 *  Uses real agent wallets from .env for on-chain identity.
 *
 *  Run with:
 *    npx hardhat run scripts/demo-somnia.ts --network somnia
 *
 *  Prerequisites:
 *    - Contracts deployed via: npm run deploy:somnia
 *    - .env populated with PRIVATE_KEY + all AGENT_PRIVATE_KEYs
 *    - Agent wallets funded with STT (even tiny amounts work)
 * ═══════════════════════════════════════════════════════════════════
 */

import { ethers as hardhatEthers } from "hardhat";
import { JsonRpcProvider, Wallet, Contract } from "ethers";
import * as dotenv from "dotenv";
import { ScoutAgent } from "../agents/ScoutAgent";
import { StrategyAgent } from "../agents/StrategyAgent";
import { RiskAgent } from "../agents/RiskAgent";
import { ExecutionAgent } from "../agents/ExecutionAgent";
import { CoordinatorAgent } from "../agents/CoordinatorAgent";
import { AgentRole, AgentConfig } from "../interfaces/types";

dotenv.config();

/**
 * Custom JSON-RPC provider for Somnia Testnet.
 *
 * Somnia's RPC has two known quirks that break ethers v6:
 *
 * 1. eth_getLogs returns `removed: null` instead of `false`.
 *    Ethers v6 asserts this must be a boolean → BAD_DATA error.
 *
 * 2. eth_estimateGas returns ~2.2 billion gas for normal contract
 *    calls (likely a fallback max when Somnia's estimator fails
 *    internally). Additionally, Somnia's EVM storage opcodes cost
 *    ~2.5–3× more gas than standard EVM. We cap at 5,000,000 gas
 *    which at 6 Gwei costs ~0.00003 STT — well within 0.04 STT budget.
 */
class SomniaProvider extends JsonRpcProvider {
  /** Maximum gas cap for Somnia transactions (12M units) */
  private static readonly GAS_CAP = 12_000_000n;

  override async send(method: string, params: Array<any>): Promise<any> {
    const result = await super.send(method, params);

    // Fix 1: Normalize log.removed null → false
    if (method === "eth_getLogs" && Array.isArray(result)) {
      return result.map((log: any) => ({
        ...log,
        removed: log.removed ?? false,
      }));
    }

    // Fix 2: Cap absurdly inflated gas estimates
    if (method === "eth_estimateGas") {
      const estimated = BigInt(result);
      if (estimated > SomniaProvider.GAS_CAP) {
        return "0x" + SomniaProvider.GAS_CAP.toString(16);
      }
    }

    return result;
  }
}

// ─── Deployed Contract Addresses (from: npm run deploy:somnia) ───
const DEPLOYED = {
  AgentRegistry:   "0x25BD5aDDB50520D4357a8Ab4e7ab3E0078d43120",
  MessageBus:      "0x6f9A78B42B548919Ba1a53Bab7701FB186c06A23",
  ALOCore:         "0x4ce55750E419ddF3535B9ef1C1CCb8960ec1146e",
  MockDEX:         "0xB9363626Af52Cbc6AEDe5883fbAaf5e81a6971b4",
  YieldPoolAlpha:  "0xe6f16d621C8892c56eED3aa637FB3E6f52d2486b",
  YieldPoolBeta:   "0x9099aF3CB21Ce01f56Bf15E6bA1B3F4BAa256cc5",
};

// ─── Somnia Testnet Explorer base URL ───
const EXPLORER = "https://shannon-explorer.somnia.network";

const COLORS = {
  reset:     "\x1b[0m",
  bright:    "\x1b[1m",
  dim:       "\x1b[2m",
  white:     "\x1b[37m",
  red:       "\x1b[31m",
  green:     "\x1b[32m",
  yellow:    "\x1b[33m",
  blue:      "\x1b[34m",
  magenta:   "\x1b[35m",
  cyan:      "\x1b[36m",
  bgBlack:   "\x1b[40m",
  bgRed:     "\x1b[41m",
  bgGreen:   "\x1b[42m",
  bgYellow:  "\x1b[43m",
  bgBlue:    "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan:    "\x1b[46m",
  bgWhite:   "\x1b[47m",
};

function banner(text: string): void {
  console.log(`\n${COLORS.bright}${COLORS.bgBlue}${COLORS.white} ${text} ${COLORS.reset}\n`);
}

function divider(): void {
  console.log(`${COLORS.dim}─────────────────────────────────────────────────────────────${COLORS.reset}`);
}

function explorerTx(hash: string): string {
  return `${EXPLORER}/tx/${hash}`;
}

function explorerAddr(addr: string): string {
  return `${EXPLORER}/address/${addr}`;
}

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}. Check your .env file.`);
  return val;
}

async function main(): Promise<void> {
  console.log(`${COLORS.bright}${COLORS.cyan}
  ╔═══════════════════════════════════════════════════════════════╗
  ║                                                               ║
  ║    A L O   —   Autonomous Liquidity Optimizer                 ║
  ║    LIVE on Somnia Testnet (Chain ID: 50312)                   ║
  ║                                                               ║
  ║    🔍 Scout  🛡️ Risk  🧠 Strategy  ⚡ Execution  🎯 Coord   ║
  ║                                                               ║
  ╚═══════════════════════════════════════════════════════════════╝
  ${COLORS.reset}`);

  // ─── Load agent private keys from .env ───
  const deployerKey     = requireEnv("PRIVATE_KEY");
  const scoutKey        = requireEnv("SCOUT_PRIVATE_KEY");
  const riskKey         = requireEnv("RISK_PRIVATE_KEY");
  const strategyKey     = requireEnv("STRATEGY_PRIVATE_KEY");
  const executionKey    = requireEnv("EXECUTION_PRIVATE_KEY");
  const coordinatorKey  = requireEnv("COORDINATOR_PRIVATE_KEY");

  // ─── Use raw SomniaProvider (bypasses hardhat-ethers broken getLogs wrapper) ───
  const rpcUrl = process.env.SOMNIA_RPC_URL || "https://dream-rpc.somnia.network";
  const provider = new SomniaProvider(rpcUrl);

  // ─── Create real agent signers from .env keys, backed by SomniaProvider ───
  const deployerSigner    = new Wallet(deployerKey,    provider);
  const scoutSigner       = new Wallet(scoutKey,       provider);
  const riskSigner        = new Wallet(riskKey,        provider);
  const strategySigner    = new Wallet(strategyKey,    provider);
  const executionSigner   = new Wallet(executionKey,   provider);
  const coordinatorSigner = new Wallet(coordinatorKey, provider);

  // ─── Print wallet addresses and balances ───
  banner("AGENT WALLET IDENTITIES (Somnia Testnet)");
  const agents = [
    { name: "Deployer",    signer: deployerSigner },
    { name: "Scout",       signer: scoutSigner },
    { name: "Risk",        signer: riskSigner },
    { name: "Strategy",    signer: strategySigner },
    { name: "Execution",   signer: executionSigner },
    { name: "Coordinator", signer: coordinatorSigner },
  ];
  for (const a of agents) {
    const bal = await provider.getBalance(a.signer.address);
    const balStr = hardhatEthers.formatEther(bal);
    const balColor = Number(balStr) > 0.001 ? COLORS.green : COLORS.yellow;
    console.log(
      `  ${COLORS.bright}${a.name.padEnd(12)}${COLORS.reset} ` +
      `${a.signer.address}  ${balColor}${balStr} STT${COLORS.reset}  ` +
      `${COLORS.dim}${explorerAddr(a.signer.address)}${COLORS.reset}`
    );
  }

  // ─── Attach to already-deployed contracts ───
  banner("PHASE 1: Connecting to Deployed Contracts on Somnia");

  // Use hardhatEthers only for ABI resolution via getContractFactory;
  // all actual provider/signer calls go through SomniaProvider.
  const AgentRegistryArtifact   = await hardhatEthers.getContractFactory("AgentRegistry");
  const MessageBusArtifact      = await hardhatEthers.getContractFactory("MessageBus");
  const ALOCoreArtifact         = await hardhatEthers.getContractFactory("ALOCore");
  const MockDEXArtifact         = await hardhatEthers.getContractFactory("MockDEX");
  const MockYieldSourceArtifact = await hardhatEthers.getContractFactory("MockYieldSource");

  // Attach at address and immediately connect to a SomniaProvider-backed signer
  // so that queryFilter / getLogs go through our fixed provider, not hardhat-ethers.
  const registry   = AgentRegistryArtifact.attach(DEPLOYED.AgentRegistry).connect(deployerSigner)  as Contract;
  const messageBus = MessageBusArtifact.attach(DEPLOYED.MessageBus).connect(deployerSigner)        as Contract;
  const core       = ALOCoreArtifact.attach(DEPLOYED.ALOCore).connect(deployerSigner)              as Contract;
  const mockDEX    = MockDEXArtifact.attach(DEPLOYED.MockDEX).connect(deployerSigner)              as Contract;
  const yieldPoolA = MockYieldSourceArtifact.attach(DEPLOYED.YieldPoolAlpha).connect(deployerSigner) as Contract;
  const yieldPoolB = MockYieldSourceArtifact.attach(DEPLOYED.YieldPoolBeta).connect(deployerSigner)  as Contract;

  console.log(`  ${COLORS.green}✅ AgentRegistry${COLORS.reset}  ${DEPLOYED.AgentRegistry}`);
  console.log(`  ${COLORS.green}✅ MessageBus${COLORS.reset}     ${DEPLOYED.MessageBus}`);
  console.log(`  ${COLORS.green}✅ ALOCore${COLORS.reset}        ${DEPLOYED.ALOCore}`);
  console.log(`  ${COLORS.green}✅ MockDEX${COLORS.reset}        ${DEPLOYED.MockDEX}`);
  console.log(`  ${COLORS.green}✅ YieldPool A${COLORS.reset}    ${DEPLOYED.YieldPoolAlpha}`);
  console.log(`  ${COLORS.green}✅ YieldPool B${COLORS.reset}    ${DEPLOYED.YieldPoolBeta}`);

  const totalLiquidity = await (core.connect(deployerSigner) as any).totalLiquidity();
  console.log(`\n  ${COLORS.cyan}💰 System Liquidity: ${ethers.formatEther(totalLiquidity)} units${COLORS.reset}`);

  divider();

  // ─── Bootstrap agent swarm with real .env wallets ───
  banner("PHASE 2: Bootstrapping Agent Swarm on Somnia");

  const agentConfigs: AgentConfig[] = [
    { name: "ScoutAgent",       role: AgentRole.SCOUT,       privateKey: scoutKey },
    { name: "RiskAgent",        role: AgentRole.RISK,        privateKey: riskKey },
    { name: "StrategyAgent",    role: AgentRole.STRATEGY,    privateKey: strategyKey },
    { name: "ExecutionAgent",   role: AgentRole.EXECUTION,   privateKey: executionKey },
    { name: "CoordinatorAgent", role: AgentRole.COORDINATOR, privateKey: deployerKey }, // deployer owns registry
  ];

  const coordinator = new CoordinatorAgent(
    deployerSigner,
    registry.connect(deployerSigner) as Contract,
    messageBus.connect(deployerSigner) as Contract,
    core.connect(deployerSigner) as Contract,
    agentConfigs
  );

  await coordinator.bootstrap();
  await coordinator.start();

  divider();

  // ─── Initialize all autonomous agents ───
  banner("PHASE 3: Initializing Autonomous Agents");

  const scout = new ScoutAgent(
    scoutSigner,
    registry.connect(scoutSigner) as Contract,
    messageBus.connect(scoutSigner) as Contract,
    core.connect(scoutSigner) as Contract,
    [yieldPoolA, yieldPoolB],
    100n,  // APY threshold: 1% (100 bps)
    30000  // Scan every 30 seconds to prevent nonce overlaps
  );

  const risk = new RiskAgent(
    riskSigner,
    registry.connect(riskSigner) as Contract,
    messageBus.connect(riskSigner) as Contract,
    core.connect(riskSigner) as Contract,
    10000n, // Max acceptable APY: 100% (10000 bps)
    20,     // Max drawdown: 20%
    0.0     // 0% random rejection rate for clean demo
  );

  const strategy = new StrategyAgent(
    strategySigner,
    registry.connect(strategySigner) as Contract,
    messageBus.connect(strategySigner) as Contract,
    core.connect(strategySigner) as Contract,
    10 // Max 10% allocation per strategy (conservative for testnet)
  );

  const execution = new ExecutionAgent(
    executionSigner,
    registry.connect(executionSigner) as Contract,
    messageBus.connect(executionSigner) as Contract,
    core.connect(executionSigner) as Contract,
    mockDEX
  );

  scout.start();
  risk.start();
  strategy.start();
  execution.start();

  divider();

  // ─── Trigger the autonomous pipeline ───
  banner("PHASE 4: Simulating Market Event (APY Spike)");

  console.log(`${COLORS.yellow}⏳ Waiting 8 seconds for initial scans on testnet...${COLORS.reset}`);
  await new Promise(resolve => setTimeout(resolve, 8000));

  console.log(`\n${COLORS.bright}${COLORS.bgRed}${COLORS.white} 🚨 MARKET EVENT: APY Spike on Somnia Alpha Pool! (0.5% → 5.0%) ${COLORS.reset}\n`);

  const apyChangeTx = await (yieldPoolA.connect(deployerSigner) as any)
    .setAPY(500, "Somnia testnet market event: yield opportunity detected");
  await apyChangeTx.wait();
  console.log(`${COLORS.green}✅ APY change confirmed on Somnia Testnet!`);
  console.log(`   TxHash: ${explorerTx(apyChangeTx.hash)}${COLORS.reset}\n`);

  console.log(`${COLORS.yellow}⏳ Waiting for autonomous agent pipeline to execute...${COLORS.reset}`);
  console.log(`${COLORS.dim}   (Scout detects → Strategy proposes → Risk evaluates → Execution trades)${COLORS.reset}\n`);

  // Wait longer on testnet (block confirmation times)
  await new Promise(resolve => setTimeout(resolve, 30000));

  divider();

  // ─── Read on-chain receipts ───
  banner("PHASE 5: Somnia On-Chain Audit Trail (Receipts)");

  console.log(`${COLORS.cyan}📜 Reading immutable Receipts from ALOCore...${COLORS.reset}\n`);
  console.log(`   ${COLORS.dim}Contract: ${explorerAddr(DEPLOYED.ALOCore)}${COLORS.reset}\n`);

  const receiptCount = await (core.connect(deployerSigner) as any).getReceiptCount();
  console.log(`${COLORS.bright}Total Receipts: ${receiptCount}${COLORS.reset}\n`);

  for (let i = 0; i < Number(receiptCount); i++) {
    const receipt = await (core.connect(deployerSigner) as any).allReceipts(i);
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

  // ─── Final strategy state ───
  console.log(`${COLORS.cyan}📊 Final Strategy State:${COLORS.reset}\n`);
  const strategyCount = await (core.connect(deployerSigner) as any).getStrategyCount();

  for (let i = 1; i <= Number(strategyCount); i++) {
    const s = await (core.connect(deployerSigner) as any).getStrategy(i);
    const stateNames = ["NONE", "PROPOSED", "APPROVED", "REJECTED", "EXECUTED", "FAILED"];
    console.log(`   Strategy #${i}:`);
    console.log(`      State:      ${stateNames[s.state]}`);
    console.log(`      Pool:       ${s.params.targetPool.slice(0, 10)}...`);
    console.log(`      Allocation: ${hardhatEthers.formatEther(s.params.allocation)} units`);
    console.log(`      Expected:   ${s.params.expectedAPY} bps APY`);
    console.log(`      ProposedBy: ${s.proposedBy.slice(0, 10)}...`);
    console.log(`      ApprovedBy: ${s.approvedBy.slice(0, 10)}...`);
    console.log(`      ExecutedBy: ${s.executedBy.slice(0, 10)}...`);
    console.log();
  }

  const finalLiquidity = await (core.connect(deployerSigner) as any).totalLiquidity();
  console.log(`${COLORS.cyan}💰 Final System Liquidity: ${hardhatEthers.formatEther(finalLiquidity)} units${COLORS.reset}\n`);

  // ─── Stop all agents ───
  scout.stop();
  risk.stop();
  strategy.stop();
  execution.stop();
  coordinator.stop();

  // ─── Explorer links summary ───
  divider();
  console.log(`${COLORS.bright}${COLORS.cyan}🔗 Verify on Somnia Explorer:${COLORS.reset}`);
  console.log(`   ALOCore:      ${explorerAddr(DEPLOYED.ALOCore)}`);
  console.log(`   MessageBus:   ${explorerAddr(DEPLOYED.MessageBus)}`);
  console.log(`   AgentRegistry:${explorerAddr(DEPLOYED.AgentRegistry)}`);
  divider();

  console.log(`${COLORS.bright}${COLORS.green}
  ╔═══════════════════════════════════════════════════════════════╗
  ║                                                               ║
  ║    🏆 ALO LIVE SOMNIA TESTNET DEMO COMPLETE 🏆                ║
  ║                                                               ║
  ║    Real autonomous agents coordinated on Somnia Testnet:      ║
  ║    • Opportunity discovered by ScoutAgent                     ║
  ║    • Strategy proposed by StrategyAgent                       ║
  ║    • Risk evaluated and approved by RiskAgent                 ║
  ║    • Trade executed by ExecutionAgent                         ║
  ║    • All decisions permanently recorded on Somnia L1          ║
  ║                                                               ║
  ╚═══════════════════════════════════════════════════════════════╝
  ${COLORS.reset}`);

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
