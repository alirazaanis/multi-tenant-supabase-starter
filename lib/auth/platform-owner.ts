import type { SupabaseClient } from "@supabase/supabase-js";

/** Authoritative platform-owner check (database row, not JWT metadata). */
export async function isPlatformOwner(
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { data, error } = await supabase
    .from("platform_owners")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return false;
  return !!data;
}
