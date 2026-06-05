import { NextRequest, NextResponse } from "next/server";
import { RATE_LIMIT } from "@/lib/constants";
import { invalidateTenantCache } from "@/lib/cache/tenant-cache";
import {
  isPlatformError,
  requirePlatformOwner,
} from "@/lib/api/require-platform-owner";
import { mapRpcError, safeErrorMessage } from "@/lib/api/safe-error";
import { envGuard } from "@/lib/api/route-helpers";
import {
  enforceRateLimit,
  isNextResponse,
  parseJsonBody,
} from "@/lib/api/request";
import {
  isValidTenantId,
  validateOrgUpdateBody,
} from "@/lib/platform/org-fields";
import { mapOrgRow } from "@/lib/platform/org-map";
import { tenantBrandFromRecord } from "@/lib/tenants";

type RouteParams = { params: Promise<{ tenantId: string }> };

type UpdateBody = {
  name?: string;
  tagline?: string;
  theme?: string;
  layout?: string;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const limited = await enforceRateLimit(
    request,
    "platform:update-tenant",
    RATE_LIMIT.auth.limit,
    RATE_LIMIT.auth.windowMs
  );
  if (limited) return limited;

  const envError = envGuard();
  if (envError) return envError;

  const { tenantId } = await params;
  if (!isValidTenantId(tenantId)) {
    return NextResponse.json({ error: "Invalid organization id" }, { status: 400 });
  }

  const body = await parseJsonBody<UpdateBody>(request);
  if (isNextResponse(body)) return body;

  const validated = validateOrgUpdateBody(body);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const authResult = await requirePlatformOwner();
  if (isPlatformError(authResult)) return authResult;

  const { data: tenant, error } = await authResult.supabase
    .from("tenants")
    .update({
      name: validated.name,
      tagline: validated.tagline,
      theme: validated.theme,
      layout: validated.layout,
    })
    .eq("id", tenantId)
    .eq("created_by", authResult.user.id)
    .select("id, slug, name, created_by, site_domain, tagline, theme, layout")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: safeErrorMessage(error) },
      { status: 500 }
    );
  }

  if (!tenant) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  invalidateTenantCache(tenant.slug);

  return NextResponse.json({
    ok: true,
    org: {
      ...mapOrgRow(tenant),
      brand: tenantBrandFromRecord(tenant),
    },
  });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const limited = await enforceRateLimit(
    request,
    "platform:delete-tenant",
    RATE_LIMIT.auth.limit,
    RATE_LIMIT.auth.windowMs
  );
  if (limited) return limited;

  const envError = envGuard();
  if (envError) return envError;

  const { tenantId } = await params;
  if (!isValidTenantId(tenantId)) {
    return NextResponse.json({ error: "Invalid organization id" }, { status: 400 });
  }

  const authResult = await requirePlatformOwner();
  if (isPlatformError(authResult)) return authResult;

  const { data: existing } = await authResult.supabase
    .from("tenants")
    .select("slug")
    .eq("id", tenantId)
    .eq("created_by", authResult.user.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const { error } = await authResult.supabase.rpc("delete_owned_tenant", {
    p_tenant_id: tenantId,
  });

  if (error) {
    const mapped = mapRpcError(error.message);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }

  invalidateTenantCache(existing.slug);

  return NextResponse.json({ ok: true, message: "Organization deleted" });
}
