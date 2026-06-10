/**
 * ═══════════════════════════════════════════════════════════════════
 *  ALO — Fund Agent Wallets Script
 * ═══════════════════════════════════════════════════════════════════
 *  Distributes STT from the deployer wallet to each of the 5 agent
 *  wallets so they can submit on-chain transactions (emit signals,
 *  propose strategies, approve risk, execute trades).
 *
 *  Run with:
 *    npx hardhat run scripts/fund-agents.ts --network somnia
 *    or
 *    npx ts-node scripts/fund-agents.ts [amount]
 * ═══════════════════════════════════════════════════════════════════
 */

import { JsonRpcProvider, Wallet, parseEther, formatEther } from "ethers";
import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function main(): Promise<void> {
  let targetAmountStr = process.argv[2];
  
  if (!targetAmountStr) {
    targetAmountStr = await askQuestion("How much STT should each agent be funded to? (e.g., 2.0): ");
  }

  if (!targetAmountStr || isNaN(Number(targetAmountStr))) {
    throw new Error("Invalid amount provided.");
  }

  const TARGET_BALANCE = parseEther(targetAmountStr);

  const rpcUrl      = process.env.SOMNIA_RPC_URL || "https://dream-rpc.somnia.network";
  const provider    = new JsonRpcProvider(rpcUrl);
  const deployerKey = requireEnv("PRIVATE_KEY");
  const deployer    = new Wallet(deployerKey, provider);

  const deployerBal = await provider.getBalance(deployer.address);
  console.log(`\n🏦 Deployer: ${deployer.address}`);
  console.log(`   Balance:  ${formatEther(deployerBal)} STT\n`);

  const agentKeys: { name: string; key: string }[] = [
    { name: "ScoutAgent",       key: requireEnv("SCOUT_PRIVATE_KEY") },
    { name: "RiskAgent",        key: requireEnv("RISK_PRIVATE_KEY") },
    { name: "StrategyAgent",    key: requireEnv("STRATEGY_PRIVATE_KEY") },
    { name: "ExecutionAgent",   key: requireEnv("EXECUTION_PRIVATE_KEY") },
    { name: "CoordinatorAgent", key: requireEnv("COORDINATOR_PRIVATE_KEY") },
  ];

  console.log(`📤 Topping up 5 agents to ${formatEther(TARGET_BALANCE)} STT...\n`);

  let totalNeeded = 0n;
  const topups = [];

  for (const agent of agentKeys) {
    const wallet  = new Wallet(agent.key, provider);
    const address = wallet.address;
    const current = await provider.getBalance(address);

    if (current < TARGET_BALANCE) {
      const diff = TARGET_BALANCE - current;
      totalNeeded += diff;
      topups.push({ agent, address, diff, current });
    } else {
      console.log(`✅ ${agent.name.padEnd(18)} ${address}  already has ${formatEther(current)} STT`);
    }
  }

  if (topups.length > 0) {
    if (deployerBal < totalNeeded) {
      throw new Error(`Insufficient deployer balance. Need ${formatEther(totalNeeded)} STT for top-ups, have ${formatEther(deployerBal)} STT.`);
    }

    for (const topup of topups) {
      const tx = await deployer.sendTransaction({
        to: topup.address,
        value: topup.diff,
      });

      process.stdout.write(`⏳ ${topup.agent.name.padEnd(18)} ${topup.address}  sending ${formatEther(topup.diff)} STT...`);
      await tx.wait();
      
      const after = await provider.getBalance(topup.address);
      console.log(`  ✅  new balance: ${formatEther(after)} STT`);
    }
  }

  const finalBal = await provider.getBalance(deployer.address);
  console.log(`\n💰 Deployer remaining balance: ${formatEther(finalBal)} STT`);
  console.log(`\n✅ All agent wallets funded! Run: npm run demo:somnia\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
