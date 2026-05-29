import { Contract, Signer, ethers } from "ethers";

export class StrategyAgent {
    constructor(
        private signer: Signer,
        private messageBus: Contract,
        private aloCore: Contract,
        private mockYieldAddress: string
    ) {}

    start() {
        console.log("[StrategyAgent] 🧠 Listening for signals to formulate strategies...");
        this.messageBus.on("SignalSent", async (from: string, signalType: string, data: string) => {
            if (signalType === "OPPORTUNITY_FOUND") {
                console.log("[StrategyAgent] 📊 Formulating allocation strategy...");
                const allocation = ethers.parseEther("50000"); // Allocate 50k
                
                console.log(`[StrategyAgent] 📝 Proposing strategy: Move ${ethers.formatEther(allocation)} to YieldSource.`);
                const params = [this.mockYieldAddress, allocation]; // Struct as tuple
                const tx = await this.aloCore.proposeStrategy(params);
                await tx.wait();
            }
        });
    }
}