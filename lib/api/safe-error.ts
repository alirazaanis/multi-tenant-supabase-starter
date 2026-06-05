const FRIENDLY = "Something went wrong. Please try again.";

/** Never expose raw Postgres/Supabase messages to API clients. */
export function safeErrorMessage(
  error: { message?: string } | null | undefined,
  fallback = FRIENDLY
): string {
  return fallback;
}

export function mapRpcError(message: string | undefined): {
  error: string;
  status: number;
} {
  const msg = message ?? "";

  if (msg.includes("Maximum of")) {
    return { error: msg, status: 400 };
  }
  if (msg.includes("slug is already taken") || msg.includes("unique")) {
    return { error: "This URL slug is already taken", status: 409 };
  }
  if (msg.includes("Platform owner")) {
    return { error: "Platform owner account required", status: 403 };
  }
  if (msg.includes("Organization not found")) {
    return { error: "Organization not found", status: 404 };
  }
  if (msg.includes("Customer accounts cannot")) {
    return { error: "This account cannot register as a platform owner", status: 403 };
  }

  return { error: FRIENDLY, status: 500 };
}
