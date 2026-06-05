"use client";

import { useState } from "react";

type ApiResult<T> = {
  ok: boolean;
  status: number;
  data: T;
};

function newIdempotencyKey(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function postJson<T>(
  url: string,
  body: unknown,
  options?: { idempotent?: boolean }
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options?.idempotent) {
    headers["Idempotency-Key"] = newIdempotencyKey();
  }

  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T;
  return { ok: res.ok, status: res.status, data };
}

export function useApiForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit<T extends { error?: string }>(
    url: string,
    body: unknown,
    onSuccess: (data: T) => void | Promise<void>,
    fallbackError = "Something went wrong. Please try again.",
    options?: { idempotent?: boolean }
  ) {
    setError(null);
    setLoading(true);

    try {
      const { ok, data } = await postJson<T>(url, body, options);
      if (!ok) {
        setError(data.error ?? fallbackError);
        return;
      }
      await onSuccess(data);
    } catch {
      setError(fallbackError);
    } finally {
      setLoading(false);
    }
  }

  return { error, loading, setError, submit };
}
