export function getServerEnv() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    authHookSecret: process.env.SUPABASE_AUTH_HOOK_SECRET ?? "",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  };
}

function hasValidSupabaseUrl(url: string): boolean {
  return url.length > 0 && !url.includes("your-project");
}

function hasValidAnonKey(key: string): boolean {
  return key.length > 0 && !key.includes("your-anon");
}

function hasValidServiceRoleKey(key: string): boolean {
  return key.length > 0 && !key.includes("your-service");
}

/** Core app: Supabase URL + anon key (no service role required). */
export function isEnvConfigured(): boolean {
  const { supabaseUrl, supabaseAnonKey } = getServerEnv();
  return hasValidSupabaseUrl(supabaseUrl) && hasValidAnonKey(supabaseAnonKey);
}

/** Service role configuration for `/problem` naive-signup illustration and admin cleanup. */
export function isDemoAdminConfigured(): boolean {
  const { supabaseServiceRoleKey } = getServerEnv();
  return isEnvConfigured() && hasValidServiceRoleKey(supabaseServiceRoleKey);
}

/** Rate-limit + idempotency persistence (recommended for production / serverless). */
export function isOpsConfigured(): boolean {
  return isDemoAdminConfigured();
}

export function assertServerEnv(): void {
  if (!isEnvConfigured()) {
    throw new Error(
      "Supabase environment variables are missing or still placeholders. Credentials belong in .env.local (from .env.example)."
    );
  }
}

export function assertDemoAdminEnv(): void {
  if (!isDemoAdminConfigured()) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for the naive-signup illustration on /problem."
    );
  }
}
