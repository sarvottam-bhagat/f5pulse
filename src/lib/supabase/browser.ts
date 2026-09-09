"use client";

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { readSupabasePublicConfig } from "./config";

interface AnonymousAuthPort {
  getSession(): Promise<{ data: { session: Session | null }; error: Error | null }>;
  signInAnonymously(): Promise<{ data: { session: Session | null }; error: Error | null }>;
}

let browserClient: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (browserClient) return browserClient;

  const { url, publishableKey } = readSupabasePublicConfig({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  browserClient = createClient(url, publishableKey);
  return browserClient;
}

export async function ensureAnonymousSession(
  auth: AnonymousAuthPort,
): Promise<Session> {
  const current = await auth.getSession();
  if (current.error) {
    throw new Error("Could not start a private chat session.");
  }
  if (current.data.session) return current.data.session;

  const created = await auth.signInAnonymously();
  if (created.error || !created.data.session) {
    throw new Error("Could not start a private chat session.");
  }
  return created.data.session;
}
