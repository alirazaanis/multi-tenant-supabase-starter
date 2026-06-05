import { type NextRequest } from "next/server";
import { tenantSlugFromPath } from "@/lib/routing/tenant-path";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const tenantSlug = tenantSlugFromPath(request.nextUrl.pathname);
  return updateSession(request, tenantSlug);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
