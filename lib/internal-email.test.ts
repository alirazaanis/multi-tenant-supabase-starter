import { describe, expect, it } from "vitest";
import { toInternalEmail } from "@/lib/internal-email";

describe("toInternalEmail", () => {
  const tenantId = "550e8400-e29b-41d4-a716-446655440000";

  it("is deterministic for same email and tenant", () => {
    const a = toInternalEmail("Demo@Example.com", tenantId);
    const b = toInternalEmail("demo@example.com", tenantId);
    expect(a).toBe(b);
  });

  it("differs across tenants for the same real email", () => {
    const otherTenant = "660e8400-e29b-41d4-a716-446655440001";
    const a = toInternalEmail("demo@example.com", tenantId);
    const b = toInternalEmail("demo@example.com", otherTenant);
    expect(a).not.toBe(b);
  });

  it("uses internal domain suffix", () => {
    expect(toInternalEmail("a@b.com", tenantId)).toMatch(
      /@customers\.internal$/
    );
  });
});
