import type { AuditEntry, HealthAssessment, Seed } from "../types";
import {
  assessHealth,
  buildPlacementContext,
  type PlacementContext,
} from "../rules";

export interface AgentPlacementContext extends PlacementContext {
  health: HealthAssessment;
  auditLog: AuditEntry[];
  asOf: string;
}

export function buildAgentPlacementContext(
  seed: Seed,
  placementId: string,
  asOf: string,
): AgentPlacementContext | null {
  const base = buildPlacementContext(seed, placementId);
  if (!base || base.placement.archived) return null;

  return {
    ...base,
    health: assessHealth(base, asOf),
    auditLog: seed.auditLog.filter((entry) => entry.placementId === placementId),
    asOf,
  };
}

export function serializeAgentPlacementContext(
  context: AgentPlacementContext,
): string {
  return `<F5_CONTEXT>\n${JSON.stringify(context, null, 2)}\n</F5_CONTEXT>`;
}
