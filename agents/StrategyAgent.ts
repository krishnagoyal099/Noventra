/**
 * ═══════════════════════════════════════════════════════════════════
 *  ALO — StrategyAgent
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Role: The swarm's "brain" — consumes scout signals and composes
 *  allocation strategies.
 *
 *  Autonomy Pattern:
 *  ────────────────
 *  EVENT-DRIVEN. Listens for OPPORTUNITY_FOUND signals on the
 *  MessageBus. When a signal arrives, it independently:
 *  1. Decodes the opportunity data
 *  2. Computes optimal allocation (based on APY, risk limits, etc.)
 *  3. Proposes a strategy on ALOCore
 *
 *  This is agent-to-agent coordination in action:
 *  Scout "speaks" → StrategyAgent "listens and decides"
 *
 *  Somnia Integration:
 *  ──────────────────
 *  - Consumes MessageBus events (on-chain agent messages)
 *  - Writes strategy proposals to ALOCore (on-chain state)
 *  - Every proposal generates a Receipt (on-chain audit trail)
 * ═══════════════════════════════════════════════════════════════════
 */

import { BaseAgent } from "./BaseAgent";
import { AgentRole, OpportunityData } from "../interfaces/types";
import { Signer, Contract, AbiCoder } from "ethers";

export class StrategyAgent extends BaseAgent {
  private maxAllocationPct: number; // Max % of total liquidity per strategy
  private processingLock: boolean = false; // Prevents double-processing
  private abiCoder: AbiCoder;

  constructor(
    signer: Signer,
    registry: Contract,
    messageBus: Contract,
    core: Contract,
    maxAllocationPct: number = 30 // 30% max per strategy
  ) {
    super("StrategyAgent", AgentRole.STRATEGY, signer, registry, messageBus, core);
    this.maxAllocationPct = maxAllocationPct;
    this.abiCoder = new AbiCoder();
  }

  start(): void {
    this.running = true;
    this.log("Starting — listening for OPPORTUNITY_FOUND signals...");

    // Listen for signals from the MessageBus
    // This is the core of agent-to-agent coordination on Somnia:
    // the StrategyAgent REACTS to the ScoutAgent's on-chain messages
    this.messageBus.on("SignalSent", async (signalId: string, from: string, signalType: string, data: string, timestamp: bigint) => {
      if (!this.running) return;
      if (signalType === "OPPORTUNITY_FOUND") {
        await this.handleOpportunity(signalId, from, data);
      }
    });

    this.logSuccess("Listening for scout signals on MessageBus");
  }

  stop(): void {
    this.running = false;
    this.messageBus.removeAllListeners("SignalSent");
    this.log("Stopped listening for signals");
  }

  private async handleOpportunity(
    signalId: string,
    fromAgent: string,
    data: string
  ): Promise<void> {
    // Prevent concurrent processing
    if (this.processingLock) {
      this.logWarning("Already processing an opportunity — skipping");
      return;
    }
    this.processingLock = true;

    try {
      this.logAction(`Received OPPORTUNITY_FOUND signal from ${fromAgent.slice(0, 10)}...`);

      // Decode the opportunity data
      const decoded = this.abiCoder.decode(
        ["address", "uint256", "uint256", "string"],
        data
      );
      const poolAddress = decoded[0] as string;
      const apy = decoded[1] as bigint;
      const detectedAt = decoded[2] as bigint;
      const poolName = decoded[3] as string;

      this.log(`📊 Decoded opportunity: Pool=${poolName}, APY=${apy} bps`);

      // ─── Strategy Computation ───
      // This is the "brain" logic — how much to allocate?
      const totalLiquidity: bigint = await this.core.totalLiquidity();
      const allocation = this.computeAllocation(totalLiquidity, apy);

      this.log(`🧮 Computed allocation: ${allocation} units (${(Number(allocation * 10000n / totalLiquidity)) / 100}% of total liquidity)`);
      this.log(`   Rationale: APY=${apy} bps, Risk-adjusted allocation`);

      // ─── Propose Strategy on ALOCore ───
      // This creates an on-chain strategy proposal AND a receipt
      const tx = await this.core.connect(this.wallet).proposeStrategy({
        targetPool: poolAddress,
        allocation: allocation,
        expectedAPY: apy,
        rationale: `Yield opportunity: ${poolName} at ${apy} bps APY`,
      }, { 
        gasLimit: 9_000_000,
        maxFeePerGas: 7000000000n,
        maxPriorityFeePerGas: 7000000000n
      });
      const receipt = await tx.wait();

      this.logSuccess(`Strategy PROPOSED on ALOCore! TxHash: ${receipt.hash.slice(0, 16)}...`);

      // Consume the signal on the MessageBus to mark it as processed
      try {
        const consumeTx = await this.messageBus.connect(this.wallet).consumeSignal(signalId);
        await consumeTx.wait();
        this.log(`Signal consumed: ${signalId.slice(0, 10)}...`);
      } catch {
        this.logWarning("Could not consume signal (may already be consumed)");
      }
    } catch (error: any) {
      this.logError(`Failed to handle opportunity: ${error.message}`);
    } finally {
      this.processingLock = false;
    }
  }

  /**
   * ─── Allocation Computation ───
   * Simple but demonstrative strategy:
   * - Higher APY → higher allocation (capped)
   * - Never exceeds maxAllocationPct of total liquidity
   *
   * In production, this would use sophisticated optimization
   * (Kelly criterion, mean-variance, etc.)
   */
  private computeAllocation(totalLiquidity: bigint, apy: bigint): bigint {
    // Scale allocation by APY (higher APY = more allocation)
    // allocation = totalLiquidity * min(apy / 1000, maxPct) / 100
    const apyFactor = apy / 1000n; // e.g., APY 500 → factor 0.5
    const cappedFactor = apyFactor > BigInt(this.maxAllocationPct)
      ? BigInt(this.maxAllocationPct)
      : apyFactor;

    const allocation = (totalLiquidity * cappedFactor) / 100n;

    // Ensure minimum allocation
    return allocation > 0n ? allocation : totalLiquidity / 10n; // 10% minimum
  }
}