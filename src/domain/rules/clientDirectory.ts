import type { Client, Seed } from "../types";

export interface ClientDirectoryRow {
  client: Client;
  activePlacementCount: number;
  totalPlacementCount: number;
}

export function buildClientDirectoryRows(seed: Seed): ClientDirectoryRow[] {
  return seed.clients
    .map((client) => {
      const placements = seed.placements.filter((placement) => placement.clientId === client.id);
      return {
        client,
        activePlacementCount: placements.filter((placement) => placement.status === "Active" && !placement.archived).length,
        totalPlacementCount: placements.length,
      };
    })
    .sort((left, right) => left.client.companyName.localeCompare(right.client.companyName));
}

export function filterClientDirectoryRows(
  rows: ClientDirectoryRow[],
  query: string,
  status: "all" | "active" | "archived",
): ClientDirectoryRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  return rows.filter(({ client }) => {
    const matchesStatus = status === "all" || (status === "archived" ? client.archived : !client.archived);
    const searchable = [client.companyName, client.primaryContactName, client.email, client.industry, client.usTimeZone]
      .join(" ")
      .toLowerCase();
    return matchesStatus && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
}
