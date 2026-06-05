import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { isCustomerSession, sessionMatchesTenant } from "@/lib/auth/session";
import { resolveTenant } from "@/lib/resolve-tenant";
import { createTenantClient } from "@/lib/supabase/server";
import type { TenantRecord } from "@/lib/tenants";

type TenantSession = {
  tenant: TenantRecord;
  user: User;
  supabase: Awaited<ReturnType<typeof createTenantClient>>;
};

export async function requireTenantSession(
  tenantSlug: string | null | undefined
): Promise<TenantSession | NextResponse> {
  if (!tenantSlug) {
    return NextResponse.json(
      { error: "tenantSlug is required" },
      { status: 400 }
    );
  }

  const tenant = await resolveTenant(tenantSlug);
  if (!tenant) {
    return NextResponse.json({ error: "Unknown tenant" }, { status: 404 });
  }

  const supabase = await createTenantClient(tenantSlug);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!sessionMatchesTenant(user, tenantSlug)) {
    return NextResponse.json(
      {
        error:
          "This session belongs to another site. Sign in on this tenant first.",
      },
      { status: 403 }
    );
  }

  if (!isCustomerSession(user)) {
    return NextResponse.json(
      { error: "Owner accounts cannot access customer profile APIs" },
      { status: 403 }
    );
  }

  return { tenant, user, supabase };
}

export function isErrorResponse(
  result: TenantSession | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
