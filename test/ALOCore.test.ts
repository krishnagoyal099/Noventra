/**
 * ═══════════════════════════════════════════════════════════════════
 *  ALO — Core Smart Contract Tests
 * ═══════════════════════════════════════════════════════════════════
 *  Tests the full strategy lifecycle and receipt generation on ALOCore.
 * ═══════════════════════════════════════════════════════════════════
 */

import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("ALOCore - Strategy Lifecycle & Receipts", function () {
  // Typed as `any` to avoid TypeScript's BaseContract index signature errors.
  // TypeChain types are generated post-compile; for tests we use dynamic dispatch.
  let registry: any;
  let messageBus: any;
  let core: any;
  let mockDEX: any;
  let mockYield: any;

  let owner: Signer;
  let scout: Signer;
  let risk: Signer;
  let strategy: Signer;
  let execution: Signer;
  let coordinator: Signer;

  const INITIAL_LIQUIDITY = ethers.parseEther("10000");

  beforeEach(async function () {
    [owner, scout, risk, strategy, execution, coordinator] = await ethers.getSigners();

    // Deploy AgentRegistry
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    registry = await AgentRegistry.deploy();
    await registry.waitForDeployment();

    // Deploy MessageBus
    const MessageBus = await ethers.getContractFactory("MessageBus");
    messageBus = await MessageBus.deploy(await registry.getAddress());
    await messageBus.waitForDeployment();

    // Deploy ALOCore
    const ALOCore = await ethers.getContractFactory("ALOCore");
    core = await ALOCore.deploy(await registry.getAddress(), INITIAL_LIQUIDITY);
    await core.waitForDeployment();

    // Deploy Mocks
    const MockDEX = await ethers.getContractFactory("MockDEX");
    mockDEX = await MockDEX.deploy();
    await mockDEX.waitForDeployment();

    const MockYieldSource = await ethers.getContractFactory("MockYieldSource");
    mockYield = await MockYieldSource.deploy("Test Pool", 100);
    await mockYield.waitForDeployment();

    // Register agents (role: SCOUT=1, RISK=2, STRATEGY=3, EXECUTION=4, COORDINATOR=5)
    await registry.registerAgent(await scout.getAddress(), 1, ""); // SCOUT
    await registry.registerAgent(await risk.getAddress(), 2, ""); // RISK
    await registry.registerAgent(await strategy.getAddress(), 3, ""); // STRATEGY
    await registry.registerAgent(await execution.getAddress(), 4, ""); // EXECUTION
    await registry.registerAgent(await coordinator.getAddress(), 5, ""); // COORDINATOR
  });

  describe("Strategy Lifecycle", function () {
    it("Should allow StrategyAgent to propose a strategy", async function () {
      const allocation = ethers.parseEther("1000");
      const tx = await core.connect(strategy).proposeStrategy({
        targetPool: await mockYield.getAddress(),
        allocation: allocation,
        expectedAPY: 500,
        rationale: "Test strategy",
      });

      await expect(tx)
        .to.emit(core, "StrategyProposed")
        .withArgs(
          1,
          await strategy.getAddress(),
          await mockYield.getAddress(),
          allocation,
          500
        );

      const s = await core.getStrategy(1);
      expect(s.state).to.equal(1); // PROPOSED
    });

    it("Should allow RiskAgent to approve a strategy", async function () {
      // Propose first
      await core.connect(strategy).proposeStrategy({
        targetPool: await mockYield.getAddress(),
        allocation: ethers.parseEther("1000"),
        expectedAPY: 500,
        rationale: "Test",
      });

      // Approve
      const tx = await core.connect(risk).approveStrategy(1, true, "Looks safe");
      await expect(tx)
        .to.emit(core, "StrategyEvaluated")
        .withArgs(1, await risk.getAddress(), true, "Looks safe");

      const s = await core.getStrategy(1);
      expect(s.state).to.equal(2); // APPROVED
    });

    it("Should allow RiskAgent to reject a strategy", async function () {
      await core.connect(strategy).proposeStrategy({
        targetPool: await mockYield.getAddress(),
        allocation: ethers.parseEther("1000"),
        expectedAPY: 500,
        rationale: "Test",
      });

      await core.connect(risk).approveStrategy(1, false, "Too risky");

      const s = await core.getStrategy(1);
      expect(s.state).to.equal(3); // REJECTED
    });

    it("Should allow ExecutionAgent to execute an approved strategy", async function () {
      await core.connect(strategy).proposeStrategy({
        targetPool: await mockYield.getAddress(),
        allocation: ethers.parseEther("1000"),
        expectedAPY: 500,
        rationale: "Test",
      });

      await core.connect(risk).approveStrategy(1, true, "Approved");

      const tx = await core
        .connect(execution)
        .executeTrade(1, await mockDEX.getAddress(), ethers.parseEther("1000"));

      await expect(tx).to.emit(core, "StrategyExecuted");

      const s = await core.getStrategy(1);
      expect(s.state).to.equal(4); // EXECUTED

      // Check liquidity was deducted
      expect(await core.totalLiquidity()).to.equal(
        INITIAL_LIQUIDITY - ethers.parseEther("1000")
      );
    });

    it("Should NOT allow execution of unapproved strategy", async function () {
      await core.connect(strategy).proposeStrategy({
        targetPool: await mockYield.getAddress(),
        allocation: ethers.parseEther("1000"),
        expectedAPY: 500,
        rationale: "Test",
      });

      await expect(
        core.connect(execution).executeTrade(1, await mockDEX.getAddress(), ethers.parseEther("1000"))
      ).to.be.revertedWith("ALOCore: strategy not APPROVED");
    });
  });

  describe("Receipt Audit Trail", function () {
    it("Should generate receipts for each step", async function () {
      // Propose
      await core.connect(strategy).proposeStrategy({
        targetPool: await mockYield.getAddress(),
        allocation: ethers.parseEther("1000"),
        expectedAPY: 500,
        rationale: "Test",
      });

      // Approve
      await core.connect(risk).approveStrategy(1, true, "Safe");

      // Execute
      await core
        .connect(execution)
        .executeTrade(1, await mockDEX.getAddress(), ethers.parseEther("1000"));

      // Check receipts
      const receiptCount = await core.getReceiptCount();
      expect(receiptCount).to.equal(3); // One for each step

      // Check strategy-specific receipts
      const strategyReceipts = await core.getDecisionTrail(1);
      expect(strategyReceipts.length).to.equal(3);
      expect(strategyReceipts[0].action).to.equal("STRATEGY_PROPOSED");
      expect(strategyReceipts[1].action).to.equal("STRATEGY_APPROVED");
      expect(strategyReceipts[2].action).to.equal("TRADE_EXECUTED");
    });

    it("Should record correct agent roles in receipts", async function () {
      await core.connect(strategy).proposeStrategy({
        targetPool: await mockYield.getAddress(),
        allocation: ethers.parseEther("1000"),
        expectedAPY: 500,
        rationale: "Test",
      });

      const receipts = await core.getDecisionTrail(1);
      expect(receipts[0].agentRole).to.equal("STRATEGY");
    });
  });

  describe("Access Control", function () {
    it("Should NOT allow non-strategy agent to propose", async function () {
      await expect(
        core.connect(scout).proposeStrategy({
          targetPool: await mockYield.getAddress(),
          allocation: ethers.parseEther("1000"),
          expectedAPY: 500,
          rationale: "Test",
        })
      ).to.be.revertedWith("ALOCore: incorrect agent role");
    });

    it("Should NOT allow non-risk agent to approve", async function () {
      await core.connect(strategy).proposeStrategy({
        targetPool: await mockYield.getAddress(),
        allocation: ethers.parseEther("1000"),
        expectedAPY: 500,
        rationale: "Test",
      });

      await expect(
        core.connect(scout).approveStrategy(1, true, "Fake approval")
      ).to.be.revertedWith("ALOCore: incorrect agent role");
    });
  });
});