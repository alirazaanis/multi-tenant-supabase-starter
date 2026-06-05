import { SignupForm } from "@/components/SignupForm";
import { CustomerAuthPanel } from "@/components/tenant/CustomerAuthPanel";
import { CustomerSiteShell } from "@/components/tenant/CustomerSiteShell";
import { getTenantPageContext } from "@/lib/tenant-page";

export default async function SignupPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const ctx = await getTenantPageContext(tenantSlug);

  return (
    <CustomerSiteShell brand={ctx.brand} tenantName={ctx.tenantName}>
      <CustomerAuthPanel
        title={ctx.brand.customerSignupTitle}
        subtitle={ctx.brand.customerSignupSubtitle}
      >
        <SignupForm tenantSlug={ctx.tenantSlug} tenantName={ctx.tenantName} />
      </CustomerAuthPanel>
    </CustomerSiteShell>
  );
}
