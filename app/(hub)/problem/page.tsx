"use client";

import Link from "next/link";
import { useState } from "react";

export default function ProblemPage() {
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password123");
  const [attempt, setAttempt] = useState(1);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function tryNaiveSignup() {
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/demo/naive-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.ok) {
      if (data.userId) setCreatedUserId(data.userId);
      setResult({
        ok: true,
        message: `Attempt ${attempt}: User created in Supabase Auth with real email "${email}".`,
      });
      setAttempt((a) => a + 1);
    } else {
      setResult({
        ok: false,
        message: `Attempt ${attempt}: ${data.error}`,
      });
    }
  }

  async function resetDemoUser() {
    if (!createdUserId) return;
    setResetting(true);

    const res = await fetch(
      `/api/demo/naive-signup?userId=${encodeURIComponent(createdUserId)}`,
      { method: "DELETE" }
    );

    const data = await res.json();
    setResetting(false);

    if (res.ok) {
      setCreatedUserId(null);
      setAttempt(1);
      setResult({
        ok: true,
        message: "Test auth user removed. The naive signup test can be repeated.",
      });
    } else {
      setResult({
        ok: false,
        message: data.error ?? "Failed to remove test auth user",
      });
    }
  }

  return (
    <>
      <h1>The Problem</h1>
      <p>
        Supabase Auth enforces <strong>global email uniqueness</strong> within a
        project. If you call <code>signUp</code> directly with the user&apos;s
        real email, the second tenant signup fails — even though the user should
        be treated as a completely new account there.
      </p>

      <div className="card">
        <h2>Naive signup (direct Supabase Auth)</h2>
        <p>
          The first attempt with an email succeeds; a second attempt with the same
          email is rejected by Supabase. <strong>Remove test user</strong> clears
          the auth row between attempts.
        </p>

        {result && (
          <div className={`alert ${result.ok ? "alert-success" : "alert-error"}`}>
            {result.message}
            {!result.ok && (
              <p className="alert-detail">
                This is the core multi-tenant pain point: one email cannot map
                to two independent auth users without a workaround.
              </p>
            )}
          </div>
        )}

        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            tryNaiveSignup();
          }}
        >
          <label>
            Email (same for both &quot;tenants&quot;)
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
              minLength={6}
            />
          </label>
          <div className="links-row">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Calling Supabase…" : `Naive signup (attempt ${attempt})`}
            </button>
            {createdUserId && (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={resetting}
                onClick={resetDemoUser}
              >
                {resetting ? "Removing…" : "Remove test user"}
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>What multi-tenant apps need</h2>
        <ul className="list-muted">
          <li>Same real email on two different orgs you create</li>
          <li>Different passwords per tenant (optional but common)</li>
          <li>Separate user IDs, sessions, and tenant-scoped data</li>
          <li>User never sees or types the internal auth email</li>
        </ul>
        <p style={{ marginBottom: 0 }}>
          See <Link href="/solution">The Solution</Link> — a little wrapper on
          top of Supabase Auth.
        </p>
      </div>
    </>
  );
}
