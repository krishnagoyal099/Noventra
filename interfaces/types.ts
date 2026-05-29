export enum AgentRole {
  SCOUT = "SCOUT",
  RISK = "RISK",
  STRATEGY = "STRATEGY",
  EXECUTION = "EXECUTION",
  COORDINATOR = "COORDINATOR",
}

/**
 * Maps string AgentRole to the on-chain uint enum in AgentRegistry.sol:
 *   NONE=0, SCOUT=1, RISK=2, STRATEGY=3, EXECUTION=4, COORDINATOR=5
 */
export const AgentRoleUint: Record<AgentRole, number> = {
  [AgentRole.SCOUT]:       1,
  [AgentRole.RISK]:        2,
  [AgentRole.STRATEGY]:    3,
  [AgentRole.EXECUTION]:   4,
  [AgentRole.COORDINATOR]: 5,
};

export interface AgentConfig {
  name: string;
  role: AgentRole;
  privateKey: string;
}

export interface OpportunityData {
  poolAddress: string;
  apy: bigint;
  detectedAt: bigint;
  poolName: string;
}

export interface RiskAssessment {
  approved: boolean;
  reason: string;
  riskScore: number;
  maxDrawdown: number;
}