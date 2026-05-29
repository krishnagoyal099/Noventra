/**
 * ═══════════════════════════════════════════════════════════════════
 *  ALO — Deployment Script
 * ═══════════════════════════════════════════════════════════════════
 *  Deploys all ALO contracts to Somnia Agentic L1 (or local node).
 * ═══════════════════════════════════════════════════════════════════
 */

import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying ALO contracts to Somnia Agentic L1...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // ─── 1. Deploy AgentRegistry ───
  console.log("📋 Deploying AgentRegistry...");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log(`   ✅ AgentRegistry deployed to: ${registryAddr}\n`);

  // ─── 2. Deploy MessageBus ───
  console.log("📡 Deploying MessageBus...");
  const MessageBus = await ethers.getContractFactory("MessageBus");
  const messageBus = await MessageBus.deploy(registryAddr);
  await messageBus.waitForDeployment();
  const messageBusAddr = await messageBus.getAddress();
  console.log(`   ✅ MessageBus deployed to: ${messageBusAddr}\n`);

  // ─── 3. Deploy ALOCore ───
  console.log("🧠 Deploying ALOCore...");
  const initialLiquidity = ethers.parseEther("10000"); // 10,000 units
  const ALOCore = await ethers.getContractFactory("ALOCore");
  const core = await ALOCore.deploy(registryAddr, initialLiquidity);
  await core.waitForDeployment();
  const coreAddr = await core.getAddress();
  console.log(`   ✅ ALOCore deployed to: ${coreAddr}`);
  console.log(`   💰 Initial liquidity: ${ethers.formatEther(initialLiquidity)} units\n`);

  // ─── 4. Deploy Mock DeFi Protocols ───
  console.log("🏦 Deploying Mock DeFi Protocols...");
  
  const MockDEX = await ethers.getContractFactory("MockDEX");
  const mockDEX = await MockDEX.deploy();
  await mockDEX.waitForDeployment();
  const mockDEXAddr = await mockDEX.getAddress();
  console.log(`   ✅ MockDEX deployed to: ${mockDEXAddr}`);

  const MockYieldSource = await ethers.getContractFactory("MockYieldSource");
  const yieldPoolA = await MockYieldSource.deploy("Somnia Alpha Pool", 50); // 0.5% APY
  await yieldPoolA.waitForDeployment();
  const yieldPoolAAddr = await yieldPoolA.getAddress();
  console.log(`   ✅ MockYieldSource (Alpha) deployed to: ${yieldPoolAAddr}`);

  const yieldPoolB = await MockYieldSource.deploy("Somnia Beta Pool", 120); // 1.2% APY
  await yieldPoolB.waitForDeployment();
  const yieldPoolBAddr = await yieldPoolB.getAddress();
  console.log(`   ✅ MockYieldSource (Beta) deployed to: ${yieldPoolBAddr}\n`);

  // ─── Summary ───
  console.log("═══════════════════════════════════════════════════");
  console.log("🎉 ALO System Deployment Complete!");
  console.log("═══════════════════════════════════════════════════");
  console.log(`AgentRegistry:   ${registryAddr}`);
  console.log(`MessageBus:      ${messageBusAddr}`);
  console.log(`ALOCore:         ${coreAddr}`);
  console.log(`MockDEX:         ${mockDEXAddr}`);
  console.log(`YieldPool Alpha: ${yieldPoolAAddr}`);
  console.log(`YieldPool Beta:  ${yieldPoolBAddr}`);
  console.log("═══════════════════════════════════════════════════\n");

  return {
    registryAddr,
    messageBusAddr,
    coreAddr,
    mockDEXAddr,
    yieldPoolAAddr,
    yieldPoolBAddr,
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});