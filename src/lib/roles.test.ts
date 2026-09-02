import { describe, expect, it } from "vitest";
import { isRole, roleHome } from "./roles";

describe("role routing", () => {
  it("menetapkan satu beranda kanonis per role", () => {
    expect(roleHome).toEqual({
      admin: "/admin/dashboard",
      client: "/client/program",
      facilitator: "/fasilitator/tbos",
      peserta: "/peserta/dashboard",
    });
  });

  it("menolak role di luar kontrak platform", () => {
    expect(isRole("admin")).toBe(true);
    expect(isRole("super-admin")).toBe(false);
  });
});
