import { NextRequest, NextResponse } from "next/server";
import { RATE_LIMIT } from "@/lib/constants";
import {
  isGuardResponse,
  parseEmail,
  parsePassword,
} from "@/lib/api/route-helpers";
import {
  enforceRateLimit,
  isNextResponse,
  parseJsonBody,
} from "@/lib/api/request";
import { assertDemoAdminEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

type Body = { email: string; password: string };

function naiveSignupEnvGuard(): NextResponse | null {
  try {
    assertDemoAdminEnv();
    return null;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Missing configuration",
      },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Naive signup endpoint is development-only" },
      { status: 403 }
    );
  }

  const limited = await enforceRateLimit(
    request,
    "demo:naive-signup",
    RATE_LIMIT.naiveSignup.limit,
    RATE_LIMIT.naiveSignup.windowMs
  );
  if (limited) return limited;

  const envError = naiveSignupEnvGuard();
  if (envError) return envError;

  const body = await parseJsonBody<Body>(request);
  if (isNextResponse(body)) return body;

  const emailResult = parseEmail(body.email);
  if (isGuardResponse(emailResult)) return emailResult;

  const passwordResult = parsePassword(body.password);
  if (isGuardResponse(passwordResult)) return passwordResult;

  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email: emailResult.email,
    password: passwordResult.password,
    email_confirm: true,
    user_metadata: { demo_naive_signup: true },
  });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        explanation:
          "Supabase Auth stores emails globally. The second signup with the same email fails even if it's for a different tenant.",
      },
      { status: 409 }
    );
  }

  return NextResponse.json({
    ok: true,
    userId: data.user?.id,
    message: "First signup succeeded (naive approach)",
  });
}

export async function DELETE(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Naive signup endpoint is development-only" },
      { status: 403 }
    );
  }

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const envError = naiveSignupEnvGuard();
  if (envError) return envError;

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Test auth user removed" });
}
