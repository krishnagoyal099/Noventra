import { Contract, Signer } from "ethers";

export class CoordinatorAgent {
    constructor(
        private signer: Signer,
        private registry: Contract,
        private agents: { address: string, role: string }[]
    ) {}

    async bootstrap() {
        console.log("[CoordinatorAgent] 🎛️ Bootstrapping system and registering agents...");
        for (const agent of this.agents) {
            const tx = await this.registry.registerAgent(agent.address, agent.role);
            await tx.wait();
            console.log(`[CoordinatorAgent] 🔗 Registered ${agent.role} at ${agent.address}`);
        }
    }
}