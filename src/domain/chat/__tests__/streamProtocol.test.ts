import { describe, expect, it } from "vitest";
import { createChatStreamParser } from "../streamProtocol";

describe("createChatStreamParser", () => {
  it("parses newline-delimited events even when network chunks split JSON", () => {
    const events: unknown[] = [];
    const parser = createChatStreamParser((event) => events.push(event));

    parser.push('{"type":"delta","delta":"Hel');
    parser.push('lo"}\n{"type":"delta","delta":" world"}\n');
    parser.finish();

    expect(events).toEqual([
      { type: "delta", delta: "Hello" },
      { type: "delta", delta: " world" },
    ]);
  });
});
