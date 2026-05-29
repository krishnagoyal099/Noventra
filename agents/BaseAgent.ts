import { Signer } from "ethers";
import { AgentRole } from "../interfaces/types";

export abstract class BaseAgent {
  protected signer: Signer;
  protected wallet: Signer; // alias for signer (backward-compat with agent code)
  protected name: string;
  protected role: AgentRole;
  protected registry: any;   // typed as `any` — enables dynamic contract method dispatch
  protected messageBus: any; // typed as `any` — enables dynamic contract method dispatch
  protected core: any;       // typed as `any` — enables dynamic contract method dispatch
  protected running: boolean = false;

  constructor(
    name: string,
    role: AgentRole,
    signer: Signer,
    registry: any,
    messageBus: any,
    core: any
  ) {
    this.name = name;
    this.role = role;
    this.signer = signer;
    this.wallet = signer; // agents use this.wallet to call .connect(this.wallet)
    this.registry = registry;
    this.messageBus = messageBus;
    this.core = core;
  }

  abstract start(): void;
  abstract stop(): void;

  protected log(msg: string): void {
    console.log(`[${this.name}] ${msg}`);
  }

  protected logAction(msg: string): void {
    console.log(`[${this.name}] ⚙️  ${msg}`);
  }

  protected logSuccess(msg: string): void {
    console.log(`[${this.name}] ✅ ${msg}`);
  }

  protected logWarning(msg: string): void {
    console.log(`[${this.name}] ⚠️  ${msg}`);
  }

  protected logError(msg: string): void {
    console.log(`[${this.name}] ❌ ${msg}`);
  }
}