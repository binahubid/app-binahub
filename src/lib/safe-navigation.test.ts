import { describe, expect, it } from "vitest";
import { safeInternalPath } from "./safe-navigation";

describe("safeInternalPath", () => {
  it("preserves a local path, query, and hash", () => {
    expect(safeInternalPath("/home?tab=assessment#latest")).toBe("/home?tab=assessment#latest");
  });

  it.each([
    "https://evil.example/phish",
    "//evil.example/phish",
    "/\\evil.example/phish",
    "javascript:alert(1)",
  ])("rejects an unsafe redirect target: %s", (target) => {
    expect(safeInternalPath(target)).toBe("/home");
  });

  it("uses a caller-provided fallback", () => {
    expect(safeInternalPath(null, "/")).toBe("/");
  });
});
