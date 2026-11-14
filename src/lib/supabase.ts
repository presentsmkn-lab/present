import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let client: SupabaseClient | null = null;

/**
 * Client Supabase dengan service role key.
 * HANYA boleh dipakai di server. RLS aktif di semua tabel, sehingga
 * akses anon/auth tidak mungkin; service role melewati RLS.
 */
export function db(): SupabaseClient {
  if (!client) {
    client = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        headers: { "X-Client-Info": "pencatatan-ekstrakurikuler-server" },
        fetch: (input, init) =>
          fetch(input, { ...(init ?? {}), cache: "no-store" }),
      },
    });
  }
  return client;
}
