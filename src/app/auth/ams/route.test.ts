import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ getSession: vi.fn(), verifyOtp: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth }) }));

import { GET } from "./route";

const callback = "https://app.binahub.id/auth/ams?ticket=" + "L".repeat(43);

describe("AMS handoff to App", () => {
  beforeEach(() => {
    auth.getSession.mockReset();
    auth.verifyOtp.mockReset();
    auth.verifyOtp.mockResolvedValue({ error: null });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("reuses an existing session only when the API confirms the handoff", async () => {
    auth.getSession.mockResolvedValue({ data: { session: { access_token: "existing-app-session" } } });
    const exchange = vi.fn(async (_url: string, init: RequestInit) => {
      expect(new Headers(init.headers).get("authorization")).toBe("Bearer existing-app-session");
      return Response.json({ success: true, reuseSession: true, nextPath: "/konsultan" });
    });
    vi.stubGlobal("fetch", exchange);
    const response = await GET(new NextRequest(callback + "&portal=konsultan"));
    expect(new URL(response.headers.get("location")!).pathname).toBe("/konsultan");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(auth.verifyOtp).not.toHaveBeenCalled();
    expect(exchange).toHaveBeenCalledOnce();
  });

  it("verifies a fresh magic link for a new session and leaves program handoff independent", async () => {
    const exchange = vi.fn(async () => Response.json({ success: true, tokenHash: "temporary-hash", nextPath: "/fasilitator/tbos" }));
    vi.stubGlobal("fetch", exchange);
    const response = await GET(new NextRequest(callback));
    expect(new URL(response.headers.get("location")!).pathname).toBe("/fasilitator/tbos");
    expect(auth.getSession).not.toHaveBeenCalled();
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: "temporary-hash", type: "magiclink" });
  });

  it("does not enter the portal when the ticket is rejected", async () => {
    auth.getSession.mockResolvedValue({ data: { session: { access_token: "existing-app-session" } } });
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ success: false }, { status: 401 })));
    const response = await GET(new NextRequest(callback + "&portal=konsultan"));
    expect(new URL(response.headers.get("location")!).searchParams.get("error")).toBe("ams_ticket_expired");
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });
});
