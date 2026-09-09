import type { HealthState, Seed } from "@/domain/types";
import {
  assessHealth,
  assessSilence,
  buildAllPlacementContexts,
  buildHealthDistribution,
  buildPriorityQueue,
  buildSummaryTiles,
  contactsDueTodayPredicate,
} from "@/domain/rules";

const CLOSED_ISSUE_STATUSES = new Set(["Closed"]);

export interface AgentPortfolioContext {
  scope: "portfolio";
  asOf: string;
  summary: {
    totalClients: number;
    activeClients: number;
    activeProfessionals: number;
    activePlacements: number;
    clientsWithOpenIssues: number;
    openIssues: number;
  };
  dashboard: {
    tiles: Record<string, number>;
    health: Record<HealthState, number>;
    attention: ReturnType<typeof buildPriorityQueue>;
  };
  contactsDueToday: Array<{
    client: string;
    professional: string;
    reasons: string[];
  }>;
  clients: Array<{
    companyName: string;
    industry: string;
    primaryContact: string;
    preferredChannel: string;
    timeZone: string;
    activeProfessionals: string[];
    healthStates: HealthState[];
    openIssues: number;
  }>;
  placements: Array<{
    client: string;
    professional: string;
    role: string;
    startDate: string;
    trialEndDate: string;
    health: HealthState;
    healthReasons: string[];
    openIssues: Array<{
      title: string;
      severity: string;
      status: string;
      source: string;
      reportedAt: string;
    }>;
  }>;
}

export function buildAgentPortfolioContext(seed: Seed, asOf: string): AgentPortfolioContext {
  const contexts = buildAllPlacementContexts(seed).filter(
    (context) => context.placement.status === "Active",
  );
  const activeClientIds = new Set(contexts.map((context) => context.client.id));
  const activeProfessionalIds = new Set(contexts.map((context) => context.professional.id));
  const openIssues = contexts.flatMap((context) =>
    context.issues.filter((issue) => !CLOSED_ISSUE_STATUSES.has(issue.status)),
  );
  const clientsWithOpenIssues = new Set(
    contexts
      .filter((context) => context.issues.some((issue) => !CLOSED_ISSUE_STATUSES.has(issue.status)))
      .map((context) => context.client.id),
  );
  const priorityQueue = buildPriorityQueue(contexts, asOf);
  const contactsDueToday = contexts
    .filter((context) => contactsDueTodayPredicate(context, asOf))
    .map((context) => {
      const reasons: string[] = [];
      const silence = assessSilence(context, asOf);
      if (silence.reason) reasons.push(silence.reason);
      for (const feedback of context.feedback.filter(
        (item) => item.subjectType === "client" && !item.collectedAt && item.scheduledFor <= asOf,
      )) {
        reasons.push(`Client feedback checkpoint due ${feedback.scheduledFor}`);
      }
      for (const checkin of context.checkins.filter(
        (item) => item.subjectType === "professional" && item.status !== "completed" && item.dueDate <= asOf,
      )) {
        reasons.push(`Professional check-in due ${checkin.dueDate}`);
      }
      return {
        client: context.client.companyName,
        professional: context.professional.fullName,
        reasons,
      };
    });

  return {
    scope: "portfolio",
    asOf,
    summary: {
      totalClients: seed.clients.filter((client) => !client.archived).length,
      activeClients: activeClientIds.size,
      activeProfessionals: activeProfessionalIds.size,
      activePlacements: contexts.length,
      clientsWithOpenIssues: clientsWithOpenIssues.size,
      openIssues: openIssues.length,
    },
    dashboard: {
      tiles: Object.fromEntries(
        buildSummaryTiles(contexts, asOf).map((tile) => [tile.key, tile.count]),
      ),
      health: buildHealthDistribution(contexts, asOf),
      attention: priorityQueue,
    },
    contactsDueToday,
    clients: seed.clients
      .filter((client) => !client.archived)
      .map((client) => {
        const clientContexts = contexts.filter((context) => context.client.id === client.id);
        return {
          companyName: client.companyName,
          industry: client.industry,
          primaryContact: client.primaryContactName,
          preferredChannel: client.preferredChannel,
          timeZone: client.usTimeZone,
          activeProfessionals: clientContexts.map((context) => context.professional.fullName),
          healthStates: clientContexts.map((context) => assessHealth(context, asOf).state),
          openIssues: clientContexts.reduce(
            (count, context) => count + context.issues.filter(
              (issue) => !CLOSED_ISSUE_STATUSES.has(issue.status),
            ).length,
            0,
          ),
        };
      }),
    placements: contexts.map((context) => {
      const health = assessHealth(context, asOf);
      return {
        client: context.client.companyName,
        professional: context.professional.fullName,
        role: context.placement.roleTitle,
        startDate: context.placement.startDate,
        trialEndDate: context.placement.trialEndDate,
        health: health.state,
        healthReasons: health.reasons,
        openIssues: context.issues
          .filter((issue) => !CLOSED_ISSUE_STATUSES.has(issue.status))
          .map((issue) => ({
            title: issue.title,
            severity: issue.severity,
            status: issue.status,
            source: issue.source,
            reportedAt: issue.reportedAt,
          })),
      };
    }),
  };
}

export function serializeAgentPortfolioContext(context: AgentPortfolioContext): string {
  return `<F5_CONTEXT>\n${JSON.stringify(context, null, 2)}\n</F5_CONTEXT>`;
}

export function summarizePortfolio(context: AgentPortfolioContext): string {
  const { summary } = context;
  return [
    `F5 currently has ${summary.activeClients} active clients across ${summary.activePlacements} active placements.`,
    `${context.dashboard.tiles.contacts_due_today ?? 0} client or professional contacts are due today.`,
    `${summary.clientsWithOpenIssues} clients have ${summary.openIssues} open issues.`,
    `${context.dashboard.tiles.escalations ?? 0} placements need escalation now.`,
  ].join(" ");
}
