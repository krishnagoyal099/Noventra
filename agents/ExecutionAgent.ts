import { Contract, Signer, ethers } from "ethers";

export class ExecutionAgent {
    constructor(
        private signer: Signer,
        private aloCore: Contract,
        private mockDex: Contract,
        private mockDexAddress: string
    ) {}

    start() {
        console.log("[ExecutionAgent] ⚡ Monitoring ALOCore for approved strategies...");
        this.aloCore.on("StrategyApproved", async (approved: boolean) => {
            if (approved) {
                console.log("[ExecutionAgent] 🚀 Strategy approved! Executing trade on DEX...");
                const strategy = await this.aloCore.currentStrategy();
                const amount = strategy[1]; // allocation
                
                const tx = await this.aloCore.executeTrade(this.mockDexAddress, amount);
                await tx.wait();
                
                console.log("[ExecutionAgent] 🧾 Trade executed. Generating immutable receipt...");
                const receipt = [
                    await this.signer.getAddress(),
                    "EXECUTE_TRADE",
                    Math.floor(Date.now() / 1000),
                    ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["Success: 50k routed to YieldSource"])
                ];
                const receiptTx = await this.aloCore.recordReceipt(receipt);
                await receiptTx.wait();
                console.log("[ExecutionAgent] ✅ Receipt permanently recorded on Somnia.");
            }
        });
    }
}