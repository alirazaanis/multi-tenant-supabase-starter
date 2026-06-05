import { NextRequest, NextResponse } from "next/server";
import { RATE_LIMIT } from "@/lib/constants";
import {
  idempotencyKey,
  readIdempotentResponse,
  writeIdempotentResponse,
} from "@/lib/api/idempotency";
import { mapRpcError } from "@/lib/api/safe-error";
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
import { createAnonServerClient } from "@/lib/supabase/admin";

type Body = {
  email: string;
  password: string;
  displayName?: string;
};

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(
    request,
    "platform:signup",
    RATE_LIMIT.auth.limit,
    RATE_LIMIT.auth.windowMs
  );
  if (limited) return limited;

  const envError = envGuard();
  if (envError) return envError;

  const idem = idempotencyKey(request.headers.get("Idempotency-Key"));
  if (idem) {
    const cached = await readIdempotentResponse("platform:signup", idem);
    if (cached) return cached;
  }

  const body = await parseJsonBody<Body>(request);
  if (isNextResponse(body)) return body;

  const { email, password, displayName } = body;

  const emailResult = parseEmail(email);
  if (isGuardResponse(emailResult)) return emailResult;

  const passwordResult = parsePassword(password);
  if (isGuardResponse(passwordResult)) return passwordResult;

  const realEmail = emailResult.email;
  const nameResult = parseDisplayName(displayName, realEmail);
  if (isGuardResponse(nameResult)) return nameResult;

  const anon = createAnonServerClient();

  const result = await signUpWithSession(anon, {
    email: realEmail,
    password: passwordResult.password,
    metadata: {
      real_email: realEmail,
      display_name: nameResult.displayName,
    },
    successMessage: "Welcome! Create your first org in the console.",
    pendingMessage: "Account created. Please log in.",
  });

  if ("error" in result) {
    return NextResponse.json(
      { error: "Unable to create account. Please try again." },
      { status: 400 }
    );
  }

  if (result.session) {
    const { error: sessionError } = await anon.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });

    if (sessionError) {
      return NextResponse.json(
        { error: "Account created but session failed. Please log in." },
        { status: 500 }
      );
    }

    const { error: registerError } = await anon.rpc("register_platform_owner");
    if (registerError) {
      const mapped = mapRpcError(registerError.message);
      return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    }
  }

  const payload = { ...result };
  const response = NextResponse.json(payload);

  if (idem) {
    await writeIdempotentResponse("platform:signup", idem, 200, payload);
  }

  return response;
}
