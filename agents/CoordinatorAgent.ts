/**
 * ═══════════════════════════════════════════════════════════════════
 *  ALO — CoordinatorAgent
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Role: The swarm's meta-agent. Bootstraps the system, enforces
 *  global constraints, and resolves conflicts.
 *
 *  Autonomy Pattern:
 *  ────────────────
 *  Unlike other agents that react to data/events, the Coordinator
 *  has a MANAGEMENT role. It:
 *  1. Registers all agents in the AgentRegistry
 *  2. Sets initial system parameters
 *  3. Can adjust global constraints (max allocation, etc.)
 *  4. Monitors system health
 *
 *  Somnia Integration:
 *  ──────────────────
 *  - Owns the ALOCore deployment (or is the primary admin)
 *  - Manages agent permissions on-chain
 *  - Its actions are also recorded as receipts
 * ═══════════════════════════════════════════════════════════════════
 */

import { BaseAgent } from "./BaseAgent";
import { AgentRole, AgentConfig, AgentRoleUint } from "../interfaces/types";
import { Wallet, Contract, Signer } from "ethers";

export class CoordinatorAgent extends BaseAgent {
  private agentConfigs: AgentConfig[];

  constructor(
    signer: Signer,
    registry: Contract,
    messageBus: Contract,
    core: Contract,
    agentConfigs: AgentConfig[]
  ) {
    super("CoordinatorAgent", AgentRole.COORDINATOR, signer, registry, messageBus, core);
    this.agentConfigs = agentConfigs;
  }

  start(): void {
    console.log("[CoordinatorAgent] Coordinator online — system ready for management");
  }

  stop(): void {
    console.log("[CoordinatorAgent] Coordinator offline");
  }

  /**
   * ─── Bootstrap the entire agent swarm ───
   * Registers all agents in the on-chain AgentRegistry.
   * This MUST happen before other agents can interact with ALOCore.
   */
  async bootstrap(): Promise<void> {
    console.log("[CoordinatorAgent] Bootstrapping ALO agent swarm...");

    for (const config of this.agentConfigs) {
      try {
        const agentWallet = new Wallet(config.privateKey);
        const agentAddress = agentWallet.address;
        const numericRole = AgentRoleUint[config.role];

        const isRegistered = await this.registry.isRegisteredAgent(agentAddress);
        if (isRegistered) {
          this.log(`Agent ${config.name} (${agentAddress.slice(0,8)}...) already registered`);
          continue;
        }

        // registerAgent(address, AgentRole enum uint, metadataURI)
        const tx = await this.registry.registerAgent(
          agentAddress,
          numericRole,
          `ipfs://alo-agent-${config.name.toLowerCase()}`
        );
        await tx.wait();

        console.log(`[CoordinatorAgent] ✅ Registered ${config.name} as role ${config.role} | Addr: ${agentAddress.slice(0, 10)}...`);
      } catch (error: any) {
        console.log(`[CoordinatorAgent] ❌ Failed to register ${config.name}: ${error.message}`);
      }
    }

    console.log("[CoordinatorAgent] ✅ All agents registered in AgentRegistry");
  }

  /**
   * ─── Add initial liquidity to the system ───
   */
  async seedLiquidity(amount: bigint): Promise<void> {
    console.log(`[CoordinatorAgent] Seeding system with ${amount} liquidity units...`);
    try {
      const tx = await this.core.addLiquidity(amount);
      await tx.wait();
      const newTotal = await this.core.totalLiquidity();
      console.log(`[CoordinatorAgent] ✅ Liquidity seeded! Total system liquidity: ${newTotal}`);
    } catch (error: any) {
      console.log(`[CoordinatorAgent] ❌ Failed to seed liquidity: ${error.message}`);
    }
  }

  /**
   * ─── Adjust global risk parameters ───
   */
  async setMaxAllocation(pct: number): Promise<void> {
    console.log(`[CoordinatorAgent] Updating max allocation to ${pct}%...`);
    try {
      const tx = await this.core.setMaxAllocationPct(pct * 100); // Convert to basis points
      await tx.wait();
      console.log(`[CoordinatorAgent] ✅ Max allocation updated to ${pct}%`);
    } catch (error: any) {
      console.log(`[CoordinatorAgent] ❌ Failed to update parameters: ${error.message}`);
    }
  }
}