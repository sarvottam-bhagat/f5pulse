import { describe, expect, it } from "vitest";
import { readSupabasePublicConfig } from "../config";

describe("readSupabasePublicConfig", () => {
  it("returns the public URL and publishable key", () => {
    expect(
      readSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      }),
    ).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_test",
    });
  });

  it("rejects incomplete configuration without exposing secret values", () => {
    expect(() => readSupabasePublicConfig({})).toThrow("Supabase is not configured");
  });
});
