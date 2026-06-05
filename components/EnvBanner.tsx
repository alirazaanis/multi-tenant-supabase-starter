export function EnvBanner() {
  return (
    <div className="env-banner" role="status">
      <strong>Setup incomplete.</strong> Supabase credentials belong in{" "}
      <code>.env.local</code> (from <code>.env.example</code>). The schema is in{" "}
      <code>supabase/migrations/001_multitenant_auth.sql</code>. Status:{" "}
      <code>/api/health</code>.
    </div>
  );
}
