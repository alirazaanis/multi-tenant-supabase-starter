import { PlatformRegisterForm } from "@/components/platform/PlatformRegisterForm";

export default function RegisterPage() {
  return (
    <>
      <section className="page-intro">
        <h1>Become a platform owner</h1>
        <p>
          One account. Up to 100 orgs. Each org is its own customer-facing site on
          Supabase.
        </p>
      </section>
      <div className="auth-card">
        <PlatformRegisterForm />
      </div>
    </>
  );
}
