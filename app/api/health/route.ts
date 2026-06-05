import { NextResponse } from "next/server";
import { isEnvConfigured } from "@/lib/env";
import { createAnonServerClient } from "@/lib/supabase/admin";

export async function GET() {
  const configured = isEnvConfigured();

  let dbOk = false;
  if (configured) {
    try {
      const supabase = createAnonServerClient();
      const { error } = await supabase.from("tenants").select("id").limit(1);
      dbOk = !error;
    } catch {
      dbOk = false;
    }
  }

  const ok = configured && dbOk;

  return NextResponse.json(
    {
      ok,
      env: configured ? "configured" : "missing",
      database: dbOk ? "connected" : "error",
      hint: ok
        ? null
        : "Set .env.local and run supabase/migrations/001_multitenant_auth.sql",
    },
    { status: ok ? 200 : 503 }
  );
}
