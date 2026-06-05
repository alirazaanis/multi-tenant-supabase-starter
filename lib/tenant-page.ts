import { notFound } from "next/navigation";
import { resolveTenant } from "@/lib/resolve-tenant";
import {
  tenantBrandFromRecord,
  type TenantBrand,
  type TenantRecord,
} from "@/lib/tenants";

export type TenantPageContext = {
  tenant: TenantRecord;
  tenantSlug: string;
  tenantName: string;
  brand: TenantBrand;
};

export async function getTenantPageContext(
  slug: string
): Promise<TenantPageContext> {
  const tenant = await resolveTenant(slug);
  if (!tenant) notFound();

  return {
    tenant,
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
    brand: tenantBrandFromRecord(tenant),
  };
}
