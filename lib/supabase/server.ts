import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  filterAuthCookies,
  getAuthCookieOptions,
} from "@/lib/supabase/cookie-options";

function serverCookieHandlers(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  cookieOptions: ReturnType<typeof getAuthCookieOptions>
) {
  return {
    cookies: {
      getAll() {
        return filterAuthCookies(cookieStore.getAll(), cookieOptions.name);
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[]
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component — middleware refreshes sessions.
        }
      },
    },
    cookieOptions,
  };
}

export async function createClient() {
  const cookieStore = await cookies();
  const { cookies: cookieHandlers, cookieOptions } = serverCookieHandlers(
    cookieStore,
    getAuthCookieOptions()
  );

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieHandlers, cookieOptions }
  );
}

/** Customer org session — isolated cookies so multiple orgs work in one browser. */
export async function createTenantClient(tenantSlug: string) {
  const cookieStore = await cookies();
  const { cookies: cookieHandlers, cookieOptions } = serverCookieHandlers(
    cookieStore,
    getAuthCookieOptions(tenantSlug)
  );

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieHandlers, cookieOptions }
  );
}
