"use client";

import { useState } from "react";
import {
  LAYOUT_OPTIONS,
  THEME_OPTIONS,
  type TenantLayout,
  type TenantTheme,
} from "@/lib/tenants";

type Props = {
  onCreated: () => void;
  onError: (message: string) => void;
};

export function OrgCreateForm({ onCreated, onError }: Props) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [theme, setTheme] = useState<TenantTheme>("light");
  const [layout, setLayout] = useState<TenantLayout>("centered");

  function suggestSlug(value: string) {
    setSlug(
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 48)
    );
  }

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    const res = await fetch("/api/platform/tenants", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, tagline, theme, layout }),
    });

    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      onError(data.error ?? "Failed to create org");
      return;
    }

    setName("");
    setSlug("");
    setTagline("");
    onCreated();
  }

  return (
    <div className="card">
      <h2>Create a new org</h2>
      <p>
        Each org gets its own customer-facing site at{" "}
        <code>/{slug || "your-slug"}/signup</code> — pick a theme so each feels
        like a separate product.
      </p>
      <form className="form" onSubmit={createOrg}>
        <label>
          Organization name
          <input
            value={name}
            onChange={(e) => {
              const v = e.target.value;
              setName(v);
              if (!slug) suggestSlug(v);
            }}
            placeholder="Acme Corp"
            required
          />
        </label>
        <label>
          URL slug
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="acme-corp"
            required
          />
        </label>
        <label>
          Tagline (shown on customer site)
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Modern workspace for teams"
          />
        </label>
        <div className="grid-2">
          <label>
            Theme
            <select value={theme} onChange={(e) => setTheme(e.target.value as TenantTheme)}>
              {THEME_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} — {t.description}
                </option>
              ))}
            </select>
          </label>
          <label>
            Layout
            <select value={layout} onChange={(e) => setLayout(e.target.value as TenantLayout)}>
              {LAYOUT_OPTIONS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" className="btn btn-primary" disabled={creating}>
          {creating ? "Creating…" : "Create org"}
        </button>
      </form>
    </div>
  );
}
