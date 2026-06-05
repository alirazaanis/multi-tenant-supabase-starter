import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isOpsConfigured } from "@/lib/env";

let opsClient: SupabaseClient | null = null;

/** Service-role client for operational tables (rate limits, idempotency). Server-only. */
export function getOpsClient(): SupabaseClient | null {
  if (!isOpsConfigured()) return null;

  if (!opsClient) {
    opsClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }

  return opsClient;
}
