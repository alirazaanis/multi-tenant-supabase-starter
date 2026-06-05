import { NextRequest, NextResponse } from "next/server";
import { RATE_LIMIT } from "@/lib/constants";
import { resolveTenant } from "@/lib/resolve-tenant";
import { safeErrorMessage } from "@/lib/api/safe-error";
import {
  envGuard,
  isGuardResponse,
  parseEmail,
} from "@/lib/api/route-helpers";
import {
  enforceRateLimit,
  isNextResponse,
  parseJsonBody,
} from "@/lib/api/request";
import { signInWithSession } from "@/lib/auth/server-signup";
import { createAnonServerClient } from "@/lib/supabase/admin";
import { setTenantSessionOnResponse } from "@/lib/supabase/route-handler";

type Body = {
  tenantSlug: string;
  email: string;
  password: string;
};

const LOGIN_FAILURE = "Invalid email or password";

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(
    request,
    "auth:login",
    RATE_LIMIT.auth.limit,
    RATE_LIMIT.auth.windowMs
  );
  if (limited) return limited;

  const envError = envGuard();
  if (envError) return envError;

  const body = await parseJsonBody<Body>(request);
  if (isNextResponse(body)) return body;

  const { tenantSlug, email, password } = body;

  if (!tenantSlug || !password) {
    return NextResponse.json(
      { error: "tenantSlug, email, and password are required" },
      { status: 400 }
    );
  }

  const emailResult = parseEmail(email);
  if (isGuardResponse(emailResult)) return emailResult;

  const tenant = await resolveTenant(tenantSlug);
  if (!tenant) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const realEmail = emailResult.email;
  const anon = createAnonServerClient();

  const { data: internalEmail, error: lookupError } = await anon.rpc(
    "lookup_internal_email",
    { p_tenant_id: tenant.id, p_real_email: realEmail }
  );

  if (lookupError) {
    return NextResponse.json(
      { error: safeErrorMessage(lookupError) },
      { status: 500 }
    );
  }

  if (!internalEmail) {
    return NextResponse.json({ error: LOGIN_FAILURE }, { status: 401 });
  }

  const signIn = await signInWithSession(anon, internalEmail, password);
  if ("error" in signIn) {
    return NextResponse.json({ error: LOGIN_FAILURE }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    user: {
      id: signIn.user.id,
      realEmail,
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
    },
  });

  const { error: sessionError } = await setTenantSessionOnResponse(
    request,
    tenant.slug,
    {
      access_token: signIn.session.access_token,
      refresh_token: signIn.session.refresh_token,
    },
    response
  );

  if (sessionError) {
    return NextResponse.json(
      { error: safeErrorMessage(sessionError) },
      { status: 500 }
    );
  }

  return response;
}
