import { getAuthStorageKey } from "@/lib/supabase/storage-key";

/** Cookie name + path for Supabase SSR (path limits what the browser sends per request). */
export function getAuthCookieOptions(tenantSlug?: string) {
  const name = getAuthStorageKey(tenantSlug);
  // Tenant sessions are path-scoped to /{slug} so multiple org tabs stay under the Cookie header limit.
  const path = tenantSlug ? `/${tenantSlug}` : "/";
  return { name, path };
}

export function isAuthCookieForStorageKey(
  cookieName: string,
  storageKey: string
): boolean {
  return (
    cookieName === storageKey || cookieName.startsWith(`${storageKey}.`)
  );
}

export function filterAuthCookies<T extends { name: string }>(
  cookies: T[],
  storageKey: string
): T[] {
  return cookies.filter(({ name }) => isAuthCookieForStorageKey(name, storageKey));
}
