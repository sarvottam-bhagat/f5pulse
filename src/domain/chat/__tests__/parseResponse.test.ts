import { describe, it, expect } from "vitest";
import { parseAssistantResponse } from "../parseResponse";

describe("parseAssistantResponse", () => {
  it("returns the raw text unchanged when there is no proposed action", () => {
    const result = parseAssistantResponse("This placement looks healthy.", "placement_1");
    expect(result.content).toBe("This placement looks healthy.");
    expect(result.proposedActions).toHaveLength(0);
  });

  it("extracts a valid PROPOSED_ACTION and strips it from the displayed content", () => {
    const raw = [
      "This client has gone quiet — worth logging an outreach attempt.",
      'PROPOSED_ACTION: {"kind":"log_contact","subjectType":"client","summary":"Attempted phone outreach","channel":"phone","label":"Log this contact attempt"}',
    ].join("\n");
    const result = parseAssistantResponse(raw, "placement_1");
    expect(result.content).toBe("This client has gone quiet — worth logging an outreach attempt.");
    expect(result.proposedActions).toHaveLength(1);
    expect(result.proposedActions[0].kind).toBe("log_contact");
    expect(result.proposedActions[0].placementId).toBe("placement_1");
  });

  it("treats malformed JSON after the marker as no action, without throwing", () => {
    const raw = "Here's my answer.\nPROPOSED_ACTION: {not valid json}";
    const result = parseAssistantResponse(raw, "placement_1");
    expect(result.content).toBe("Here's my answer.");
    expect(result.proposedActions).toHaveLength(0);
  });

  it("treats a proposed action missing a kind as no action", () => {
    const raw = 'Some text\nPROPOSED_ACTION: {"label":"missing kind field"}';
    const result = parseAssistantResponse(raw, "placement_1");
    expect(result.proposedActions).toHaveLength(0);
  });

  it("assigns a unique id to each parsed proposed action", () => {
    const raw = 'text\nPROPOSED_ACTION: {"kind":"create_escalation","summary":"test","reason":"x"}';
    const a = parseAssistantResponse(raw, "placement_1").proposedActions[0];
    const b = parseAssistantResponse(raw, "placement_1").proposedActions[0];
    expect(a.id).not.toBe(b.id);
  });
});
