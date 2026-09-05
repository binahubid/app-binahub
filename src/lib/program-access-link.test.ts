import { describe, expect, it } from "vitest";
import { programAccessPath, programAccessUrl, programInvitationText } from "./program-access-link";

describe("program access links", () => {
  it("can bind the public link to one program without a code", () => {
    const path = programAccessPath("program-123");
    expect(path).toBe("/client/access?program=program-123");
    expect(path).not.toContain("SECRET-CODE");
  });

  it("builds a shareable invitation with an auto-fill code", () => {
    const text = programInvitationText({
      programId: "program-123",
      code: "BINA-2026",
      title: "Leadership Camp",
      origin: "https://app.binahub.id/",
    });
    expect(text).toContain("https://app.binahub.id/client/access?program=program-123&code=BINA-2026");
    expect(text).toContain("Kode akses: BINA-2026");
  });

  it("encodes a program code safely in a QR-ready URL", () => {
    expect(programAccessUrl("program-123", "https://app.binahub.id", "bina 2026"))
      .toBe("https://app.binahub.id/client/access?program=program-123&code=BINA+2026");
  });

  it("normalizes a trailing slash in the application origin", () => {
    expect(programAccessUrl("program-123", "https://app.binahub.id/"))
      .toBe("https://app.binahub.id/client/access?program=program-123");
  });
});
