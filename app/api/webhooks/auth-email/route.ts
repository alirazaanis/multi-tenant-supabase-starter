import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";

type AuthHookPayload = {
  user?: {
    email?: string;
    user_metadata?: {
      real_email?: string;
      tenant_slug?: string;
    };
  };
  email_data?: {
    email_action_type?: string;
  };
};

/**
 * Optional Supabase Auth Hook (Send Email) handler.
 * Production deployments typically integrate Resend, SendGrid, etc. using payload metadata.
 */
export async function POST(request: NextRequest) {
  const { authHookSecret } = getServerEnv();

  if (!authHookSecret) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Auth hook secret not configured" },
        { status: 503 }
      );
    }
  } else {
    const headerSecret = request.headers
      .get("authorization")
      ?.replace("Bearer ", "");
    if (headerSecret !== authHookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: AuthHookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = payload.email_data?.email_action_type ?? "unknown";
  const tenantSlug = payload.user?.user_metadata?.tenant_slug ?? "unknown";

  if (process.env.NODE_ENV !== "production") {
    console.info("[auth-hook]", { action, tenantSlug });
  }

  return NextResponse.json({
    ok: true,
    dev: process.env.NODE_ENV !== "production",
    message:
      process.env.NODE_ENV === "production"
        ? "Email hook received"
        : `Would send ${action} email for tenant ${tenantSlug}`,
  });
}
