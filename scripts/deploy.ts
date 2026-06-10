import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Deploying ALO contracts to Somnia Agentic L1...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} STT\n`);

  // ─── 1. Deploy AgentRegistry ───
  console.log("Deploying AgentRegistry...");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log(`  AgentRegistry deployed to: ${registryAddr}\n`);

  // ─── 2. Deploy MessageBus ───
  console.log("Deploying MessageBus...");
  const MessageBus = await ethers.getContractFactory("MessageBus");
  const messageBus = await MessageBus.deploy(registryAddr);
  await messageBus.waitForDeployment();
  const messageBusAddr = await messageBus.getAddress();
  console.log(`  MessageBus deployed to: ${messageBusAddr}\n`);

  // ─── 3. Deploy ALOCore ───
  console.log("Deploying ALOCore...");
  const initialLiquidity = ethers.parseEther("10000");
  const ALOCore = await ethers.getContractFactory("ALOCore");
  const core = await ALOCore.deploy(registryAddr, initialLiquidity);
  await core.waitForDeployment();
  const coreAddr = await core.getAddress();
  console.log(`  ALOCore deployed to: ${coreAddr}`);
  console.log(`  Initial liquidity: ${ethers.formatEther(initialLiquidity)} units\n`);

  // ─── 4. Deploy Mock DeFi Protocols ───
  console.log("Deploying Mock DeFi Protocols...");

  const MockDEX = await ethers.getContractFactory("MockDEX");
  const mockDEX = await MockDEX.deploy();
  await mockDEX.waitForDeployment();
  const mockDEXAddr = await mockDEX.getAddress();
  console.log(`  MockDEX deployed to: ${mockDEXAddr}`);

  const MockYieldSource = await ethers.getContractFactory("MockYieldSource");
  const yieldPoolA = await MockYieldSource.deploy("Somnia Alpha Pool", 50);
  await yieldPoolA.waitForDeployment();
  const yieldPoolAAddr = await yieldPoolA.getAddress();
  console.log(`  MockYieldSource (Alpha) deployed to: ${yieldPoolAAddr}`);

  const yieldPoolB = await MockYieldSource.deploy("Somnia Beta Pool", 120);
  await yieldPoolB.waitForDeployment();
  const yieldPoolBAddr = await yieldPoolB.getAddress();
  console.log(`  MockYieldSource (Beta) deployed to: ${yieldPoolBAddr}\n`);

  // ─── Summary ───
  const addresses = {
    network: "somnia",
    chainId: 50312,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    AgentRegistry:   registryAddr,
    MessageBus:      messageBusAddr,
    ALOCore:         coreAddr,
    MockDEX:         mockDEXAddr,
    YieldPoolAlpha:  yieldPoolAAddr,
    YieldPoolBeta:   yieldPoolBAddr,
  };

  console.log("═══════════════════════════════════════════════════");
  console.log("ALO System Deployment Complete!");
  console.log("═══════════════════════════════════════════════════");
  Object.entries(addresses).forEach(([k, v]) => console.log(`${k.padEnd(18)}: ${v}`));
  console.log("═══════════════════════════════════════════════════\n");

  // ─── Persist addresses to deployments/somnia.json ───
  // listen-somnia.ts and the frontend can read from this file.
  const outDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "somnia.json");
  fs.writeFileSync(outFile, JSON.stringify(addresses, null, 2));
  console.log(`Addresses saved to: deployments/somnia.json`);
  console.log(`Next step: npx hardhat run scripts/fund-agents.ts --network somnia\n`);

  return addresses;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});