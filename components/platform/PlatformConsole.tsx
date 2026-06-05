"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OrgSummary } from "@/lib/platform/org-types";
import { OrgCard } from "@/components/platform/OrgCard";
import { OrgCreateForm } from "@/components/platform/OrgCreateForm";

type TenantsResponse = {
  orgs?: OrgSummary[];
  nextCursor?: string | null;
  hasMore?: boolean;
  total?: number;
  error?: string;
};

export function PlatformConsole() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchOrgs = useCallback(
    async (opts: { cursor?: string | null; q?: string }) => {
      const params = new URLSearchParams();
      if (opts.cursor) params.set("cursor", opts.cursor);
      if (opts.q?.trim()) params.set("q", opts.q.trim());

      const res = await fetch(`/api/platform/tenants?${params}`, {
        credentials: "include",
      });

      if (res.status === 401) {
        router.push("/login");
        return null;
      }

      const data = (await res.json()) as TenantsResponse;
      if (!res.ok) {
        setError(data.error ?? "Failed to load orgs");
        return null;
      }

      return {
        orgs: data.orgs ?? [],
        nextCursor: data.nextCursor ?? null,
        hasMore: data.hasMore ?? false,
        total: data.total ?? 0,
      };
    },
    [router]
  );

  const loadPage = useCallback(
    async (opts: { cursor?: string | null; q?: string; append?: boolean }) => {
      if (opts.append) setLoadingMore(true);
      else setLoading(true);

      setError(null);
      const page = await fetchOrgs({ cursor: opts.cursor, q: opts.q });

      if (page) {
        setOrgs((prev) => (opts.append ? [...prev, ...page.orgs] : page.orgs));
        setNextCursor(page.nextCursor);
        setHasMore(page.hasMore);
        setTotal(page.total);
      }

      setLoading(false);
      setLoadingMore(false);
    },
    [fetchOrgs]
  );

  useEffect(() => {
    loadPage({ q: search });
  }, [search, loadPage]);

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
  }

  if (loading && orgs.length === 0) {
    return <p>Loading your orgs…</p>;
  }

  return (
    <>
      <div className="console-header">
        <div>
          <h1>Your organizations</h1>
          {total > 0 && (
            <p className="console-subtitle">
              {total} org{total === 1 ? "" : "s"}
              {search.trim() ? ` matching “${search.trim()}”` : ""}
            </p>
          )}
        </div>
        <button type="button" className="btn btn-secondary" onClick={signOut}>
          Sign out
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <OrgCreateForm
        onCreated={() => loadPage({ q: search })}
        onError={(message) => setError(message)}
      />

      <div className="card">
        <form
          className="form org-search-form"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput);
          }}
        >
          <label>
            Search orgs
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Name or slug…"
              maxLength={80}
            />
          </label>
          <div className="links-row">
            <button type="submit" className="btn btn-secondary">
              Search
            </button>
            {search && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                }}
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {orgs.length === 0 ? (
        <div className="card">
          <p>
            {search.trim()
              ? "No orgs match your search."
              : "No orgs yet — create your first one above."}
          </p>
        </div>
      ) : (
        <>
          <div className="org-grid">
            {orgs.map((org) => (
              <OrgCard
                key={org.id}
                org={org}
                onChange={() => loadPage({ q: search })}
                onError={(message) => setError(message)}
              />
            ))}
          </div>

          {hasMore && (
            <div className="pagination-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  loadPage({ cursor: nextCursor, q: search, append: true })
                }
                disabled={loadingMore}
              >
                {loadingMore ? "Loading…" : "Load more orgs"}
              </button>
            </div>
          )}
        </>
      )}

      {total >= 2 && !search.trim() && (
        <div className="card">
          <h2>Multi-org sessions</h2>
          <p>
            Two org customer signup URLs in <strong>separate tabs</strong> — the{" "}
            <strong>same email</strong> on both, with an independent session per
            org.
          </p>
        </div>
      )}
    </>
  );
}
