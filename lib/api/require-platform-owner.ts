import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { isPlatformOwner } from "@/lib/auth/platform-owner";
import { createClient } from "@/lib/supabase/server";

type PlatformSession = {
  user: User;
  supabase: Awaited<ReturnType<typeof createClient>>;
};

export async function requirePlatformOwner(): Promise<
  PlatformSession | NextResponse
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isPlatformOwner(user.id, supabase))) {
    return NextResponse.json(
      { error: "Platform owner account required" },
      { status: 403 }
    );
  }

  return { user, supabase };
}

export function isPlatformError(
  result: PlatformSession | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
