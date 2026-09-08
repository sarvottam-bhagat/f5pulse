// Parses a raw LLM response for an optional trailing "PROPOSED_ACTION: {...}"
// line into a structured ProposedAction, stripping it from the displayed
// text. Malformed JSON is treated as no action rather than surfacing an
// error to the user.

import type { ProposedAction } from "./actions";
import { nextId } from "../../store/id";

export function parseAssistantResponse(
  raw: string,
  placementId: string,
): { content: string; proposedActions: ProposedAction[] } {
  const marker = "PROPOSED_ACTION:";
  const idx = raw.indexOf(marker);
  if (idx === -1) {
    return { content: raw.trim(), proposedActions: [] };
  }

  const content = raw.slice(0, idx).trim();
  const jsonPart = raw.slice(idx + marker.length).trim();

  try {
    const parsed = JSON.parse(jsonPart);
    const kind = parsed.kind;
    if (!kind) return { content, proposedActions: [] };

    const base = { id: nextId("proposal"), placementId, label: parsed.label ?? kind };
    const action = { ...base, kind, ...parsed } as ProposedAction;
    return { content, proposedActions: [action] };
  } catch {
    return { content, proposedActions: [] };
  }
}
