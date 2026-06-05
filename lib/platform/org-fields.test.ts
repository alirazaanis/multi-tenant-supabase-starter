import { describe, expect, it } from "vitest";
import {
  isValidTenantId,
  validateOrgCreateBody,
  validateOrgUpdateBody,
} from "@/lib/platform/org-fields";

describe("org-fields", () => {
  it("validates create body", () => {
    const ok = validateOrgCreateBody({
      name: "Acme",
      slug: "acme-corp",
      tagline: "Hello",
      theme: "light",
      layout: "centered",
    });
    expect("error" in ok).toBe(false);
    if (!("error" in ok)) {
      expect(ok.slug).toBe("acme-corp");
    }
  });

  it("rejects reserved slug on create", () => {
    const result = validateOrgCreateBody({
      name: "X",
      slug: "console",
    });
    expect(result).toEqual({ error: "This slug is reserved" });
  });

  it("validates update without slug", () => {
    const ok = validateOrgUpdateBody({ name: "Renamed", theme: "ocean" });
    expect("error" in ok).toBe(false);
  });

  it("validates tenant uuid", () => {
    expect(isValidTenantId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isValidTenantId("not-a-uuid")).toBe(false);
  });
});
