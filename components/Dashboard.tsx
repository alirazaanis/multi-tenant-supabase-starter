"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createTenantClient } from "@/lib/supabase/client";
import type { ProfileSnapshot } from "@/lib/profile/load-profile";

type Props = {
  tenantSlug: string;
  tenantName: string;
  initialData: ProfileSnapshot;
};

export function Dashboard({ tenantSlug, tenantName, initialData }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialData.profile.display_name);
  const [notes, setNotes] = useState(initialData.profile.notes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveProfile() {
    setSaving(true);
    setSaved(false);
    setError(null);

    const res = await fetch(`/${tenantSlug}/api/profile`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, notes }),
    });

    setSaving(false);

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to save");
      return;
    }

    setSaved(true);
  }

  async function signOut() {
    await createTenantClient(tenantSlug).auth.signOut();
    router.push(`/${tenantSlug}/login`);
  }

  return (
    <div className="tenant-auth-panel tenant-dashboard-panel">
      <h1>Your workspace</h1>
      <p className="tenant-auth-subtitle">
        Signed in to <strong>{tenantName}</strong> as{" "}
        <strong>{initialData.realEmail}</strong>
      </p>

      {error && <div className="alert alert-error">{error}</div>}
      {saved && <div className="alert alert-success">Profile saved.</div>}

      <form
        className="form tenant-customer-form"
        onSubmit={(e) => {
          e.preventDefault();
          saveProfile();
        }}
      >
        <label>
          Display name
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={100}
          />
        </label>
        <label>
          Notes
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
          />
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      <div className="tenant-dashboard-meta">
        <p>
          This account exists only on {tenantName}. You can stay signed in to
          other orgs in other tabs at the same time.
        </p>
        <button type="button" className="btn btn-secondary" onClick={signOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}
