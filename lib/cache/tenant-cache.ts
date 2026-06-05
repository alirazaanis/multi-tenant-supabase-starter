import { CACHE } from "@/lib/constants";
import { TtlCache } from "@/lib/cache/ttl-cache";
import type { TenantRecord } from "@/lib/tenants";

const tenantBySlug = new TtlCache<TenantRecord>();

export function getCachedTenant(slug: string): TenantRecord | undefined {
  return tenantBySlug.get(slug.toLowerCase());
}

export function setCachedTenant(slug: string, tenant: TenantRecord): void {
  tenantBySlug.set(slug.toLowerCase(), tenant, CACHE.tenantResolveMs);
}

export function invalidateTenantCache(slug: string): void {
  tenantBySlug.delete(slug.toLowerCase());
}
