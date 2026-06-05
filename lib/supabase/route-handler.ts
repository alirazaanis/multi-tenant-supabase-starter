import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  filterAuthCookies,
  getAuthCookieOptions,
} from "@/lib/supabase/cookie-options";

function applyCookies(
  response: NextResponse,
  cookiesToSet: { name: string; value: string; options: CookieOptions }[]
) {
  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options);
  }
}

export function createTenantRouteHandlerClient(
  request: NextRequest,
  tenantSlug: string,
  response: NextResponse
) {
  const cookieOptions = getAuthCookieOptions(tenantSlug);

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return filterAuthCookies(
            request.cookies.getAll(),
            cookieOptions.name
          );
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          applyCookies(response, cookiesToSet);
        },
      },
      cookieOptions,
    }
  );
}

export async function setTenantSessionOnResponse(
  request: NextRequest,
  tenantSlug: string,
  session: { access_token: string; refresh_token: string },
  response: NextResponse
) {
  const supabase = createTenantRouteHandlerClient(
    request,
    tenantSlug,
    response
  );
  return supabase.auth.setSession(session);
}
