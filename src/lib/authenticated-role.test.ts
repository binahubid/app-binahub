import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAuthenticatedRole } from "./authenticated-role";

describe("fetchAuthenticatedRole", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("menolak token kosong tanpa memanggil jaringan", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(fetchAuthenticatedRole("  ")).resolves.toMatchObject({
      ok: false,
      status: 401,
      role: null,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("selalu mengirim bearer token dan tidak memakai cache", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      success: true,
      role: "admin",
      fullName: "Admin BinaHub",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));

    await expect(fetchAuthenticatedRole("access-token")).resolves.toEqual({
      ok: true,
      status: 200,
      role: "admin",
      fullName: "Admin BinaHub",
      error: "",
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/role", {
      headers: { Authorization: "Bearer access-token" },
      cache: "no-store",
    });
  });

  it("tidak mempercayai role yang tidak dikenal", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      success: true,
      role: "superadmin",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));

    await expect(fetchAuthenticatedRole("access-token")).resolves.toMatchObject({
      ok: false,
      status: 200,
      role: null,
    });
  });
});
