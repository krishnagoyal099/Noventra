/**
 * ═══════════════════════════════════════════════════════════════════
 *  ALO — CoordinatorAgent (DAG Enforcer & Deadlock Breaker)
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Role: The swarm's meta-agent. Bootstraps the system, enforces
 *  global constraints, and resolves conflicts.
 *
 *  Upgrade: Multi-Agent Consensus & State Synchronization
 *  (Park et al. / Stanford HAI 2024)
 *
 *  In LLM-driven, intent-based agent swarms, agents can hallucinate,
 *  drop offline, or enter infinite negotiation loops. The Coordinator
 *  now acts as the Meta-Agent. It:
 *  1. Bootstraps and registers all agents (original role)
 *  2. Actively monitors the ALOCore state machine on a timer
 *  3. Detects strategies stuck in PROPOSED or APPROVED states
 *  4. Calls overrideStrategy() to break deadlocks and restore DAG flow
 *
 *  Autonomy Pattern:
 *  ────────────────
 *  TIMER-DRIVEN (DAG enforcement loop) + ONE-SHOT (bootstrap).
 *  The monitoring loop runs independently of all other agents —
 *  it is the only agent that can override the state machine.
 *
 *  Somnia Integration:
 *  ──────────────────
 *  - Owns the AgentRegistry (registers all other agents)
 *  - Calls ALOCore.overrideStrategy() — the on-chain circuit breaker
 *  - Every intervention generates a DEADLOCK_OVERRIDE Receipt
 *  - Judges can inspect these receipts to see self-healing in action
 * ═══════════════════════════════════════════════════════════════════
 */

import { BaseAgent } from "./BaseAgent";
import { AgentRole, AgentConfig, AgentRoleUint } from "../interfaces/types";
import { Wallet, Contract, Signer } from "ethers";

export class CoordinatorAgent extends BaseAgent {
  private agentConfigs: AgentConfig[];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private monitoringIntervalMs: number;

  /**
   * Wall-clock time (ms) a strategy may stay in PROPOSED/APPROVED before the
   * Coordinator deems it a deadlock and calls overrideStrategy().
   *
   * Default: 45 s — generous enough for Somnia testnet block times,
   * tight enough to catch a genuinely offline agent within the demo window.
   */
  private deadlockTimeoutMs: number;

  /** Tracks the highest strategy ID seen so far to avoid re-checking old ones. */
  private lastKnownStrategyCount: number = 0;

  constructor(
    signer: Signer,
    registry: Contract,
    messageBus: Contract,
    core: Contract,
    agentConfigs: AgentConfig[],
    monitoringIntervalMs: number = 8000,  // Poll every 8 s
    deadlockTimeoutMs: number = 45000     // 45 s deadlock threshold
  ) {
    super("CoordinatorAgent (Meta-Agent)", AgentRole.COORDINATOR, signer, registry, messageBus, core);
    this.agentConfigs         = agentConfigs;
    this.monitoringIntervalMs = monitoringIntervalMs;
    this.deadlockTimeoutMs    = deadlockTimeoutMs;
  }

  start(): void {
    this.running = true;
    this.log("Starting DAG Enforcement & Deadlock Monitoring...");
    this.log(`⏱️  Agent response timeout: ${this.deadlockTimeoutMs / 1000}s | Poll interval: ${this.monitoringIntervalMs / 1000}s`);

    // Initialize cursor to current count so we don't intervene in old testnet runs
    this.core.getStrategyCount().then((c: bigint) => {
      this.lastKnownStrategyCount = Number(c);
    }).catch(() => {});

    // Start the monitoring loop — runs independently, forever, until stop() is called.
    this.monitoringInterval = setInterval(
      () => this.enforceDAGFlow(),
      this.monitoringIntervalMs
    );

    this.logSuccess("Coordinator online — actively watching the swarm for deadlocks.");
  }

  stop(): void {
    this.running = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.log("Coordinator offline");
  }

  // ═══════════════════════════════════════════════════════════════
  //  BOOTSTRAP: Register all agents in the on-chain AgentRegistry
  // ═══════════════════════════════════════════════════════════════

  /**
   * Registers every agent config in the on-chain AgentRegistry.
   * Must be called before any other agent can interact with ALOCore.
   * Idempotent — skips already-registered agents safely.
   */
  async bootstrap(): Promise<void> {
    this.logAction("Bootstrapping ALO agent swarm...");

    for (const config of this.agentConfigs) {
      try {
        const agentWallet  = new Wallet(config.privateKey);
        const agentAddress = agentWallet.address;
        const numericRole  = AgentRoleUint[config.role];

        const isRegistered = await this.registry.isRegisteredAgent(agentAddress);
        if (isRegistered) {
          this.log(`Agent ${config.name} (${agentAddress.slice(0, 8)}...) already registered — skipping`);
          continue;
        }

        const tx = await this.registry.registerAgent(
          agentAddress,
          numericRole,
          `ipfs://alo-agent-${config.name.toLowerCase()}`
        );
        await tx.wait();

        this.logSuccess(
          `Registered ${config.name} as ${config.role} | Addr: ${agentAddress.slice(0, 10)}...`
        );
      } catch (error: any) {
        this.logError(`Failed to register ${config.name}: ${error.message}`);
      }
    }

    this.logSuccess("All agents registered in AgentRegistry");
  }

  // ═══════════════════════════════════════════════════════════════
  //  DAG ENFORCEMENT: Detect & Break Deadlocks
  // ═══════════════════════════════════════════════════════════════

  /**
   * Core monitoring loop — called on every tick of `monitoringInterval`.
   *
   * Scans all strategies newer than the last known count. For each one
   * stuck in PROPOSED or APPROVED beyond `deadlockTimeoutMs`, triggers
   * an on-chain override intervention.
   *
   * State constants (from ALOCore.StrategyState):
   *   NONE=0, PROPOSED=1, APPROVED=2, REJECTED=3, EXECUTED=4, FAILED=5
   */
  private async enforceDAGFlow(): Promise<void> {
    if (!this.running) return;

    try {
      const strategyCount = Number(await this.core.getStrategyCount());
      const now           = Date.now();

      for (let sid = this.lastKnownStrategyCount + 1; sid <= strategyCount; sid++) {
        const strategy = await this.core.getStrategy(sid);
        const state    = Number(strategy.state);

        // Only PROPOSED (1) or APPROVED (2) can deadlock — all other states are terminal
        if (state !== 1 && state !== 2) continue;

        // proposedAt is a Solidity block.timestamp (seconds). Convert to ms for comparison.
        const proposedAtMs  = Number(strategy.proposedAt) * 1000;
        const timeElapsedMs = now - proposedAtMs;

        if (timeElapsedMs > this.deadlockTimeoutMs) {
          await this.interveneDeadlock(sid, state, timeElapsedMs);
        } else {
          const remaining = Math.round((this.deadlockTimeoutMs - timeElapsedMs) / 1000);
          this.log(
            `Strategy #${sid} in ${state === 1 ? "PROPOSED" : "APPROVED"} — ${remaining}s until deadlock threshold`
          );
        }
      }

      // Advance cursor so we don't re-check finalized strategies each tick
      this.lastKnownStrategyCount = strategyCount;
    } catch (error: any) {
      this.logError(`DAG enforcement check failed: ${error.message}`);
    }
  }

  /**
   * ─── The Circuit Breaker: Override a stuck strategy on-chain ───
   *
   * Calls ALOCore.overrideStrategy(), which:
   *   - Transitions the strategy to FAILED
   *   - Records a DEADLOCK_OVERRIDE Receipt (permanently on-chain)
   *   - Emits StrategyEvaluated(approved=false) to unblock downstream listeners
   *
   * @param strategyId   The stuck strategy's ID
   * @param stuckState   Numeric state (1=PROPOSED, 2=APPROVED)
   * @param timeElapsedMs How long it has been stuck (for the reason string)
   */
  private async interveneDeadlock(
    strategyId: number,
    stuckState: number,
    timeElapsedMs: number
  ): Promise<void> {
    const stateName = stuckState === 1
      ? "PROPOSED (Risk agent unresponsive)"
      : "APPROVED (Execution solver unresponsive)";
    const secondsStuck = Math.round(timeElapsedMs / 1000);

    this.logError(`🛑 DEADLOCK DETECTED — Strategy #${strategyId}`);
    this.log(`   Stuck in:   ${stateName}`);
    this.log(`   Time stuck: ${secondsStuck}s (threshold: ${this.deadlockTimeoutMs / 1000}s)`);
    this.logAction(`⚡ Intervening — calling ALOCore.overrideStrategy()...`);

    try {
      const reason = `Meta-Agent Override: Strategy #${strategyId} stuck in ${stateName} for ${secondsStuck}s, exceeding ${this.deadlockTimeoutMs / 1000}s timeout. DAG flow restored.`;

      const tx = await this.core.connect(this.wallet).overrideStrategy(
        strategyId,
        reason,
        {
          gasLimit:             5_000_000,
          maxFeePerGas:         7000000000n,
          maxPriorityFeePerGas: 7000000000n,
        }
      );
      await tx.wait();

      this.logSuccess(
        `Strategy #${strategyId} forcefully resolved. DEADLOCK_OVERRIDE Receipt recorded on Somnia.`
      );
      this.log(`📜 Judges can inspect this Receipt to verify the self-healing intervention.`);
    } catch (error: any) {
      this.logError(`Failed to override strategy #${strategyId}: ${error.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  GLOBAL PARAMETER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  /**
   * Seeds the ALOCore with an initial liquidity pool.
   * @param amount Raw liquidity units to add
   */
  async seedLiquidity(amount: bigint): Promise<void> {
    this.logAction(`Seeding system with ${amount} liquidity units...`);
    try {
      const tx = await this.core.addLiquidity(amount);
      await tx.wait();
      const newTotal = await this.core.totalLiquidity();
      this.logSuccess(`Liquidity seeded! Total system liquidity: ${newTotal}`);
    } catch (error: any) {
      this.logError(`Failed to seed liquidity: ${error.message}`);
    }
  }

  /**
   * Updates the global max allocation cap in ALOCore.
   * @param pct Percentage (0–100). Internally converted to basis points.
   */
  async setMaxAllocation(pct: number): Promise<void> {
    this.logAction(`Updating max allocation to ${pct}%...`);
    try {
      const tx = await this.core.setMaxAllocationPct(pct * 100); // → basis points
      await tx.wait();
      this.logSuccess(`Max allocation updated to ${pct}%`);
    } catch (error: any) {
      this.logError(`Failed to update max allocation: ${error.message}`);
    }
  }
}