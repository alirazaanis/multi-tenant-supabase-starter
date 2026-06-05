import { isHubSegment } from "@/lib/routing/hub-segments";

/** First URL segment when it is a customer org slug (not a hub route). */
export function tenantSlugFromPath(pathname: string): string | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (!segment || isHubSegment(segment)) return null;
  return segment;
}
