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
  AgentRegistry:   "0x2FEAb61eA02604B72D6A7A66D7fc2ca926E9f5E7",
  MessageBus:      "0x599312a994e130f2201D8De2cE2216d2A7848a98",
  ALOCore:         "0x6513684C358cD6d92Ad43225Ad9B8e3B81f01398",
  MockDEX:         "0x6AD7a0e21A997708657FeB019CbE10913AE4165a",
  YieldPoolAlpha:  "0xF9a098ddd8F8176c86e63606875a99668fD56090",
  YieldPoolBeta:   "0xEcFe3093addA39C64E6B55804cdCDF657de2f6E9",
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

function requireEnv(key: string, fallbackKey?: string): string {
  const val = process.env[key] || (fallbackKey ? process.env[fallbackKey] : undefined);
  if (!val) throw new Error(`Missing required env var: ${key}${fallbackKey ? ` or ${fallbackKey}` : ''}. Check your .env file or Railway variables.`);
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
  const deployerKey     = requireEnv("PRIVATE_KEY", "DEPLOYER_PRIVATE_KEY");
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
  console.log(`\n  ${COLORS.cyan}💰 System Liquidity: ${hardhatEthers.formatEther(totalLiquidity)} units${COLORS.reset}`);

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
    100n,   // APY threshold: 1% (100 bps)
    30000,  // Scan every 30 seconds to prevent nonce overlaps
    mockDEX // Enable JIT mempool monitoring
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
  coordinator.start();

  divider();

  banner("🚀 Agents are now LIVE and listening indefinitely...");
  console.log(`${COLORS.cyan}Ready to receive intents from the frontend dashboard!${COLORS.reset}`);

  // ─── Wallet Balance Monitor ───
  // Runs every 10 minutes. Warns if any agent wallet drops below 0.5 STT.
  // On Railway/Render, this output appears in the deployment logs.
  const LOW_BALANCE_THRESHOLD = hardhatEthers.parseEther("0.5");
  const monitorWallets = async () => {
    const wallets = [
      { name: "Scout",       signer: scoutSigner },
      { name: "Risk",        signer: riskSigner },
      { name: "Strategy",    signer: strategySigner },
      { name: "Execution",   signer: executionSigner },
      { name: "Coordinator", signer: coordinatorSigner },
    ];
    for (const w of wallets) {
      const bal = await provider.getBalance(w.signer.address);
      if (bal < LOW_BALANCE_THRESHOLD) {
        console.warn(
          `${COLORS.yellow}⚠️  [WALLET MONITOR] ${w.name} wallet LOW BALANCE: ` +
          `${hardhatEthers.formatEther(bal)} STT — top up from Somnia faucet!` +
          `${COLORS.reset}`
        );
      }
    }
  };

  // Run immediately on start, then every 10 minutes
  monitorWallets().catch(() => {});
  const monitorInterval = setInterval(() => monitorWallets().catch(() => {}), 10 * 60 * 1000);

  // ─── Graceful Shutdown ───
  const shutdown = (signal: string) => {
    console.log(`\n${COLORS.yellow}Received ${signal}. Shutting down agents gracefully...${COLORS.reset}`);
    clearInterval(monitorInterval);
    scout.stop();
    risk.stop();
    strategy.stop();
    execution.stop();
    coordinator.stop();
    console.log(`${COLORS.green}✅ All agents stopped. Exiting.${COLORS.reset}`);
    process.exit(0);
  };

  process.on("SIGINT",  () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Keep process alive
  await new Promise(() => {});
}

main().catch((error) => {
  console.error(`${COLORS.red}💥 FATAL: Agent swarm crashed:${COLORS.reset}`, error);
  // Exit with code 1 — Railway/Render will auto-restart the process
  process.exit(1);
});
