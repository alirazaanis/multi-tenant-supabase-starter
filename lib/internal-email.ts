import { createHash } from "crypto";
import { INTERNAL_EMAIL_DOMAIN } from "@/lib/constants";

/**
 * Supabase Auth enforces global email uniqueness.
 * The auth wrapper stores a deterministic internal email per (real_email, tenant_id) pair
 * so the same person is a separate auth user on each org.
 */
export function toInternalEmail(realEmail: string, tenantId: string): string {
  const normalized = realEmail.trim().toLowerCase();
  const hash = createHash("sha256")
    .update(`${normalized}:${tenantId}`)
    .digest("hex")
    .slice(0, 32);
  return `${hash}@${INTERNAL_EMAIL_DOMAIN}`;
}
