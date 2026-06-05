import { NextResponse } from "next/server";
import type { Session } from "@supabase/supabase-js";
import { assertServerEnv } from "@/lib/env";
import { isValidEmail, normalizeEmail, validateDisplayName, validatePassword } from "@/lib/validation";

export function envGuard(): NextResponse | null {
  try {
    assertServerEnv();
    return null;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Missing configuration" },
      { status: 503 }
    );
  }
}

export function sessionJson(session: Session) {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  };
}

export function parseEmail(
  email: unknown
): { email: string } | NextResponse {
  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  return { email: normalized };
}

export function parsePassword(
  password: unknown
): { password: string } | NextResponse {
  if (typeof password !== "string" || !password) {
    return NextResponse.json(
      { error: "Password is required" },
      { status: 400 }
    );
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  return { password };
}

export function parseDisplayName(
  displayName: unknown,
  fallbackEmail: string
): { displayName: string } | NextResponse {
  const fallback = fallbackEmail.split("@")[0] ?? "User";
  const result = validateDisplayName(displayName, fallback);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return result;
}

export function isGuardResponse(
  value: unknown
): value is NextResponse {
  return value instanceof NextResponse;
}
