/** Hub route segments — not customer org slugs. Aligned with slug validation. */
export const HUB_SEGMENTS = [
  "register",
  "login",
  "console",
  "api",
  "problem",
  "solution",
  "_next",
  "favicon.ico",
] as const;

const HUB_SET = new Set<string>(HUB_SEGMENTS);

export function isHubSegment(segment: string): boolean {
  return HUB_SET.has(segment);
}

export function isReservedOrgSlug(slug: string): boolean {
  return HUB_SET.has(slug);
}
