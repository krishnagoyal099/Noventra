/**
 * ═══════════════════════════════════════════════════════════════════
 *  ALO — ScoutAgent
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Role: The swarm's sensory system. Continuously scans DeFi pools
 *  for yield spikes, liquidity shifts, and anomalies.
 *
 *  Autonomy Pattern:
 *  ────────────────
 *  Runs on a TIMER (setInterval). Every tick, it queries on-chain
 *  data and INDEPENDENTLY decides whether to emit a signal.
 *  No human triggers it — it IS the trigger for the entire pipeline.
 *
 *  Somnia Integration:
 *  ──────────────────
 *  - Reads on-chain state from MockYieldSource
 *  - Emits OPPORTUNITY_FOUND signals via MessageBus
 *  - Signals are stored on-chain for audit trail
 *  - Other agents react to these signals autonomously
 * ═══════════════════════════════════════════════════════════════════
 */

import { BaseAgent } from "./BaseAgent";
import { AgentRole, OpportunityData } from "../interfaces/types";
import { Signer, Contract, AbiCoder } from "ethers";

export class ScoutAgent extends BaseAgent {
  private scanInterval: NodeJS.Timeout | null = null;
  private scanIntervalMs: number;
  private apyThreshold: bigint;
  private yieldSources: Contract[]; // Multiple yield sources to monitor
  private lastKnownAPYs: Map<string, bigint> = new Map();
  private abiCoder: AbiCoder;

  constructor(
    signer: Signer,
    registry: Contract,
    messageBus: Contract,
    core: Contract,
    yieldSources: Contract[],
    apyThreshold: bigint = 100n, // 1% minimum APY to trigger
    scanIntervalMs: number = 5000 // Scan every 5 seconds for demo
  ) {
    super("ScoutAgent", AgentRole.SCOUT, signer, registry, messageBus, core);
    this.yieldSources = yieldSources;
    this.apyThreshold = apyThreshold;
    this.scanIntervalMs = scanIntervalMs;
    this.abiCoder = new AbiCoder();
  }

  start(): void {
    this.running = true;
    this.log("Starting autonomous scanning loop...");
    this.log(`APY threshold: ${this.apyThreshold} bps | Scan interval: ${this.scanIntervalMs}ms`);

    // Perform initial scan
    this.scan();

    // Set up recurring scan
    this.scanInterval = setInterval(() => this.scan(), this.scanIntervalMs);
    this.logSuccess("Scanning loop active — watching for yield opportunities");
  }

  stop(): void {
    this.running = false;
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    this.log("Scanning loop stopped");
  }

  private async scan(): Promise<void> {
    if (!this.running) return;

    for (const yieldSource of this.yieldSources) {
      try {
        const poolAddr = await yieldSource.getAddress();
        const currentAPY: bigint = await yieldSource.getCurrentAPY();
        const previousAPY = this.lastKnownAPYs.get(poolAddr) || 0n;

        this.log(`Scanning pool ${poolAddr.slice(0, 10)}... | APY: ${currentAPY} bps`);

        // ─── Decision Logic: Is this an opportunity? ───
        const isOpportunity =
          currentAPY >= this.apyThreshold && // APY exceeds threshold
          currentAPY > previousAPY; // APY is increasing (momentum)

        if (isOpportunity) {
          await this.emitOpportunity(poolAddr, currentAPY, yieldSource);
        }

        // Update known APY
        this.lastKnownAPYs.set(poolAddr, currentAPY);
      } catch (error: any) {
        this.logError(`Scan failed for pool: ${error.message}`);
      }
    }
  }

  private async emitOpportunity(
    poolAddress: string,
    apy: bigint,
    yieldSource: Contract
  ): Promise<void> {
    try {
      this.logAction(`🔥 OPPORTUNITY DETECTED! Pool ${poolAddress.slice(0, 10)}... APY=${apy} bps`);

      // Get pool name if available
      let poolName = "Unknown Pool";
      try {
        const info = await yieldSource.getPoolInfo();
        poolName = info[0];
      } catch { /* fallback */ }

      // Encode opportunity data for on-chain transmission
      const opportunityData: OpportunityData = {
        poolAddress,
        apy,
        detectedAt: BigInt(Math.floor(Date.now() / 1000)),
        poolName,
      };

      const dataPayload = this.abiCoder.encode(
        ["address", "uint256", "uint256", "string"],
        [opportunityData.poolAddress, opportunityData.apy, opportunityData.detectedAt, opportunityData.poolName]
      );

      // Emit signal on the MessageBus — this is how agents "talk" on Somnia
      const tx = await this.messageBus.connect(this.wallet).emitSignal(
        "OPPORTUNITY_FOUND",
        dataPayload,
        { 
          gasLimit: 5_000_000, 
          maxFeePerGas: 7000000000n, 
          maxPriorityFeePerGas: 7000000000n 
        }
      );
      const receipt = await tx.wait();

      this.logSuccess(`Signal emitted! TxHash: ${receipt.hash.slice(0, 16)}...`);
      this.log(`  📊 Pool: ${poolName} | APY: ${apy} bps`);
    } catch (error: any) {
      this.logError(`Failed to emit opportunity signal: ${error.message}`);
    }
  }

  // ─── Add a new yield source to monitor ───
  addYieldSource(yieldSource: Contract): void {
    this.yieldSources.push(yieldSource);
    this.log(`Added new yield source to monitoring list`);
  }
}