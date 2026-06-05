import { NextRequest, NextResponse } from "next/server";
import { RATE_LIMIT } from "@/lib/constants";
import { safeErrorMessage } from "@/lib/api/safe-error";
import {
  enforceRateLimit,
  isNextResponse,
  parseJsonBody,
} from "@/lib/api/request";
import {
  isErrorResponse,
  requireTenantSession,
} from "@/lib/api/require-tenant-session";
import { validateProfileFields } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> }
) {
  const { tenant: tenantSlug } = await params;

  const limited = await enforceRateLimit(
    request,
    "profile:write",
    RATE_LIMIT.auth.limit,
    RATE_LIMIT.auth.windowMs
  );
  if (limited) return limited;

  const body = await parseJsonBody<{
    displayName?: unknown;
    notes?: unknown;
  }>(request);
  if (isNextResponse(body)) return body;

  const validated = validateProfileFields(body.displayName, body.notes);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const result = await requireTenantSession(tenantSlug);
  if (isErrorResponse(result)) return result;

  const { tenant, supabase } = result;

  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: validated.displayName,
      notes: validated.notes,
    })
    .eq("tenant_id", tenant.id)
    .eq("user_id", result.user.id)
    .select("display_name, notes")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: safeErrorMessage(error) },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Profile not found or update denied" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, profile: data });
}
