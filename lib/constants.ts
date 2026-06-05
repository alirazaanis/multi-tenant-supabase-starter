export const INTERNAL_EMAIL_DOMAIN = "customers.internal";

/** Display name for UI, metadata, and documentation. */
export const PRODUCT_NAME = "Multi-Tenant Supabase Starter";

export const RATE_LIMIT = {
  auth: { limit: 20, windowMs: 60_000 },
  /** Naive signup illustration on `/problem`. */
  naiveSignup: { limit: 30, windowMs: 60_000 },
} as const;

/** Max orgs a platform owner may create. */
export const MAX_ORGS_PER_OWNER = 100;

/** Org list page size (cursor/keyset pagination). */
export const ORG_PAGE_SIZE = 12;

export const CACHE = {
  tenantResolveMs: 60_000,
  idempotencyMs: 5 * 60_000,
} as const;
