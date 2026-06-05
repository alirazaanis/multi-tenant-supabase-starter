import { describe, expect, it } from "vitest";
import {
  decodeOrgCursor,
  encodeOrgCursor,
} from "@/lib/pagination/cursor";

describe("org list cursor", () => {
  it("round-trips createdAt and id", () => {
    const cursor = {
      createdAt: "2026-06-05T12:00:00.000Z",
      id: "550e8400-e29b-41d4-a716-446655440000",
    };
    const encoded = encodeOrgCursor(cursor);
    expect(decodeOrgCursor(encoded)).toEqual(cursor);
  });

  it("returns null for invalid cursor", () => {
    expect(decodeOrgCursor("not-valid")).toBeNull();
    expect(decodeOrgCursor("")).toBeNull();
  });
});
