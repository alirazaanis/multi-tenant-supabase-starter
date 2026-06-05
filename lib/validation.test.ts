import { describe, expect, it } from "vitest";
import {
  normalizeEmail,
  normalizeSlug,
  validateDisplayName,
  validatePassword,
  validateSlug,
} from "@/lib/validation";

describe("validation", () => {
  it("normalizes email", () => {
    expect(normalizeEmail("  User@Example.COM ")).toBe("user@example.com");
  });

  it("validates password length", () => {
    expect(validatePassword("12345")).toMatch(/at least/);
    expect(validatePassword("123456")).toBeNull();
  });

  it("rejects reserved slugs", () => {
    expect(validateSlug("console")).toMatch(/reserved/);
  });

  it("accepts valid slugs", () => {
    expect(validateSlug(normalizeSlug("Acme-Corp"))).toBeNull();
  });

  it("validates display name length", () => {
    const tooLong = validateDisplayName("a".repeat(101), "fallback");
    expect("error" in tooLong && tooLong.error).toMatch(/at most/);
    expect(validateDisplayName("Jane", "fallback")).toEqual({
      displayName: "Jane",
    });
    expect(validateDisplayName("", "fallback")).toEqual({
      displayName: "fallback",
    });
  });
});
