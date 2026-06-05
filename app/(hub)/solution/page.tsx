import Link from "next/link";

export default function SolutionPage() {
  return (
    <>
      <h1>The Solution: Internal Email Mapping</h1>
      <p>
        Customers always type their real email. Your backend transforms it into a
        unique internal email per tenant before calling Supabase Auth. Supabase
        sees two different users; your app maps both back to the same person.
      </p>

      <div className="card">
        <h2>Flow</h2>
        <div className="flow-diagram">{`Org A registration with demo@example.com
        │
        ▼
Internal email: sha256("demo@example.com:org-a-tenant-id")@customers.internal
        │
        ▼
Supabase Auth user with INTERNAL email + metadata { real_email, tenant_id, role: customer }
        │
        ▼
auth_mappings: (tenant_id, real_email) → internal_email, user_id
        │
        ▼
Org A login with demo@example.com + password
        │
        ▼
Backend resolves internal email → signInWithPassword

Same customer on Org B → different hash → different Supabase user ✅`}</div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>What the customer sees</h3>
          <p>
            Each org you create has its own URL and theme — normal signup forms.
            The same email works on every org.
          </p>
        </div>
        <div className="card">
          <h3>What Supabase stores</h3>
          <p className="mono-block">
            7a8b9c…@customers.internal
            <br />
            9f8e7d…@customers.internal
          </p>
          <p style={{ marginBottom: 0 }}>Two auth.users rows, one real person.</p>
        </div>
      </div>

      <div className="card">
        <div className="links-row">
          <Link href="/register" className="btn btn-primary">
            Create platform account
          </Link>
          <Link href="/console" className="btn btn-secondary">
            Open console
          </Link>
        </div>
      </div>
    </>
  );
}
