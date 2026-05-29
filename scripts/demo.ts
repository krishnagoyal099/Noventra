import { ethers } from "hardhat";
import { ScoutAgent } from "../agents/ScoutAgent";
import { RiskAgent } from "../agents/RiskAgent";
import { StrategyAgent } from "../agents/StrategyAgent";
import { ExecutionAgent } from "../agents/ExecutionAgent";
import { CoordinatorAgent } from "../agents/CoordinatorAgent";

async function main() {
    console.log("🚀 Deploying Somnia Agentic L1 Contracts...");
    
    // 1. Deploy Contracts
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    const registry = await AgentRegistry.deploy();
    await registry.waitForDeployment();

    const MessageBus = await ethers.getContractFactory("MessageBus");
    const messageBus = await MessageBus.deploy();
    await messageBus.waitForDeployment();

    const ALOCore = await ethers.getContractFactory("ALOCore");
    const aloCore = await ALOCore.deploy(await registry.getAddress(), await messageBus.getAddress());
    await aloCore.waitForDeployment();

    const MockDEX = await ethers.getContractFactory("MockDEX");
    const mockDex = await MockDEX.deploy();
    await mockDex.waitForDeployment();

    const MockYieldSource = await ethers.getContractFactory("MockYieldSource");
    const mockYield = await MockYieldSource.deploy();
    await mockYield.waitForDeployment();

    console.log("✅ Contracts deployed.\n");

    // 2. Setup Signers for Agents (Simulating distinct agent identities)
    const signers = await ethers.getSigners();
    const scoutSigner = signers[1];
    const riskSigner = signers[2];
    const strategySigner = signers[3];
    const executionSigner = signers[4];
    const coordinatorSigner = signers[0];

    // 3. Register Agents via Coordinator
    const coordinator = new CoordinatorAgent(
        coordinatorSigner,
        registry as any,
        [
            { address: scoutSigner.address, role: "SCOUT" },
            { address: riskSigner.address, role: "RISK" },
            { address: strategySigner.address, role: "STRATEGY" },
            { address: executionSigner.address, role: "EXECUTION" }
        ]
    );
    await coordinator.bootstrap();
    console.log("");

    // 4. Initialize & Start Agents
    const scout = new ScoutAgent(scoutSigner, messageBus.connect(scoutSigner) as any, mockYield.connect(scoutSigner) as any);
    const risk = new RiskAgent(riskSigner, messageBus.connect(riskSigner) as any, aloCore.connect(riskSigner) as any);
    const strategy = new StrategyAgent(strategySigner, messageBus.connect(strategySigner) as any, aloCore.connect(strategySigner) as any, await mockYield.getAddress());
    const execution = new ExecutionAgent(executionSigner, aloCore.connect(executionSigner) as any, mockDex.connect(executionSigner) as any, await mockDex.getAddress());

    scout.start();
    risk.start();
    strategy.start();
    execution.start();

    console.log("\n--- 🌍 Agents Active. Simulating Market Change in 5 seconds... ---\n");
    await new Promise(r => setTimeout(r, 5000));

    // 5. Simulate Market Change (The Catalyst)
    console.log("📈 Simulating APY spike to 500% on YieldSource...");
    const apyTx = await mockYield.setAPY(500);
    await apyTx.wait();

    console.log("\n--- ⏳ Waiting for Agent Conversation to complete... ---\n");
    await new Promise(r => setTimeout(r, 15000)); // Give agents time to react and mine blocks

    // 6. Read Final Receipt (The "Wow" Factor for Judges)
    const receiptCount = await aloCore.getReceiptCount();
    console.log(`\n📊 Total Receipts Recorded on-chain: ${receiptCount}`);
    
    if (receiptCount > 0) {
        const finalReceipt = await aloCore.receipts(receiptCount - 1n);
        console.log("\n================ FINAL ON-CHAIN RECEIPT ================");
        console.log(`Agent:   ${finalReceipt[0]}`);
        console.log(`Action:  ${finalReceipt[1]}`);
        console.log(`Time:    ${new Date(Number(finalReceipt[2]) * 1000).toISOString()}`);
        console.log(`Result:  ${ethers.AbiCoder.defaultAbiCoder().decode(["string"], finalReceipt[3])[0]}`);
        console.log("========================================================\n");
    }

    process.exit(0);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});