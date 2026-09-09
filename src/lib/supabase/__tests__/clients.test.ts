import type { Session } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { ensureAnonymousSession } from "../browser";
import { createUserScopedSupabase } from "../server";

const session = { access_token: "token-a" } as Session;

describe("ensureAnonymousSession", () => {
  it("reuses an existing anonymous session", async () => {
    const signInAnonymously = vi.fn();

    const result = await ensureAnonymousSession({
      getSession: async () => ({ data: { session }, error: null }),
      signInAnonymously,
    });

    expect(result).toBe(session);
    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it("creates an anonymous session when none exists", async () => {
    const created = { access_token: "token-b" } as Session;

    const result = await ensureAnonymousSession({
      getSession: async () => ({ data: { session: null }, error: null }),
      signInAnonymously: async () => ({ data: { session: created }, error: null }),
    });

    expect(result).toBe(created);
  });
});

describe("createUserScopedSupabase", () => {
  it("scopes every server query to the caller bearer token", () => {
    let captured: unknown[] = [];
    const marker = { kind: "client" };

    const result = createUserScopedSupabase("verified-token", {
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      },
      createClient: (...args: unknown[]) => {
        captured = args;
        return marker;
      },
    });

    expect(result).toBe(marker);
    expect(captured).toEqual([
      "https://example.supabase.co",
      "sb_publishable_test",
      {
        global: { headers: { Authorization: "Bearer verified-token" } },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    ]);
  });
});
