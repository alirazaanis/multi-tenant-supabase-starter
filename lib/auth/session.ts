import type { User } from "@supabase/supabase-js";

export type UserRole = "platform_owner" | "customer";

export function sessionMatchesTenant(user: User, tenantSlug: string): boolean {
  return user.user_metadata?.tenant_slug === tenantSlug;
}

/** Customer role is set by the signup trigger; safe to read from session metadata. */
export function isCustomerSession(user: User): boolean {
  return user.user_metadata?.role === "customer";
}

export function realEmailFromSession(user: User): string {
  return (
    (user.user_metadata?.real_email as string | undefined) ??
    user.email ??
    ""
  );
}
