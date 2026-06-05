import { NextRequest, NextResponse } from "next/server";
import { getOpsClient } from "@/lib/supabase/ops";

type Bucket = { count: number; resetAt: number };

const memoryStore = new Map<string, Bucket>();
let lastPruneAt = 0;
const PRUNE_INTERVAL_MS = 60_000;
const MAX_BUCKETS = 10_000;

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };

function pruneMemoryStore(now: number): void {
  if (now - lastPruneAt < PRUNE_INTERVAL_MS) return;
  lastPruneAt = now;
  for (const [key, bucket] of memoryStore) {
    if (now >= bucket.resetAt) memoryStore.delete(key);
  }
  if (memoryStore.size <= MAX_BUCKETS) return;
  const overflow = memoryStore.size - MAX_BUCKETS;
  const keys = memoryStore.keys();
  for (let i = 0; i < overflow; i++) {
    const k = keys.next().value;
    if (k) memoryStore.delete(k);
  }
}

function checkMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  pruneMemoryStore(now);

  let bucket = memoryStore.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    memoryStore.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return { allowed: true };
}

async function checkDbRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult | null> {
  const ops = getOpsClient();
  if (!ops) return null;

  const now = Date.now();
  const resetAt = new Date(now + windowMs).toISOString();

  const { data: existing } = await ops
    .from("rate_limit_buckets")
    .select("count, reset_at")
    .eq("bucket_key", key)
    .maybeSingle();

  if (!existing || new Date(existing.reset_at).getTime() <= now) {
    await ops.from("rate_limit_buckets").upsert(
      { bucket_key: key, count: 1, reset_at: resetAt },
      { onConflict: "bucket_key" }
    );
    return { allowed: true };
  }

  const nextCount = existing.count + 1;
  const retryAfterSec = Math.max(
    1,
    Math.ceil((new Date(existing.reset_at).getTime() - now) / 1000)
  );

  if (nextCount > limit) {
    return { allowed: false, retryAfterSec };
  }

  await ops
    .from("rate_limit_buckets")
    .update({ count: nextCount })
    .eq("bucket_key", key);

  return { allowed: true };
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const dbResult = await checkDbRateLimit(key, limit, windowMs);
  if (dbResult) return dbResult;
  return checkMemoryRateLimit(key, limit, windowMs);
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimitResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    }
  );
}

export async function parseJsonBody<T>(
  request: NextRequest
): Promise<T | NextResponse> {
  try {
    return (await request.json()) as T;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

export function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

export async function enforceRateLimit(
  request: NextRequest,
  namespace: string,
  limit: number,
  windowMs: number
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const result = await checkRateLimit(`${namespace}:${ip}`, limit, windowMs);
  if (!result.allowed) {
    return rateLimitResponse(result.retryAfterSec);
  }
  return null;
}

/** Clears in-memory rate-limit state (test helper). */
export function clearRateLimitStore(): void {
  memoryStore.clear();
  lastPruneAt = 0;
}
