"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { establishSession } from "@/lib/auth/establish-session";
import { useApiForm } from "@/lib/auth/use-api-form";

type LoginResponse = {
  error?: string;
  session?: { access_token: string; refresh_token: string };
};

export function PlatformLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { error, loading, submit } = useApiForm();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit<LoginResponse>(
      "/api/platform/login",
      { email, password },
      async (data) => {
        await establishSession(data.session!, router, "/console");
      },
      "Login failed"
    );
  }

  return (
    <div className="card">
      <h1>Platform login</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>
      <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
        New here? <Link href="/register">Create account</Link>
      </p>
    </div>
  );
}
