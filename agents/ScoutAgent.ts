import { Contract, Signer, ethers } from "ethers";

export class ScoutAgent {
    constructor(
        private signer: Signer,
        private messageBus: Contract,
        private mockYield: Contract
    ) {}

    start() {
        console.log("[ScoutAgent] 🟢 Started scanning DeFi yields...");
        setInterval(async () => {
            try {
                const apy = await this.mockYield.getCurrentAPY();
                // Threshold: 10% APY
                if (apy > 10n) { 
                    console.log(`[ScoutAgent] 🔥 Opportunity found! APY: ${apy}%`);
                    const data = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [apy]);
                    const tx = await this.messageBus.emitSignal("OPPORTUNITY_FOUND", data);
                    await tx.wait();
                }
            } catch (e) { /* Handle network delays */ }
        }, 3000); // Scan every 3s for demo speed
    }
}