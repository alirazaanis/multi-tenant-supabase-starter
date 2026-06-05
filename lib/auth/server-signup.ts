import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { sessionJson } from "@/lib/api/route-helpers";

export type SignUpResult =
  | { ok: true; message: string; session: ReturnType<typeof sessionJson> }
  | { ok: true; message: string; session?: undefined };

export async function signUpWithSession(
  supabase: SupabaseClient,
  params: {
    email: string;
    password: string;
    metadata: Record<string, unknown>;
    successMessage: string;
    pendingMessage: string;
  }
): Promise<SignUpResult | { error: string }> {
  const { email, password, metadata, successMessage, pendingMessage } = params;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });

  if (error) return { error: "Unable to create account. Please try again." };
  if (!data.user) return { error: "Failed to create account" };

  if (data.session) {
    return {
      ok: true,
      message: successMessage,
      session: sessionJson(data.session),
    };
  }

  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({ email, password });

  if (signInError || !signInData.session) {
    return { ok: true, message: pendingMessage };
  }

  return {
    ok: true,
    message: successMessage,
    session: sessionJson(signInData.session),
  };
}

export async function signInWithSession(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<
  | { session: Session; user: NonNullable<Awaited<ReturnType<SupabaseClient["auth"]["signInWithPassword"]>>["data"]["user"]> }
  | { error: string }
> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user) {
    return { error: "Invalid email or password" };
  }

  return { session: data.session, user: data.user };
}
