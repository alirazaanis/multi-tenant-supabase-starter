"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { establishSession } from "@/lib/auth/establish-session";
import { useApiForm } from "@/lib/auth/use-api-form";
import { MAX_ORGS_PER_OWNER } from "@/lib/constants";
import { LIMITS } from "@/lib/validation";

type SignupResponse = {
  error?: string;
  session?: { access_token: string; refresh_token: string };
};

export function PlatformRegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const { error, loading, submit } = useApiForm();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit<SignupResponse>(
      "/api/platform/signup",
      { email, password, displayName: displayName || undefined },
      async (data) => {
        if (data.session) {
          await establishSession(data.session, router, "/console");
          return;
        }
        router.push("/login");
      },
      "Signup failed",
      { idempotent: true }
    );
  }

  return (
    <div className="card">
      <h1>Create platform account</h1>
      <p>
        Sign up once, then create up to {MAX_ORGS_PER_OWNER} customer-facing orgs
        from your console.
      </p>
      {error && <div className="alert alert-error">{error}</div>}
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Your name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={LIMITS.displayNameMax}
          />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Creating…" : "Sign up"}
        </button>
      </form>
      <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </div>
  );
}
