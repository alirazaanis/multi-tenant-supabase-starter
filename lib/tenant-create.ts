import { getServerEnv } from "@/lib/env";
import {
  TENANT_LAYOUTS,
  TENANT_THEMES,
  type TenantLayout,
  type TenantTheme,
} from "@/lib/tenants";

export function buildSiteDomain(slug: string): string {
  const { siteUrl } = getServerEnv();
  try {
    const url = new URL(siteUrl);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "localhost" || host === "127.0.0.1") {
      return `${slug}.localhost`;
    }
    return `${slug}.${host}`;
  } catch {
    return `${slug}.app`;
  }
}

export function isValidTheme(value: string): value is TenantTheme {
  return (TENANT_THEMES as readonly string[]).includes(value);
}

export function isValidLayout(value: string): value is TenantLayout {
  return (TENANT_LAYOUTS as readonly string[]).includes(value);
}
