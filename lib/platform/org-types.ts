import type { TenantLayout, TenantTheme } from "@/lib/tenants";

export type OrgSummary = {
  id: string;
  slug: string;
  name: string;
  siteDomain: string;
  tagline: string;
  theme: TenantTheme;
  layout: TenantLayout;
  customerSignupUrl: string;
  customerLoginUrl: string;
};

export type TenantRow = {
  id: string;
  slug: string;
  name: string;
  site_domain: string;
  tagline: string;
  theme: string;
  layout: string;
};
