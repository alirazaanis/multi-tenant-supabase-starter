import type { SupabaseClient } from "@supabase/supabase-js";
import { ORG_PAGE_SIZE } from "@/lib/constants";
import {
  getCachedTenant,
  setCachedTenant,
} from "@/lib/cache/tenant-cache";
import {
  decodeOrgCursor,
  encodeOrgCursor,
} from "@/lib/pagination/cursor";
import { createAnonServerClient } from "@/lib/supabase/admin";
import type { TenantRecord } from "@/lib/tenants";

const TENANT_COLUMNS =
  "id, slug, name, created_by, site_domain, tagline, theme, layout, created_at";

export type TenantListPage = {
  items: TenantRecord[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
};

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

export async function resolveTenant(slug: string): Promise<TenantRecord | null> {
  const normalized = slug.toLowerCase();
  const cached = getCachedTenant(normalized);
  if (cached) return cached;

  const supabase = createAnonServerClient();
  const { data, error } = await supabase
    .from("tenants")
    .select(TENANT_COLUMNS)
    .eq("slug", normalized)
    .maybeSingle();

  if (error || !data) return null;

  const tenant = data as TenantRecord;
  setCachedTenant(normalized, tenant);
  return tenant;
}

export async function countTenantsByOwner(
  supabase: SupabaseClient,
  ownerId: string,
  search?: string
): Promise<number> {
  let query = supabase
    .from("tenants")
    .select("id", { count: "exact", head: true })
    .eq("created_by", ownerId);

  const term = search?.trim();
  if (term) {
    const pattern = `%${escapeIlike(term)}%`;
    query = query.or(`name.ilike.${pattern},slug.ilike.${pattern}`);
  }

  const { count, error } = await query;
  if (error || count === null) return 0;
  return count;
}

export async function listTenantsByOwnerPage(
  supabase: SupabaseClient,
  ownerId: string,
  options?: { cursor?: string | null; limit?: number; search?: string }
): Promise<TenantListPage> {
  const limit = options?.limit ?? ORG_PAGE_SIZE;
  const decoded = options?.cursor ? decodeOrgCursor(options.cursor) : null;

  if (options?.cursor && !decoded) {
    return { items: [], nextCursor: null, hasMore: false, total: 0 };
  }

  const total = await countTenantsByOwner(
    supabase,
    ownerId,
    options?.search
  );

  let query = supabase
    .from("tenants")
    .select(TENANT_COLUMNS)
    .eq("created_by", ownerId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  const term = options?.search?.trim();
  if (term) {
    const pattern = `%${escapeIlike(term)}%`;
    query = query.or(`name.ilike.${pattern},slug.ilike.${pattern}`);
  }

  if (decoded) {
    query = query.or(
      `created_at.lt.${decoded.createdAt},and(created_at.eq.${decoded.createdAt},id.lt.${decoded.id})`
    );
  }

  const { data, error } = await query;
  if (error || !data) {
    return { items: [], nextCursor: null, hasMore: false, total };
  }

  const rows = data as (TenantRecord & { created_at: string })[];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  const last = page.at(-1) as (TenantRecord & { created_at: string }) | undefined;
  const nextCursor =
    hasMore && last
      ? encodeOrgCursor({ createdAt: last.created_at, id: last.id })
      : null;

  return {
    items: page.map(({ created_at, ...tenant }) => {
      void created_at;
      return tenant;
    }),
    nextCursor,
    hasMore,
    total,
  };
}
