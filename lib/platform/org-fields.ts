import { isValidLayout, isValidTheme } from "@/lib/tenant-create";
import type { TenantLayout, TenantTheme } from "@/lib/tenants";
import { LIMITS, normalizeSlug, validateSlug } from "@/lib/validation";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ValidatedOrgFields = {
  name: string;
  tagline: string;
  theme: TenantTheme;
  layout: TenantLayout;
};

export function isValidTenantId(id: string): boolean {
  return UUID_RE.test(id);
}

function validateSharedFields(body: {
  name?: string;
  tagline?: string;
  theme?: string;
  layout?: string;
}): ValidatedOrgFields | { error: string } {
  if (!body.name?.trim()) {
    return { error: "name is required" };
  }

  if (body.name.trim().length > LIMITS.orgNameMax) {
    return { error: "Name is too long" };
  }

  const theme = body.theme ?? "light";
  const layout = body.layout ?? "centered";

  if (!isValidTheme(theme)) {
    return { error: "Invalid theme" };
  }

  if (!isValidLayout(layout)) {
    return { error: "Invalid layout" };
  }

  return {
    name: body.name.trim(),
    tagline: (body.tagline ?? "").trim().slice(0, LIMITS.taglineMax),
    theme,
    layout,
  };
}

export function validateOrgCreateBody(body: {
  name?: string;
  slug?: string;
  tagline?: string;
  theme?: string;
  layout?: string;
}): (ValidatedOrgFields & { slug: string }) | { error: string } {
  if (!body.slug) {
    return { error: "name and slug are required" };
  }

  const shared = validateSharedFields(body);
  if ("error" in shared) return shared;

  const slug = normalizeSlug(body.slug);
  const slugError = validateSlug(slug);
  if (slugError) return { error: slugError };

  return { ...shared, slug };
}

export function validateOrgUpdateBody(body: {
  name?: string;
  tagline?: string;
  theme?: string;
  layout?: string;
}): ValidatedOrgFields | { error: string } {
  return validateSharedFields(body);
}
