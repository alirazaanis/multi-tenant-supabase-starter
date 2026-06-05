"use client";

import Link from "next/link";
import { useState } from "react";
import {
  LAYOUT_OPTIONS,
  THEME_OPTIONS,
  type TenantLayout,
  type TenantTheme,
} from "@/lib/tenants";
import type { OrgSummary } from "@/lib/platform/org-types";

type Props = {
  org: OrgSummary;
  onChange: () => void;
  onError: (message: string) => void;
};

export function OrgCard({ org, onChange, onError }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteSlug, setDeleteSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(org.name);
  const [tagline, setTagline] = useState(org.tagline);
  const [theme, setTheme] = useState<TenantTheme>(org.theme);
  const [layout, setLayout] = useState<TenantLayout>(org.layout);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    const res = await fetch(`/api/platform/tenants/${org.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, tagline, theme, layout }),
    });

    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      onError(data.error ?? "Failed to update org");
      return;
    }

    setEditing(false);
    onChange();
  }

  async function deleteOrg() {
    if (deleteSlug !== org.slug) {
      onError("Type the slug exactly to confirm deletion.");
      return;
    }

    setBusy(true);
    const res = await fetch(`/api/platform/tenants/${org.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      onError(data.error ?? "Failed to delete org");
      return;
    }

    setConfirmDelete(false);
    setDeleteSlug("");
    onChange();
  }

  return (
    <div className={`card org-card org-card--${org.theme}`}>
      <span className="badge">{org.siteDomain}</span>
      <h3>{org.name}</h3>
      <p className="org-meta">
        URL slug: <code>/{org.slug}</code> (fixed after creation)
      </p>

      {editing ? (
        <form className="form org-edit-form" onSubmit={saveEdit}>
          <label>
            Organization name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Tagline
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} />
          </label>
          <div className="grid-2">
            <label>
              Theme
              <select value={theme} onChange={(e) => setTheme(e.target.value as TenantTheme)}>
                {THEME_OPTIONS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
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
          <div className="links-row">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={() => {
                setEditing(false);
                setName(org.name);
                setTagline(org.tagline);
                setTheme(org.theme);
                setLayout(org.layout);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <p>{org.tagline || "No tagline"}</p>
          <p className="org-meta">
            Theme: <strong>{org.theme}</strong> · Layout:{" "}
            <strong>{org.layout}</strong>
          </p>
          <div className="links-row">
            <Link href={org.customerSignupUrl} className="btn btn-primary">
              Customer signup
            </Link>
            <Link href={org.customerLoginUrl} className="btn btn-secondary">
              Customer login
            </Link>
          </div>
          <div className="links-row org-manage-row">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </button>
          </div>
        </>
      )}

      {confirmDelete && (
        <div className="org-delete-panel">
          <p>
            Delete <strong>{org.name}</strong> and all customer accounts on this
            org? Type <code>{org.slug}</code> to confirm.
          </p>
          <input
            value={deleteSlug}
            onChange={(e) => setDeleteSlug(e.target.value)}
            placeholder={org.slug}
            aria-label="Confirm slug"
          />
          <div className="links-row">
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy || deleteSlug !== org.slug}
              onClick={deleteOrg}
            >
              {busy ? "Deleting…" : "Delete org"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={() => {
                setConfirmDelete(false);
                setDeleteSlug("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
