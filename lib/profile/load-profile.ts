import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { realEmailFromSession } from "@/lib/auth/session";
import type { TenantRecord } from "@/lib/tenants";

export type ProfileSnapshot = {
  userId: string;
  realEmail: string;
  profile: { display_name: string; notes: string };
};

export async function loadProfileSnapshot(
  tenant: TenantRecord,
  user: User,
  supabase: SupabaseClient
): Promise<ProfileSnapshot | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, notes")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !profile) return null;

  return {
    userId: user.id,
    realEmail: realEmailFromSession(user),
    profile,
  };
}
