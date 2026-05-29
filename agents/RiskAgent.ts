/**
 * ═══════════════════════════════════════════════════════════════════
 *  ALO — RiskAgent
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Role: The swarm's immune system. Evaluates proposed strategies
 *  for risk and approves or rejects them.
 *
 *  Autonomy Pattern:
 *  ────────────────
 *  EVENT-DRIVEN. Listens for StrategyProposed events on ALOCore.
 *  When a strategy is proposed, it independently evaluates risk
 *  based on on-chain data and its own risk model.
 *
 *  This demonstrates the "checks and balances" of agent systems:
 *  the StrategyAgent proposes, but the RiskAgent has VETO POWER.
 *
 *  Somnia Integration:
 *  ──────────────────
 *  - Reads strategy data from ALOCore (on-chain state)
 *  - Records approval/rejection as on-chain Receipts
 *  - Its decision is IMMUTABLE — once rejected, a strategy cannot
 *    be executed, even by the ExecutionAgent
 * ═══════════════════════════════════════════════════════════════════
 */

import { BaseAgent } from "./BaseAgent";
import { AgentRole, RiskAssessment } from "../interfaces/types";
import { Signer, Contract } from "ethers";

export class RiskAgent extends BaseAgent {
  private maxAcceptableAPY: bigint; // Reject if APY is suspiciously high
  private maxDrawdownPct: number; // Maximum acceptable drawdown
  private demoRejectionRate: number; // For demo: probability of random rejection
  private processedStrategies: Set<number> = new Set(); // Prevent double-processing

  constructor(
    signer: Signer,
    registry: Contract,
    messageBus: Contract,
    core: Contract,
    maxAcceptableAPY: bigint = 10000n, // 100% APY max (anything higher is suspicious)
    maxDrawdownPct: number = 20, // 20% max drawdown
    demoRejectionRate: number = 0.0 // 0% rejection for reliable demo; increase to show rejections
  ) {
    super("RiskAgent", AgentRole.RISK, signer, registry, messageBus, core);
    this.maxAcceptableAPY = maxAcceptableAPY;
    this.maxDrawdownPct = maxDrawdownPct;
    this.demoRejectionRate = demoRejectionRate;
  }

  start(): void {
    this.running = true;
    this.log("Starting — monitoring for proposed strategies...");
    this.log(`Risk params: Max APY=${this.maxAcceptableAPY} bps | Max drawdown=${this.maxDrawdownPct}%`);

    // Listen for StrategyProposed events on ALOCore
    this.core.on("StrategyProposed", async (strategyId: bigint, proposer: string, targetPool: string, allocation: bigint, expectedAPY: bigint) => {
      if (!this.running) return;
      await this.evaluateStrategy(Number(strategyId));
    });

    this.logSuccess("Listening for strategy proposals on ALOCore");
  }

  stop(): void {
    this.running = false;
    this.core.removeAllListeners("StrategyProposed");
    this.log("Stopped monitoring");
  }

  private async evaluateStrategy(strategyId: number): Promise<void> {
    // Prevent double-processing
    if (this.processedStrategies.has(strategyId)) {
      this.logWarning(`Strategy #${strategyId} already evaluated — skipping`);
      return;
    }
    this.processedStrategies.add(strategyId);

    try {
      this.logAction(`Evaluating Strategy #${strategyId}...`);

      // Fetch strategy details from ALOCore
      const strategy = await this.core.getStrategy(strategyId);
      const { targetPool, allocation, expectedAPY, rationale } = strategy.params;

      this.log(`📋 Strategy details:`);
      this.log(`   Target: ${targetPool.slice(0, 10)}... | Allocation: ${allocation} | Expected APY: ${expectedAPY} bps`);
      this.log(`   Rationale: ${rationale}`);

      // ─── Risk Evaluation ───
      const assessment = this.performRiskAssessment(
        expectedAPY,
        allocation,
        await this.core.totalLiquidity()
      );

      this.log(`🔬 Risk Assessment:`);
      this.log(`   Risk Score: ${assessment.riskScore}/100`);
      this.log(`   Max Drawdown: ${assessment.maxDrawdown}%`);
      this.log(`   Verdict: ${assessment.approved ? "✅ APPROVED" : "❌ REJECTED"}`);
      this.log(`   Reason: ${assessment.reason}`);

      // ─── Record Decision on ALOCore ───
      const tx = await this.core
        .connect(this.wallet)
        .approveStrategy(strategyId, assessment.approved, assessment.reason, { 
          gasLimit: 6_000_000,
          maxFeePerGas: 7000000000n,
          maxPriorityFeePerGas: 7000000000n
        });
      const receipt = await tx.wait();

      if (assessment.approved) {
        this.logSuccess(`Strategy #${strategyId} APPROVED on-chain! TxHash: ${receipt.hash.slice(0, 16)}...`);
      } else {
        this.logError(`Strategy #${strategyId} REJECTED on-chain! TxHash: ${receipt.hash.slice(0, 16)}...`);
      }
    } catch (error: any) {
      this.logError(`Failed to evaluate strategy #${strategyId}: ${error.message}`);
    }
  }

  /**
   * ─── Risk Assessment Logic ───
   *
   * Evaluates multiple risk factors:
   * 1. APY reasonableness (too high = likely scam)
   * 2. Allocation size (too large = overexposure)
   * 3. Drawdown estimation
   * 4. Demo random rejection (to show rejection path)
   *
   * In production: bridge risk, depeg signals, MEV analysis, etc.
   */
  private performRiskAssessment(
    expectedAPY: bigint,
    allocation: bigint,
    totalLiquidity: bigint
  ): RiskAssessment {
    let riskScore = 0;
    let reasons: string[] = [];
    let approved = true;

    // Factor 1: APY reasonableness
    if (expectedAPY > this.maxAcceptableAPY) {
      riskScore += 80;
      reasons.push(`APY ${expectedAPY} bps exceeds max ${this.maxAcceptableAPY} bps — likely unsustainable`);
      approved = false;
    } else if (expectedAPY > this.maxAcceptableAPY / 2n) {
      riskScore += 30;
      reasons.push("High APY — elevated risk");
    } else {
      riskScore += 10;
      reasons.push("APY within normal range");
    }

    // Factor 2: Allocation size
    const allocationPct = Number((allocation * 10000n) / totalLiquidity) / 100;
    if (allocationPct > 50) {
      riskScore += 60;
      reasons.push(`Allocation ${allocationPct.toFixed(1)}% exceeds 50% limit`);
      approved = false;
    } else if (allocationPct > 30) {
      riskScore += 20;
      reasons.push("Large allocation — moderate concentration risk");
    } else {
      riskScore += 5;
      reasons.push("Allocation size acceptable");
    }

    // Factor 3: Estimated drawdown
    const estimatedDrawdown = Math.min(
      (Number(expectedAPY) / 100) * 0.3, // Rough estimate: 30% of APY as potential drawdown
      50 // Cap at 50%
    );
    if (estimatedDrawdown > this.maxDrawdownPct) {
      riskScore += 40;
      reasons.push(`Estimated drawdown ${estimatedDrawdown.toFixed(1)}% exceeds ${this.maxDrawdownPct}% limit`);
      approved = false;
    }

    // Factor 4: Demo random rejection (for showcasing the rejection path)
    if (approved && Math.random() < this.demoRejectionRate) {
      approved = false;
      riskScore += 50;
      reasons.push("Random risk rejection (demo simulation)");
    }

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);

    return {
      approved,
      reason: reasons.join("; "),
      riskScore,
      maxDrawdown: estimatedDrawdown,
    };
  }
}