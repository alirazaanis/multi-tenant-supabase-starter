import { NextRequest, NextResponse } from "next/server";
import { RATE_LIMIT } from "@/lib/constants";
import { toInternalEmail } from "@/lib/internal-email";
import { resolveTenant } from "@/lib/resolve-tenant";
import {
  idempotencyKey,
  readIdempotentResponse,
  writeIdempotentResponse,
} from "@/lib/api/idempotency";
import {
  envGuard,
  isGuardResponse,
  parseDisplayName,
  parseEmail,
  parsePassword,
} from "@/lib/api/route-helpers";
import {
  enforceRateLimit,
  isNextResponse,
  parseJsonBody,
} from "@/lib/api/request";
import { signUpWithSession } from "@/lib/auth/server-signup";
import { safeErrorMessage } from "@/lib/api/safe-error";
import { createAnonServerClient } from "@/lib/supabase/admin";
import { setTenantSessionOnResponse } from "@/lib/supabase/route-handler";

type Body = {
  tenantSlug: string;
  email: string;
  password: string;
  displayName?: string;
};

const SIGNUP_FAILURE =
  "Unable to create account. If you already have an account, try logging in.";

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(
    request,
    "auth:signup",
    RATE_LIMIT.auth.limit,
    RATE_LIMIT.auth.windowMs
  );
  if (limited) return limited;

  const envError = envGuard();
  if (envError) return envError;

  const idem = idempotencyKey(request.headers.get("Idempotency-Key"));
  if (idem) {
    const cached = await readIdempotentResponse("auth:signup", idem);
    if (cached) return cached;
  }

  const body = await parseJsonBody<Body>(request);
  if (isNextResponse(body)) return body;

  const { tenantSlug, email, password, displayName } = body;

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenantSlug is required" }, { status: 400 });
  }

  const emailResult = parseEmail(email);
  if (isGuardResponse(emailResult)) return emailResult;

  const passwordResult = parsePassword(password);
  if (isGuardResponse(passwordResult)) return passwordResult;

  const tenant = await resolveTenant(tenantSlug);
  if (!tenant) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const realEmail = emailResult.email;
  const nameResult = parseDisplayName(displayName, realEmail);
  if (isGuardResponse(nameResult)) return nameResult;

  const internalEmail = toInternalEmail(realEmail, tenant.id);
  const anon = createAnonServerClient();

  const result = await signUpWithSession(anon, {
    email: internalEmail,
    password: passwordResult.password,
    metadata: {
      role: "customer",
      real_email: realEmail,
      tenant_id: tenant.id,
      tenant_slug: tenant.slug,
      display_name: nameResult.displayName,
    },
    successMessage: `Account created on ${tenant.name}`,
    pendingMessage: `Account created on ${tenant.name}. Please log in.`,
  });

  if ("error" in result) {
    return NextResponse.json({ error: SIGNUP_FAILURE }, { status: 400 });
  }

  const { session, ...rest } = result;
  const payload = { ...rest, sessionCreated: Boolean(session) };
  const response = NextResponse.json(payload);

  if (session) {
    const { error: sessionError } = await setTenantSessionOnResponse(
      request,
      tenant.slug,
      session,
      response
    );

    if (sessionError) {
      return NextResponse.json(
        { error: safeErrorMessage(sessionError) },
        { status: 500 }
      );
    }
  }

  if (idem) {
    await writeIdempotentResponse("auth:signup", idem, 200, payload);
  }

  return response;
}
