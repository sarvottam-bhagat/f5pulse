export interface SupabasePublicConfig {
  url: string;
  publishableKey: string;
}

export function readSupabasePublicConfig(
  env: Record<string, string | undefined>,
): SupabasePublicConfig {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    throw new Error("Supabase is not configured.");
  }

  return { url, publishableKey };
}
