import { NextRequest, NextResponse } from "next/server";
import { ORG_PAGE_SIZE, RATE_LIMIT } from "@/lib/constants";
import { invalidateTenantCache } from "@/lib/cache/tenant-cache";
import {
  isPlatformError,
  requirePlatformOwner,
} from "@/lib/api/require-platform-owner";
import { mapRpcError } from "@/lib/api/safe-error";
import { envGuard } from "@/lib/api/route-helpers";
import {
  enforceRateLimit,
  isNextResponse,
  parseJsonBody,
} from "@/lib/api/request";
import { validateOrgCreateBody } from "@/lib/platform/org-fields";
import { mapOrgRow } from "@/lib/platform/org-map";
import { listTenantsByOwnerPage } from "@/lib/resolve-tenant";
import { buildSiteDomain } from "@/lib/tenant-create";
import { tenantBrandFromRecord } from "@/lib/tenants";

type CreateBody = {
  name: string;
  slug: string;
  tagline?: string;
  theme?: string;
  layout?: string;
};

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(
    request,
    "platform:tenants",
    RATE_LIMIT.auth.limit,
    RATE_LIMIT.auth.windowMs
  );
  if (limited) return limited;

  const result = await requirePlatformOwner();
  if (isPlatformError(result)) return result;

  const cursor = request.nextUrl.searchParams.get("cursor");
  const search = request.nextUrl.searchParams.get("q") ?? undefined;
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam
    ? Math.min(Math.max(parseInt(limitParam, 10) || ORG_PAGE_SIZE, 1), 50)
    : ORG_PAGE_SIZE;

  const page = await listTenantsByOwnerPage(result.supabase, result.user.id, {
    cursor,
    limit,
    search,
  });

  return NextResponse.json({
    orgs: page.items.map(mapOrgRow),
    nextCursor: page.nextCursor,
    hasMore: page.hasMore,
    total: page.total,
    pageSize: limit,
  });
}

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(
    request,
    "platform:create-tenant",
    RATE_LIMIT.auth.limit,
    RATE_LIMIT.auth.windowMs
  );
  if (limited) return limited;

  const envError = envGuard();
  if (envError) return envError;

  const body = await parseJsonBody<CreateBody>(request);
  if (isNextResponse(body)) return body;

  const validated = validateOrgCreateBody(body);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const authResult = await requirePlatformOwner();
  if (isPlatformError(authResult)) return authResult;

  const { data: tenant, error } = await authResult.supabase.rpc(
    "create_owned_tenant",
    {
      p_slug: validated.slug,
      p_name: validated.name,
      p_site_domain: buildSiteDomain(validated.slug),
      p_tagline: validated.tagline,
      p_theme: validated.theme,
      p_layout: validated.layout,
    }
  );

  if (error) {
    const mapped = mapRpcError(error.message);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }

  if (!tenant) {
    return NextResponse.json(
      { error: "Failed to create org" },
      { status: 500 }
    );
  }

  invalidateTenantCache(validated.slug);

  return NextResponse.json({
    ok: true,
    org: {
      ...mapOrgRow(tenant),
      brand: tenantBrandFromRecord(tenant),
    },
  });
}
