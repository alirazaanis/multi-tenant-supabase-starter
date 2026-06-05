"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApiForm } from "@/lib/auth/use-api-form";

type Props = {
  tenantSlug: string;
  tenantName: string;
};

type SignupResponse = {
  error?: string;
  message?: string;
  sessionCreated?: boolean;
};

export function SignupForm({ tenantSlug }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const { error, loading, submit } = useApiForm();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(null);

    await submit<SignupResponse>(
      "/api/auth/signup",
      {
        tenantSlug,
        email,
        password,
        displayName: displayName || undefined,
      },
      async (data) => {
        if (data.sessionCreated) {
          router.refresh();
          router.push(`/${tenantSlug}/dashboard`);
          return;
        }
        setSuccess(data.message ?? "Account created.");
      },
      "Signup failed",
      { idempotent: true }
    );
  }

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}
      {success && (
        <div className="alert alert-success">
          {success}{" "}
          <Link href={`/${tenantSlug}/login`}>Log in now</Link>
        </div>
      )}

      <form className="form tenant-customer-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>
        <label>
          Full name
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Jane Smith"
            maxLength={100}
          />
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="tenant-auth-switch">
        Already have an account?{" "}
        <Link href={`/${tenantSlug}/login`}>Sign in</Link>
      </p>
    </>
  );
}
