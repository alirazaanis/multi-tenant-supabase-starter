"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApiForm } from "@/lib/auth/use-api-form";

type Props = {
  tenantSlug: string;
  tenantName: string;
};

type LoginResponse = {
  error?: string;
};

export function LoginForm({ tenantSlug, tenantName }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { error, loading, submit } = useApiForm();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit<LoginResponse>(
      "/api/auth/login",
      { tenantSlug, email, password },
      async () => {
        router.refresh();
        router.push(`/${tenantSlug}/dashboard`);
      },
      "Login failed"
    );
  }

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}

      <form className="form tenant-customer-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="tenant-auth-switch">
        New to {tenantName}?{" "}
        <Link href={`/${tenantSlug}/signup`}>Create an account</Link>
      </p>
    </>
  );
}
