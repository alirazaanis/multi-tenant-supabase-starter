import { redirect } from "next/navigation";
import {
  isCustomerSession,
  sessionMatchesTenant,
} from "@/lib/auth/session";
import { loadProfileSnapshot } from "@/lib/profile/load-profile";
import { getTenantPageContext } from "@/lib/tenant-page";
import { createTenantClient } from "@/lib/supabase/server";
import { CustomerSiteShell } from "@/components/tenant/CustomerSiteShell";
import { Dashboard } from "@/components/Dashboard";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const ctx = await getTenantPageContext(tenantSlug);

  const supabase = await createTenantClient(tenantSlug);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !sessionMatchesTenant(user, tenantSlug) || !isCustomerSession(user)) {
    redirect(`/${tenantSlug}/login`);
  }

  const snapshot = await loadProfileSnapshot(ctx.tenant, user, supabase);
  if (!snapshot) {
    redirect(`/${tenantSlug}/login`);
  }

  return (
    <CustomerSiteShell brand={ctx.brand} tenantName={ctx.tenantName}>
      <Dashboard
        tenantSlug={ctx.tenantSlug}
        tenantName={ctx.tenantName}
        initialData={snapshot}
      />
    </CustomerSiteShell>
  );
}
