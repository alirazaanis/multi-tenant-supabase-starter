"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { createClient } from "@/lib/supabase/client";

export type SessionTokens = {
  access_token: string;
  refresh_token: string;
};

export async function establishSession(
  session: SessionTokens,
  router: AppRouterInstance,
  redirectTo: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  if (error) {
    throw new Error(error.message);
  }

  router.refresh();
  router.push(redirectTo);
}
