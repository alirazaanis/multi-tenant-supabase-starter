import Link from "next/link";
import { PRODUCT_NAME } from "@/lib/constants";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <p className="hero-kicker">Reference implementation</p>
        <h1>{PRODUCT_NAME}</h1>
        <p className="hero-lead">
          Customer-facing org sites from one platform account. Customers use the{" "}
          <strong>same email</strong> on every org — each org has an isolated
          auth user, profile, and session.
        </p>
      </section>

      <div className="card learn-card">
        <h2>Understand the pattern</h2>
        <p>
          Supabase Auth enforces one email per project. {PRODUCT_NAME} shows why
          that breaks multi-tenant signup — and how internal email mapping
          resolves it.
        </p>
        <div className="links-row">
          <Link href="/problem" className="btn btn-secondary btn-block-sm">
            1. The problem
          </Link>
          <Link href="/solution" className="btn btn-secondary btn-block-sm">
            2. The solution
          </Link>
        </div>
      </div>

      <h2 className="section-heading">Walkthrough</h2>

      <div className="demo-steps">
        <article className="card demo-step">
          <header className="demo-step-head">
            <span className="demo-step-num" aria-hidden>
              1
            </span>
            <h2>Platform owner account</h2>
          </header>
          <p>A single account with a real email and password — access to the org console.</p>
          <Link href="/register" className="btn btn-primary btn-block-sm">
            Create account
          </Link>
        </article>

        <article className="card demo-step">
          <header className="demo-step-head">
            <span className="demo-step-num" aria-hidden>
              2
            </span>
            <h2>Organization sites</h2>
          </header>
          <p>
            Org A and Org B in the console — each with its own theme so they read
            as separate products.
          </p>
          <Link href="/console" className="btn btn-primary btn-block-sm">
            Open console
          </Link>
        </article>

        <article className="card demo-step">
          <header className="demo-step-head">
            <span className="demo-step-num" aria-hidden>
              3
            </span>
            <h2>Per-org customer registration</h2>
          </header>
          <p>
            Each org has a <strong>Customer signup</strong> URL in the console.
            Separate tabs in one browser; the <strong>same customer email</strong>{" "}
            with different passwords — fully isolated sessions.
          </p>
          <Link href="/console" className="btn btn-primary btn-block-sm">
            Get org signup links
          </Link>
        </article>
      </div>
    </>
  );
}
