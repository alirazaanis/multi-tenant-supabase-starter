import { NextResponse } from "next/server";
import { CACHE } from "@/lib/constants";
import { TtlCache } from "@/lib/cache/ttl-cache";
import { getOpsClient } from "@/lib/supabase/ops";

type StoredResponse = {
  status: number;
  body: Record<string, unknown>;
};

const memoryStore = new TtlCache<StoredResponse>();

async function readFromDb(
  namespace: string,
  key: string
): Promise<StoredResponse | null> {
  const ops = getOpsClient();
  if (!ops) return null;

  const { data, error } = await ops
    .from("idempotency_keys")
    .select("status_code, body")
    .eq("namespace", namespace)
    .eq("key", key)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;

  return {
    status: data.status_code,
    body: data.body as Record<string, unknown>,
  };
}

async function writeToDb(
  namespace: string,
  key: string,
  status: number,
  body: Record<string, unknown>
): Promise<void> {
  const ops = getOpsClient();
  if (!ops) return;

  const expiresAt = new Date(Date.now() + CACHE.idempotencyMs).toISOString();

  await ops.from("idempotency_keys").upsert(
    {
      namespace,
      key,
      status_code: status,
      body,
      expires_at: expiresAt,
    },
    { onConflict: "namespace,key" }
  );
}

export async function readIdempotentResponse(
  namespace: string,
  key: string
): Promise<NextResponse | null> {
  const dbHit = await readFromDb(namespace, key);
  const hit = dbHit ?? memoryStore.get(`${namespace}:${key}`);
  if (!hit) return null;
  return NextResponse.json(hit.body, { status: hit.status });
}

export async function writeIdempotentResponse(
  namespace: string,
  key: string,
  status: number,
  body: Record<string, unknown>
): Promise<void> {
  memoryStore.set(`${namespace}:${key}`, { status, body }, CACHE.idempotencyMs);
  await writeToDb(namespace, key, status, body);
}

export function idempotencyKey(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const trimmed = headerValue.trim();
  if (trimmed.length < 8 || trimmed.length > 128) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return null;
  return trimmed;
}

/** Clears in-memory idempotency cache (test helper). */
export function clearIdempotencyCache(): void {
  memoryStore.clear();
}
