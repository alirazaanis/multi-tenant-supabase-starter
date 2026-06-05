/** Supabase auth cookie / storage key (optionally scoped per customer org). */
export function getAuthStorageKey(tenantSlug?: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let ref = "local";
  if (url) {
    try {
      ref = new URL(url).hostname.split(".")[0] ?? "local";
    } catch {
      ref = "local";
    }
  }

  const base = `sb-${ref}-auth-token`;
  return tenantSlug ? `${base}-tenant-${tenantSlug}` : base;
}
