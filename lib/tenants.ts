export const TENANT_THEMES = ["light", "dark", "ocean", "ember"] as const;
export const TENANT_LAYOUTS = ["centered", "split"] as const;

export type TenantTheme = (typeof TENANT_THEMES)[number];
export type TenantLayout = (typeof TENANT_LAYOUTS)[number];

export type TenantRecord = {
  id: string;
  slug: string;
  name: string;
  created_by: string;
  site_domain: string;
  tagline: string;
  theme: TenantTheme;
  layout: TenantLayout;
};

export type TenantBrand = {
  theme: TenantTheme;
  layout: TenantLayout;
  siteDomain: string;
  tagline: string;
  customerSignupTitle: string;
  customerSignupSubtitle: string;
  customerLoginTitle: string;
  customerLoginSubtitle: string;
};

export function tenantBrandFromRecord(tenant: TenantRecord): TenantBrand {
  return {
    theme: tenant.theme,
    layout: tenant.layout,
    siteDomain: tenant.site_domain,
    tagline: tenant.tagline,
    customerSignupTitle: `Create your ${tenant.name} account`,
    customerSignupSubtitle: tenant.tagline || `Join ${tenant.name} — your workspace awaits.`,
    customerLoginTitle: `Sign in to ${tenant.name}`,
    customerLoginSubtitle: tenant.tagline || `Welcome back to ${tenant.name}.`,
  };
}

export const THEME_OPTIONS: {
  id: TenantTheme;
  label: string;
  description: string;
}[] = [
  { id: "light", label: "Lavender", description: "Soft purple pastel" },
  { id: "dark", label: "Slate", description: "Cool gray Mac minimal" },
  { id: "ocean", label: "Ocean", description: "Sky & mint pastel" },
  { id: "ember", label: "Ember", description: "Peach & rose pastel" },
];

export const LAYOUT_OPTIONS: { id: TenantLayout; label: string }[] = [
  { id: "centered", label: "Centered card" },
  { id: "split", label: "Split with hero panel" },
];
