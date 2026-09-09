import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from "@supabase/supabase-js";
import { readSupabasePublicConfig } from "./config";

interface ServerClientDependencies<T> {
  env: Record<string, string | undefined>;
  createClient: (
    url: string,
    publishableKey: string,
    options: SupabaseClientOptions<"public">,
  ) => T;
}

export function createUserScopedSupabase(accessToken: string): SupabaseClient;
export function createUserScopedSupabase<T>(
  accessToken: string,
  dependencies: ServerClientDependencies<T>,
): T;
export function createUserScopedSupabase<T>(
  accessToken: string,
  dependencies?: ServerClientDependencies<T>,
): T | SupabaseClient {
  const env = dependencies?.env ?? process.env;
  const factory = dependencies?.createClient ?? createClient;
  const { url, publishableKey } = readSupabasePublicConfig(env);

  return factory(url, publishableKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
