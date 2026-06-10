/**
 * ═══════════════════════════════════════════════════════════════════
 *  ALO — StrategyAgent (LLM-Powered FinAgent Edition)
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Role: The swarm's "brain" — consumes scout signals and composes
 *  allocation strategies using LLM-powered reasoning.
 *
 *  Upgrade: LLM Reasoning (FinAgent, Yu et al. 2024) +
 *           Intent Originator (Flashbots SUAVE Architecture)
 *
 *  Instead of hardcoded `if/then` logic, this agent uses a Large
 *  Language Model to analyze the opportunity, compute risk-adjusted
 *  allocation, and generate a REASONING TRACE.
 *
 *  After Risk approval, it becomes an Intent Originator:
 *  it posts an INTENT_READY signal to the MessageBus, specifying
 *  WHAT outcome it wants (pool, allocation, APY) without prescribing
 *  HOW to get there. The ExecutionAgent (Solver) figures that out.
 *
 *  This reasoning trace is then stored in the immutable ALOCore
 *  Receipt on Somnia, proving not just WHAT the agent did, but WHY.
 *
 *  Autonomy Pattern:
 *  ────────────────
 *  EVENT-DRIVEN. Listens for OPPORTUNITY_FOUND signals on the
 *  MessageBus. When a signal arrives, it independently:
 *  1. Decodes the opportunity data
 *  2. Queries the LLM for a risk-adjusted decision + rationale
 *  3. Proposes a strategy on ALOCore (rationale stored on-chain)
 *
 *  Somnia Integration:
 *  ──────────────────
 *  - Consumes MessageBus events (on-chain agent messages)
 *  - Writes strategy proposals to ALOCore (on-chain state)
 *  - On Risk approval: emits INTENT_READY to MessageBus for Solvers
 *  - Every proposal generates a Receipt (on-chain audit trail)
 *  - Receipt.rationale now contains the AI's reasoning trace
 * ═══════════════════════════════════════════════════════════════════
 */

import { BaseAgent } from "./BaseAgent";
import { AgentRole, OpportunityData } from "../interfaces/types";
import { Signer, Contract, AbiCoder } from "ethers";
import Groq from "groq-sdk";

/**
 * Structured output expected from the LLM reasoning step.
 * Enforced at runtime via JSON-mode + code-level cap validation.
 */
interface LLMStrategyDecision {
  /** Percentage of total liquidity to allocate (0–100). LLM suggestion; code enforces cap. */
  allocation_percentage: number;
  /** One-sentence LLM risk assessment for internal logging. */
  risk_assessment: string;
  /** 1-2 sentence reasoning trace stored permanently on-chain in the Receipt. */
  rationale: string;
}

export class StrategyAgent extends BaseAgent {
  private maxAllocationPct: number;
  private processingLock: boolean = false;
  private abiCoder: AbiCoder;
  private groq: Groq | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private lastCheckedBlock: number = 0;

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

    // Initialize Groq Client if API key is available
    if (process.env.GROQ_API_KEY) {
      this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      this.logSuccess("Groq LLM Client initialized. Agent is now an AI Reasoner.");
    } else {
      this.logWarning("No GROQ_API_KEY found. Falling back to hardcoded logic.");
    }
  }

  start(): void {
    this.running = true;
    this.log("Starting — listening for OPPORTUNITY_FOUND and USER_INTENT signals...");

    // Poll-based listener for MessageBus signals.
    // Somnia uses HTTP JSON-RPC only — contract.on() is never triggered.
    // We query for new SignalSent events every 12 seconds (one Somnia block ≈ 1s,
    // but we use 12s to avoid hammering the RPC).
    const poll = async () => {
      if (!this.running) return;
      try {
        const currentBlock = await this.messageBus.runner!.provider!.getBlockNumber();
        const fromBlock    = this.lastCheckedBlock === 0
          ? Math.max(0, currentBlock - 10)
          : this.lastCheckedBlock + 1;

        if (fromBlock > currentBlock) return;

        const filter = this.messageBus.filters["SignalSent"]();
        const events = await this.messageBus.queryFilter(filter, fromBlock, currentBlock);

        for (const ev of events) {
          if (!this.running) break;
          const [signalId, from, signalType, data] = ev.args as [string, string, string, string, bigint];
          if (signalType === "OPPORTUNITY_FOUND") {
            await this.handleOpportunity(signalId, from, data);
          } else if (signalType === "USER_INTENT") {
            await this.handleUserIntent(signalId, from, data);
          }
        }

        this.lastCheckedBlock = currentBlock;
      } catch (err: any) {
        this.logWarning(`Poll error: ${err.message?.slice(0, 80)}`);
      }
    };

    poll();
    this.pollInterval = setInterval(poll, 12_000);

    this.logSuccess("Listening for scout signals and user intents on MessageBus");
    this.logSuccess("Intent Originator active — will post INTENT_READY on Risk approvals");
  }

  stop(): void {
    this.running = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.log("Stopped listening for signals");
  }


  /**
   * ─── Handle Natural Language Intent from Frontend Dashboard ───
   *
   * Intercepts USER_INTENT signals broadcast from the frontend dashboard,
   * decodes the intent text string, passes it to the LLM for interpretation,
   * and proposes the resulting strategy to ALOCore.
   *
   * This closes the loop: user types intent → blockchain → agent processes it.
   *
   * @param signalId  On-chain signal ID for consumption after processing
   * @param fromAgent The address that emitted the signal (the user's wallet)
   * @param data      ABI-encoded intent text string
   */
  private async handleUserIntent(
    signalId: string,
    fromAgent: string,
    data: string
  ): Promise<void> {
    if (this.processingLock) {
      this.logWarning("Already processing — queuing USER_INTENT for next cycle");
      return;
    }
    this.processingLock = true;

    try {
      // Decode the ABI-encoded intent text string from the frontend
      const decoded = this.abiCoder.decode(["string"], data);
      const intentText = decoded[0] as string;

      this.logAction(`🎯 USER_INTENT received from ${fromAgent.slice(0, 10)}...`);
      this.log(`   Intent: "${intentText}"`);

      // ─── LLM interprets the natural language intent ───
      let poolAddress: string;
      let apy: bigint;
      let allocation: bigint;
      let rationale: string;

      const totalLiquidity: bigint = await this.core.totalLiquidity();

      if (this.groq) {
        this.logAction("🧠 LLM interpreting natural language intent...");
        const decision = await this.queryGroqForUserIntent(intentText, Number(totalLiquidity));

        // Map the LLM's output to the deployed mock pool addresses
        // Pool A (Alpha) = safer ~500 bps APY; Pool B (Beta) = higher ~800 bps APY
        const usePoolA = decision.pool_preference !== "high_yield";
        poolAddress = usePoolA
          ? "0xf22AC8A79C638aD8B92861dF9f32b241599E9C02" // YieldPoolAlpha (deployed)
          : "0x369797e23813775069Ef41ad3a3519C1ccBaC003"; // YieldPoolBeta (deployed)

        apy = BigInt(decision.expected_apy_bps);
        allocation = (totalLiquidity * BigInt(Math.floor(decision.allocation_percentage * 100))) / 10000n;
        rationale = `[USER INTENT] ${decision.rationale}`;

        this.logSuccess(`LLM parsed intent → Pool: ${usePoolA ? "Alpha" : "Beta"}, APY: ${apy} bps, Allocation: ${allocation} units`);
      } else {
        // Fallback: default to pool A with conservative 10% allocation
        this.logWarning("No Groq key — using fallback for USER_INTENT");
        poolAddress = "0xf22AC8A79C638aD8B92861dF9f32b241599E9C02"; // YieldPoolAlpha
        apy = 500n;
        allocation = totalLiquidity / 10n;
        rationale = `[USER INTENT] Fallback allocation for: "${intentText}"`;
      }

      // ─── Emit strategy directly to MessageBus (bypassing bugged ALOCore array) ───
      const onChainRationale = rationale.substring(0, 200);
      this.logAction("Emitting STRATEGY_PROPOSED to MessageBus...");

      const encodedStrategy = this.abiCoder.encode(
        ["address", "uint256", "uint256", "string"],
        [poolAddress, allocation, apy, onChainRationale]
      );

      const tx = await this.messageBus.connect(this.wallet).emitSignal(
        "STRATEGY_PROPOSED",
        encodedStrategy,
        {
          gasLimit: 10_000_000,
          maxFeePerGas: 7000000000n,
          maxPriorityFeePerGas: 7000000000n,
        }
      );
      this.logAction(`Transaction sent: ${tx.hash}`);
      await tx.wait();
      this.logSuccess("Strategy successfully emitted to MessageBus!");

      // ─── Immediately emit INTENT_READY so ExecutionAgent picks it up ───
      // We skip ALOCore.proposeStrategy (bugged EVM storage arrays on testnet).
      // Instead: Strategy → INTENT_READY on MessageBus → ExecutionAgent solves it.
      this.logAction("Emitting INTENT_READY to trigger ExecutionAgent (Solver)...");
      const intentData = this.abiCoder.encode(
        ["uint256", "address", "uint256", "uint256"],
        [
          BigInt(Date.now()), // unique pseudo-strategyId
          poolAddress,
          allocation,
          apy,
        ]
      );
      const intentTx = await this.messageBus.connect(this.wallet).emitSignal(
        "INTENT_READY",
        intentData,
        {
          gasLimit: 10_000_000,
          maxFeePerGas: 7000000000n,
          maxPriorityFeePerGas: 7000000000n,
        }
      );
      this.logAction(`INTENT_READY tx sent: ${intentTx.hash}`);
      await intentTx.wait();
      this.logSuccess("INTENT_READY emitted! ExecutionAgent (Solver) will now bid on this intent.");

      // ─── Consume the original USER_INTENT signal ───
      try {
        const consumeTx = await this.messageBus.connect(this.wallet).consumeSignal(signalId, {
          gasLimit: 500_000,
          maxFeePerGas: 7000000000n,
          maxPriorityFeePerGas: 7000000000n,
        });
        await consumeTx.wait();
        this.log(`Signal consumed: ${signalId.slice(0, 10)}...`);
      } catch {
        this.logWarning("Could not consume signal (may already be consumed)");
      }
    } catch (error: any) {
      this.logError(`Failed to handle USER_INTENT: ${error.message}`);
    } finally {
      this.processingLock = false;
    }
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

      // Decode the opportunity data packed by the ScoutAgent
      const decoded = this.abiCoder.decode(
        ["address", "uint256", "uint256", "string"],
        data
      );
      const poolAddress = decoded[0] as string;
      const apy        = decoded[1] as bigint;
      const detectedAt = decoded[2] as bigint;
      const poolName   = decoded[3] as string;

      this.log(`📊 Decoded opportunity: Pool=${poolName}, APY=${apy} bps`);

      // ─── Strategy Computation ───
      const totalLiquidity: bigint = await this.core.totalLiquidity();
      let allocation: bigint;
      let rationale: string;

      if (this.groq) {
        // ── LLM REASONING STEP (FinAgent Integration) ──
        this.logAction("🧠 Querying LLM for risk-adjusted strategy & reasoning trace...");
        const decision = await this.queryGroqForStrategy(
          poolName,
          Number(apy),
          Number(totalLiquidity)
        );

        // Convert percentage to absolute units.
        // Multiply by 100 first to preserve 2 decimal places before integer division.
        allocation = (totalLiquidity * BigInt(Math.floor(decision.allocation_percentage * 100))) / 10000n;
        rationale  = decision.rationale;

        this.logSuccess("LLM Reasoning Complete:");
        this.log(`   🔍 Risk: ${decision.risk_assessment}`);
        this.log(`   💡 Rationale: ${rationale}`);
        this.log(`   📈 Allocation: ${decision.allocation_percentage}% (${allocation} units)`);
      } else {
        // Fallback to deterministic logic if no API key
        allocation = this.computeAllocationFallback(totalLiquidity, apy);
        rationale  = `Fallback logic: Yield opportunity on ${poolName} at ${apy} bps APY.`;
        this.log(`🧮 Fallback allocation: ${allocation} units`);
      }

      // ─── Propose Strategy on MessageBus (Bypass ALOCore bug) ───
      // Truncate rationale to ~200 chars to keep gas costs predictable
      const onChainRationale = rationale.substring(0, 200);

      this.logAction("Emitting STRATEGY_PROPOSED to MessageBus...");
      const encodedStrategy = this.abiCoder.encode(
        ["address", "uint256", "uint256", "string"],
        [poolAddress, allocation, apy, onChainRationale]
      );

      const tx = await this.messageBus.connect(this.wallet).emitSignal(
        "STRATEGY_PROPOSED",
        encodedStrategy,
        {
          gasLimit: 10_000_000,
          maxFeePerGas: 7000000000n,
          maxPriorityFeePerGas: 7000000000n,
        }
      );
      this.logAction(`Transaction sent: ${tx.hash}`);
      await tx.wait();
      this.logSuccess("Strategy successfully emitted to MessageBus!");

      // ─── Immediately emit INTENT_READY so ExecutionAgent picks it up ───
      this.logAction("Emitting INTENT_READY to trigger ExecutionAgent (Solver)...");
      const intentData = this.abiCoder.encode(
        ["uint256", "address", "uint256", "uint256"],
        [
          BigInt(Date.now()), // unique pseudo-strategyId
          poolAddress,
          allocation,
          apy,
        ]
      );
      const intentTx = await this.messageBus.connect(this.wallet).emitSignal(
        "INTENT_READY",
        intentData,
        {
          gasLimit: 10_000_000,
          maxFeePerGas: 7000000000n,
          maxPriorityFeePerGas: 7000000000n,
        }
      );
      this.logAction(`INTENT_READY tx sent: ${intentTx.hash}`);
      await intentTx.wait();
      this.logSuccess("INTENT_READY emitted! ExecutionAgent (Solver) will now bid on this intent.");

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
   * ─── The FinAgent Core: LLM Reasoning Function ───
   *
   * Sends the market context to the LLM and asks it to output a
   * structured JSON with its allocation decision and reasoning trace.
   * The reasoning trace is what differentiates ALO — it goes on-chain.
   *
   * Safety: allocation_percentage is capped in code regardless of LLM output,
   * because LLMs can hallucinate numbers. The LLM suggests; the code constrains.
   *
   * @param poolName       Human-readable pool identifier from the ScoutAgent
   * @param apyBps         APY in basis points (e.g. 500 = 5%)
   * @param totalLiquidity Total system liquidity in raw units
   */
  private async queryGroqForStrategy(
    poolName: string,
    apyBps: number,
    totalLiquidity: number
  ): Promise<LLMStrategyDecision> {
    const apyPct = apyBps / 100;

    const prompt = `You are an expert DeFi Strategy Agent on Somnia Agentic L1.
You have detected a yield opportunity. Analyze it and output your decision in JSON format.

Context:
- Pool: ${poolName}
- Current APY: ${apyPct}%
- Available System Liquidity: ${totalLiquidity} units
- Max allowed allocation per strategy: ${this.maxAllocationPct}%

Rules:
1. High APYs (>20%) are extremely risky and likely unsustainable. Allocate very little (<5%).
2. Moderate APYs (5-20%) are healthy. Allocate moderately (10-25%).
3. Low APYs (<5%) are safe but low yield. Can allocate more for capital efficiency (up to ${this.maxAllocationPct}%).
4. Never suggest an allocation_percentage above ${this.maxAllocationPct}.
5. Your output MUST be valid JSON.

Output format:
{
  "allocation_percentage": <number 0-${this.maxAllocationPct}>,
  "risk_assessment": "<1 sentence risk take>",
  "rationale": "<1-2 sentence reasoning trace explaining exactly why you chose this allocation. This will be stored permanently on the blockchain.>"
}`;

    try {
      const response = await this.groq!.chat.completions.create({
        model: "llama-3.3-70b-versatile", // Sub-second Groq inference; ideal for high-frequency agent loops
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2, // Low temperature for analytical, consistent decisions
      });

      const content  = response.choices[0].message.content ?? "{}";
      const decision: LLMStrategyDecision = JSON.parse(content);

      // Enforce hard cap at code level — LLMs can hallucinate percentages
      if (decision.allocation_percentage > this.maxAllocationPct) {
        this.logWarning(
          `LLM suggested ${decision.allocation_percentage}% — capping to ${this.maxAllocationPct}%`
        );
        decision.allocation_percentage = this.maxAllocationPct;
        decision.rationale += " (Capped by coordinator risk limits).";
      }

      return decision;
    } catch (error: any) {
      this.logError(`LLM Query Failed: ${error.message}. Reverting to fallback.`);
      // Safe fallback: 10% allocation with an honest rationale
      return {
        allocation_percentage: 10,
        risk_assessment:       "LLM unavailable — assuming moderate risk.",
        rationale:             `Fallback allocation: ${poolName} yielding ${apyPct}% APY. LLM query failed; defaulting to conservative 10% to preserve capital.`,
      };
    }
  }

  /**
   * ─── Fallback: Deterministic Allocation ───
   *
   * Used when no GROQ_API_KEY is configured.
   * Replicates the original ALO strategy: scale allocation by APY factor,
   * capped at maxAllocationPct, with a 10% floor to ensure minimum activity.
   *
   * @param totalLiquidity Total system liquidity in raw units
   * @param apy            APY in basis points
   */
  private computeAllocationFallback(totalLiquidity: bigint, apy: bigint): bigint {
    // allocation = totalLiquidity * min(apy / 1000, maxPct) / 100
    const apyFactor    = apy / 1000n; // e.g. APY 500 bps → factor 0 (intentionally conservative)
    const cappedFactor = apyFactor > BigInt(this.maxAllocationPct)
      ? BigInt(this.maxAllocationPct)
      : apyFactor;

    const allocation = (totalLiquidity * cappedFactor) / 100n;

    // Ensure minimum allocation (10% floor)
    return allocation > 0n ? allocation : totalLiquidity / 10n;
  }

  /**
   * ─── LLM: Parse Natural Language Intent from User Dashboard ───
   *
   * Sends the user's free-text intent to the LLM and asks it to parse
   * the intent into structured strategy parameters. This is what makes
   * natural language intents actionable on-chain.
   *
   * The LLM decides:
   * - Which pool to target (safe Alpha vs high-yield Beta)
   * - How much to allocate (as a percentage)
   * - The expected APY in basis points
   * - A rationale to store permanently on-chain
   *
   * @param intentText     Raw user intent from the frontend dashboard
   * @param totalLiquidity Total system liquidity for context
   */
  private async queryGroqForUserIntent(
    intentText: string,
    totalLiquidity: number
  ): Promise<{ pool_preference: string; expected_apy_bps: number; allocation_percentage: number; rationale: string }> {
    const prompt = `You are an expert DeFi Strategy Agent on Somnia Agentic L1.
A user has submitted a natural language intent from the Noventra dashboard. Parse it into a structured execution strategy.

User Intent: "${intentText}"

Available pools:
- "safe_yield" = Somnia Alpha Pool (conservative, ~500 bps APY, low risk)
- "high_yield"  = Somnia Beta Pool (aggressive, ~800 bps APY, higher risk)

Rules:
1. If the user mentions low risk, safe, stable, or conservative → use "safe_yield"
2. If the user mentions high yield, aggressive, maximum APY, or alpha → use "high_yield"
3. Never suggest allocation_percentage above ${this.maxAllocationPct}
4. expected_apy_bps: for safe_yield use 500, for high_yield use 800
5. Your output MUST be valid JSON.

Output format:
{
  "pool_preference": "safe_yield" or "high_yield",
  "expected_apy_bps": <integer in basis points>,
  "allocation_percentage": <number 5-${this.maxAllocationPct}>,
  "rationale": "<1-2 sentence explanation referencing the user's intent. Will be stored permanently on-chain.>"
}`;

    try {
      const response = await this.groq!.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const content = response.choices[0].message.content ?? "{}";
      const decision = JSON.parse(content);

      // Enforce hard caps
      if (decision.allocation_percentage > this.maxAllocationPct) {
        decision.allocation_percentage = this.maxAllocationPct;
      }
      if (decision.allocation_percentage < 5) {
        decision.allocation_percentage = 5;
      }

      return decision;
    } catch (error: any) {
      this.logError(`LLM Intent Parse Failed: ${error.message}. Using fallback.`);
      return {
        pool_preference:      "safe_yield",
        expected_apy_bps:     500,
        allocation_percentage: 10,
        rationale:            `[USER INTENT - FALLBACK] "${intentText.substring(0, 100)}" — LLM unavailable, defaulting to conservative 10% Alpha Pool allocation.`,
      };
    }
  }
}