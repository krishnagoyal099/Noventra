/**
 * ═══════════════════════════════════════════════════════════════════
 *  ALO — ScoutAgent (JIT Liquidity Predator Edition)
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Role: The swarm's sensory system. Continuously scans DeFi pools
 *  for yield spikes, liquidity shifts, and anomalies.
 *
 *  Upgrade: Just-in-Time (JIT) Liquidity Detection (Wan, Adams 2024)
 *
 *  Traditional scouts passively read APY. ALO's Scout now runs
 *  two parallel detection modes:
 *
 *  MODE 1 — Passive Yield Scanning (original behaviour)
 *  ─────────────────────────────────────────────────────
 *  Polls MockYieldSource on a timer. Emits OPPORTUNITY_FOUND when
 *  APY breaches threshold & is increasing. Powers the StrategyAgent
 *  → RiskAgent → ExecutionAgent pipeline.
 *
 *  MODE 2 — Active JIT Mempool Predator (new)
 *  ──────────────────────────────────────────
 *  Listens for LargeSwapPending events on MockDEX (our on-chain
 *  mempool emulator). When a whale trade is pending, the Scout
 *  calculates the concentrated tick range for JIT liquidity
 *  deployment and emits JIT_OPPORTUNITY_FOUND. Capital can be
 *  deployed for exactly 1 block, capturing the fee with zero
 *  impermanent loss exposure.
 *
 *  Somnia Integration:
 *  ──────────────────
 *  - Reads on-chain state from MockYieldSource (passive)
 *  - Subscribes to MockDEX.LargeSwapPending events (JIT)
 *  - Emits OPPORTUNITY_FOUND / JIT_OPPORTUNITY_FOUND via MessageBus
 *  - Signals are stored on-chain for the full audit trail
 * ═══════════════════════════════════════════════════════════════════
 */

import { BaseAgent } from "./BaseAgent";
import { AgentRole, OpportunityData } from "../interfaces/types";
import { Signer, Contract, AbiCoder } from "ethers";

export class ScoutAgent extends BaseAgent {
  private scanInterval: NodeJS.Timeout | null = null;
  private scanIntervalMs: number;
  private apyThreshold: bigint;
  private yieldSources: Contract[];
  private mockDEX: Contract | null; // Optional: enables JIT mode when provided
  private lastKnownAPYs: Map<string, bigint> = new Map();
  private abiCoder: AbiCoder;

  /**
   * @param signer          Agent wallet signer
   * @param registry        AgentRegistry contract
   * @param messageBus      MessageBus contract (for emitting signals)
   * @param core            ALOCore contract
   * @param yieldSources    Array of MockYieldSource contracts to monitor
   * @param apyThreshold    Minimum APY (bps) to trigger OPPORTUNITY_FOUND
   * @param scanIntervalMs  Passive scan cadence in milliseconds
   * @param mockDEX         Optional MockDEX — enables JIT mempool monitoring when provided
   */
  constructor(
    signer: Signer,
    registry: Contract,
    messageBus: Contract,
    core: Contract,
    yieldSources: Contract[],
    apyThreshold: bigint = 100n,
    scanIntervalMs: number = 5000,
    mockDEX: Contract | null = null
  ) {
    super("ScoutAgent", AgentRole.SCOUT, signer, registry, messageBus, core);
    this.yieldSources    = yieldSources;
    this.apyThreshold    = apyThreshold;
    this.scanIntervalMs  = scanIntervalMs;
    this.mockDEX         = mockDEX;
    this.abiCoder        = new AbiCoder();
  }

  start(): void {
    this.running = true;
    this.log("Starting dual-mode detection...");
    this.log(`APY threshold: ${this.apyThreshold} bps | Scan interval: ${this.scanIntervalMs}ms`);

    // ── MODE 1: Passive Yield Scanning ──────────────────────────────
    // Perform an immediate scan, then recur on interval.
    this.scan();
    this.scanInterval = setInterval(() => this.scan(), this.scanIntervalMs);
    this.logSuccess("Passive yield scanning active — watching for APY opportunities");

    // ── MODE 2: Active JIT Mempool Monitoring ───────────────────────
    if (this.mockDEX) {
      this.monitorMempoolForJIT();
      this.logSuccess("JIT Mempool Predator active — watching for whale swaps");
    } else {
      this.log("ℹ️  No MockDEX provided — JIT mode disabled (pass mockDEX to enable)");
    }
  }

  stop(): void {
    this.running = false;
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    if (this.mockDEX) {
      this.mockDEX.removeAllListeners("LargeSwapPending");
    }
    this.log("All scanning stopped");
  }

  // ═══════════════════════════════════════════════════════════════
  //  MODE 1: PASSIVE YIELD SCANNING
  // ═══════════════════════════════════════════════════════════════

  /**
   * Polls all registered yield sources. Emits OPPORTUNITY_FOUND when
   * APY meets threshold AND is rising (momentum filter prevents noise).
   */
  private async scan(): Promise<void> {
    if (!this.running) return;

    for (const yieldSource of this.yieldSources) {
      try {
        const poolAddr   = await yieldSource.getAddress();
        const currentAPY: bigint = await yieldSource.getCurrentAPY();
        const previousAPY = this.lastKnownAPYs.get(poolAddr) ?? 0n;

        this.log(`Scanning pool ${poolAddr.slice(0, 10)}... | APY: ${currentAPY} bps`);

        // Decision: APY must clear threshold AND be rising (momentum)
        const isOpportunity =
          currentAPY >= this.apyThreshold &&
          currentAPY > previousAPY;

        if (isOpportunity) {
          await this.emitOpportunity(poolAddr, currentAPY, yieldSource);
        }

        this.lastKnownAPYs.set(poolAddr, currentAPY);
      } catch (error: any) {
        this.logError(`Passive scan failed for pool: ${error.message}`);
      }
    }
  }

  /**
   * ABI-encodes and broadcasts an OPPORTUNITY_FOUND signal on the MessageBus.
   * The StrategyAgent (LLM-powered) will decode and reason about this.
   */
  private async emitOpportunity(
    poolAddress: string,
    apy: bigint,
    yieldSource: Contract
  ): Promise<void> {
    try {
      this.logAction(`🔥 YIELD OPPORTUNITY DETECTED! Pool ${poolAddress.slice(0, 10)}... APY=${apy} bps`);

      let poolName = "Unknown Pool";
      try {
        const info = await yieldSource.getPoolInfo();
        poolName = info[0];
      } catch { /* pool may not expose getPoolInfo — graceful fallback */ }

      const opportunityData: OpportunityData = {
        poolAddress,
        apy,
        detectedAt: BigInt(Math.floor(Date.now() / 1000)),
        poolName,
      };

      const dataPayload = this.abiCoder.encode(
        ["address", "uint256", "uint256", "string"],
        [
          opportunityData.poolAddress,
          opportunityData.apy,
          opportunityData.detectedAt,
          opportunityData.poolName,
        ]
      );

      const tx = await this.messageBus.connect(this.wallet).emitSignal(
        "OPPORTUNITY_FOUND",
        dataPayload,
        {
          gasLimit:             5_000_000,
          maxFeePerGas:         7000000000n,
          maxPriorityFeePerGas: 7000000000n,
        }
      );
      const receipt = await tx.wait();

      this.logSuccess(`OPPORTUNITY_FOUND signal emitted! TxHash: ${receipt.hash.slice(0, 16)}...`);
      this.log(`  📊 Pool: ${poolName} | APY: ${apy} bps`);
    } catch (error: any) {
      this.logError(`Failed to emit opportunity signal: ${error.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  MODE 2: ACTIVE JIT LIQUIDITY DETECTION (Mempool Sniping)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Subscribes to MockDEX.LargeSwapPending — our on-chain stand-in for
   * a real mempool subscription (eth_subscribe pendingTransactions).
   * Each event triggers the JIT analysis and signal emission.
   */
  private monitorMempoolForJIT(): void {
    this.logAction("🌐 Connecting to Mempool (MockDEX) for JIT monitoring...");

    this.mockDEX!.on(
      "LargeSwapPending",
      async (
        trader: string,
        tokenIn: string,
        tokenOut: string,
        amountIn: bigint,
        estimatedFeeCapture: bigint,
        timestamp: bigint
      ) => {
        if (!this.running) return;
        await this.analyzeJITOpportunity(trader, tokenIn, tokenOut, amountIn, estimatedFeeCapture);
      }
    );
  }

  /**
   * When a large swap is detected in the "mempool", this method:
   * 1. Calculates the optimal concentrated tick range (JIT Math)
   * 2. Estimates the fee capture per unit of deployed capital
   * 3. Emits JIT_OPPORTUNITY_FOUND on the MessageBus
   *
   * Tick Math (simplified MVP):
   * In a real Uniswap V3 integration, ticks would be computed from
   * the swap's expected price impact using sqrtPriceX96. Here we
   * use a narrow ±5-tick window centered on the current price,
   * which maximises fee concentration for a single-block deployment.
   *
   * @param trader              Whale's address (for logging)
   * @param tokenIn             Token being sold
   * @param tokenOut            Token being bought
   * @param amountIn            Swap size in raw units
   * @param estimatedFeeCapture Fee revenue available to JIT LP
   */
  private async analyzeJITOpportunity(
    trader: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    estimatedFeeCapture: bigint
  ): Promise<void> {
    try {
      this.logAction(`🚨 JIT ALERT: Whale trade pending in mempool!`);
      this.log(
        `   Whale: ${trader.slice(0, 10)}... | Swap: ${amountIn} units | Est. Fee: ${estimatedFeeCapture}`
      );

      // ─── JIT Math: Concentrated Tick Calculation ───
      // In production: tickLower/Upper = currentTick ± (priceImpactTicks / 2)
      // For MVP: narrow ±5-tick window around the simulated current price (tick 105)
      const currentTick:    number = 105; // Simulated current pool tick
      const halfWindow:     number = 5;   // Narrow range = maximum fee concentration
      const targetTickLower: number = currentTick - halfWindow; // 100
      const targetTickUpper: number = currentTick + halfWindow; // 110
      const blockWindow:     number = 1;  // Deploy for exactly 1 block = zero IL exposure

      // Fee efficiency: how many fee-units per 1000 units of capital deployed
      const feeEfficiencyBps = amountIn > 0n
        ? (estimatedFeeCapture * 10000n) / amountIn
        : 0n;

      this.log(`🧮 JIT Strategy Computed:`);
      this.log(`   Target Ticks:    [${targetTickLower}, ${targetTickUpper}]`);
      this.log(`   Block Window:    ${blockWindow} block(s) — zero impermanent loss`);
      this.log(`   Fee Efficiency:  ${feeEfficiencyBps} bps on deployed capital`);

      // ─── Encode JIT signal payload ───
      // Decoding schema: (tokenIn, tokenOut, amountIn, tickLower, tickUpper, feeCapture, blockWindow)
      const jitData = this.abiCoder.encode(
        ["address", "address", "uint256", "int24", "int24", "uint256", "uint256"],
        [
          tokenIn,
          tokenOut,
          amountIn,
          targetTickLower,
          targetTickUpper,
          estimatedFeeCapture,
          blockWindow,
        ]
      );

      const tx = await this.messageBus.connect(this.wallet).emitSignal(
        "JIT_OPPORTUNITY_FOUND",
        jitData,
        {
          gasLimit:             5_000_000,
          maxFeePerGas:         7000000000n,
          maxPriorityFeePerGas: 7000000000n,
        }
      );
      const receipt = await tx.wait();

      this.logSuccess(
        `JIT_OPPORTUNITY_FOUND signal emitted! TxHash: ${receipt.hash.slice(0, 16)}...`
      );
      this.log(
        `   📜 On-chain receipt: ticks=[${targetTickLower},${targetTickUpper}], window=${blockWindow} block`
      );
    } catch (error: any) {
      this.logError(`Failed to analyze JIT opportunity: ${error.message}`);
    }
  }

  // ─── Add a new yield source to monitor ───
  addYieldSource(yieldSource: Contract): void {
    this.yieldSources.push(yieldSource);
    this.log(`Added new yield source to monitoring list`);
  }
}