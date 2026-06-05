import type { OrgSummary, TenantRow } from "@/lib/platform/org-types";
import type { TenantLayout, TenantTheme } from "@/lib/tenants";

export function mapOrgRow(row: TenantRow): OrgSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    siteDomain: row.site_domain,
    tagline: row.tagline,
    theme: row.theme as TenantTheme,
    layout: row.layout as TenantLayout,
    customerSignupUrl: `/${row.slug}/signup`,
    customerLoginUrl: `/${row.slug}/login`,
  };
}
