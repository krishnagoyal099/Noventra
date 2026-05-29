import { Contract, Signer, ethers } from "ethers";

export class RiskAgent {
    constructor(
        private signer: Signer,
        private messageBus: Contract,
        private aloCore: Contract
    ) {}

    start() {
        console.log("[RiskAgent] 🛡️  Listening for opportunity signals...");
        this.messageBus.on("SignalSent", async (from: string, signalType: string, data: string) => {
            if (signalType === "OPPORTUNITY_FOUND") {
                console.log("[RiskAgent] 📡 Received opportunity signal. Evaluating...");
                const [apy] = ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], data);
                
                // Hardcoded safety parameter: APY < 100%
                let approved = apy < 100n;
                
                // Randomly simulate a "Risk Rejection" for demo purposes
                if (Math.random() < 0.2) {
                    console.log("[RiskAgent] ⚠️ Random risk anomaly detected. Rejecting.");
                    approved = false;
                }

                console.log(`[RiskAgent] ✅ Risk evaluation complete. Approved: ${approved}`);
                const tx = await this.aloCore.approveStrategy(approved);
                await tx.wait();
            }
        });
    }
}