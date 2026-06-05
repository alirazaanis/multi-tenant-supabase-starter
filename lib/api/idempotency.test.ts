import { describe, expect, it } from "vitest";
import {
  clearIdempotencyCache,
  idempotencyKey,
  readIdempotentResponse,
  writeIdempotentResponse,
} from "@/lib/api/idempotency";

describe("idempotency", () => {
  it("accepts valid keys", () => {
    expect(idempotencyKey("abc12345")).toBe("abc12345");
    expect(idempotencyKey("short")).toBeNull();
    expect(idempotencyKey("bad key!")).toBeNull();
  });

  it("stores and returns cached responses", async () => {
    clearIdempotencyCache();
    await writeIdempotentResponse("test", "key-12345678", 200, { ok: true });
    const res = await readIdempotentResponse("test", "key-12345678");
    expect(res).not.toBeNull();
    const json = await res!.json();
    expect(json).toEqual({ ok: true });
  });
});
