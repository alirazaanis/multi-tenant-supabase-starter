import { NextRequest, NextResponse } from "next/server";
import { RATE_LIMIT } from "@/lib/constants";
import { isPlatformOwner } from "@/lib/auth/platform-owner";
import { safeErrorMessage } from "@/lib/api/safe-error";
import {
  envGuard,
  isGuardResponse,
  parseEmail,
  sessionJson,
} from "@/lib/api/route-helpers";
import {
  enforceRateLimit,
  isNextResponse,
  parseJsonBody,
} from "@/lib/api/request";
import { signInWithSession } from "@/lib/auth/server-signup";
import { createAnonServerClient } from "@/lib/supabase/admin";

type Body = { email: string; password: string };

const LOGIN_FAILURE = "Invalid email or password";

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(
    request,
    "platform:login",
    RATE_LIMIT.auth.limit,
    RATE_LIMIT.auth.windowMs
  );
  if (limited) return limited;

  const envError = envGuard();
  if (envError) return envError;

  const body = await parseJsonBody<Body>(request);
  if (isNextResponse(body)) return body;

  const { email, password } = body;

  if (!password) {
    return NextResponse.json(
      { error: "email and password are required" },
      { status: 400 }
    );
  }

  const emailResult = parseEmail(email);
  if (isGuardResponse(emailResult)) return emailResult;

  const anon = createAnonServerClient();
  const signIn = await signInWithSession(anon, emailResult.email, password);

  if ("error" in signIn) {
    return NextResponse.json({ error: LOGIN_FAILURE }, { status: 401 });
  }

  const { error: sessionError } = await anon.auth.setSession({
    access_token: signIn.session.access_token,
    refresh_token: signIn.session.refresh_token,
  });

  if (sessionError) {
    return NextResponse.json(
      { error: safeErrorMessage(sessionError) },
      { status: 500 }
    );
  }

  if (!(await isPlatformOwner(signIn.user.id, anon))) {
    const { error: registerError } = await anon.rpc("register_platform_owner");
    if (registerError || !(await isPlatformOwner(signIn.user.id, anon))) {
      return NextResponse.json({ error: LOGIN_FAILURE }, { status: 401 });
    }
  }

  return NextResponse.json({
    ok: true,
    session: sessionJson(signIn.session),
  });
}
