import type { Seed } from "@/domain/types";
import type { ChatContextAttachment } from "./types";

export interface ClientMentionOption {
  id: string;
  label: string;
  secondary: string;
}

export interface ProfessionalMentionOption {
  id: string;
  label: string;
  secondary: string;
  context: ChatContextAttachment;
}

export interface MentionToken {
  trigger: "@" | "/";
  query: string;
  start: number;
  end: number;
}

function matchesQuery(values: string[], query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  return !normalized || values.some((value) => value.toLocaleLowerCase().includes(normalized));
}

export function getClientMentionOptions(seed: Seed, query: string): ClientMentionOption[] {
  return seed.clients
    .filter((client) => !client.archived && matchesQuery([client.companyName, client.primaryContactName], query))
    .sort((a, b) => a.companyName.localeCompare(b.companyName))
    .map((client) => ({ id: client.id, label: client.companyName, secondary: client.primaryContactName }));
}

export function getProfessionalMentionOptions(
  seed: Seed,
  clientId: string,
  query: string,
): ProfessionalMentionOption[] {
  return seed.placements
    .filter((placement) => placement.clientId === clientId && placement.status === "Active" && !placement.archived)
    .flatMap((placement) => {
      const professional = seed.professionals.find(
        (candidate) => candidate.id === placement.professionalId && !candidate.archived,
      );
      if (!professional || !matchesQuery([professional.fullName, placement.roleTitle], query)) return [];
      return [{
        id: professional.id,
        label: professional.fullName,
        secondary: placement.roleTitle,
        context: {
          placementId: placement.id,
          clientId: placement.clientId,
          professionalId: placement.professionalId,
        },
      }];
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function readMentionToken(text: string, cursor: number): MentionToken | null {
  const beforeCursor = text.slice(0, cursor);
  const atIndex = beforeCursor.lastIndexOf("@");
  const slashIndex = beforeCursor.lastIndexOf("/");
  const start = Math.max(atIndex, slashIndex);
  if (start < 0 || (start > 0 && !/\s/.test(beforeCursor[start - 1]))) return null;

  const query = beforeCursor.slice(start + 1);
  if (query.includes("\n") || query.includes("@") || query.includes("/")) return null;

  return {
    trigger: beforeCursor[start] as "@" | "/",
    query,
    start,
    end: cursor,
  };
}
