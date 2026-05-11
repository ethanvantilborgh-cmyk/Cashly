import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/** Lazy singleton — createClient() is NOT called at module load time. */
export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}

/**
 * Backward-compat export. Acts as a SupabaseClient but defers createClient()
 * until first property access — safe to import at module level.
 */
export const supabase: SupabaseClient = new Proxy(
  {} as SupabaseClient,
  {
    get(_t, prop, receiver) {
      const client = getSupabase();
      const val = (client as unknown as Record<string | symbol, unknown>)[prop];
      return typeof val === "function" ? (val as Function).bind(client) : val;
    },
  }
);
