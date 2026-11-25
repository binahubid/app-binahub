import { afterEach, expect, it, vi } from "vitest";
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getSession: async () => ({ data: { session: null } }) } }) }));
import { GET, HEAD } from "@/app/konsultan/materials/tutorial/media/[id]/route";
const context = { params: Promise.resolve({ id: "F21" }) };
afterEach(() => vi.unstubAllGlobals());

it("does not request a video from the API without a session", async () => {
  const fetchUpstream = vi.fn();
  vi.stubGlobal("fetch", fetchUpstream);
  expect((await GET(new Request("https://app.example.invalid/media"), context)).status).toBe(401);
  expect(fetchUpstream).not.toHaveBeenCalled();
});

it("forwards authorization, version and byte range only to the portal API", async () => {
  const fetchUpstream = vi.fn(async (_url: string, _init: RequestInit) => new Response(new Uint8Array(4), {
    status: 206, headers: { "Content-Type": "video/mp4", "Content-Range": "bytes 0-3/10", "Content-Length": "4" },
  }));
  vi.stubGlobal("fetch", fetchUpstream);
  const response = await GET(new Request("https://app.example.invalid/media?version=en&url=https://untrusted.invalid", {
    headers: { Authorization: "Bearer synthetic", Range: "bytes=0-3" },
  }), context);
  expect(response.status).toBe(206);
  expect(response.headers.get("Content-Range")).toBe("bytes 0-3/10");
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect((await response.arrayBuffer()).byteLength).toBe(4);
  const [url, request] = fetchUpstream.mock.calls[0];
  expect(new URL(url).pathname).toBe("/api/konsultan/materials/media/F21");
  expect(new URL(url).search).toBe("?version=en");
  expect(new Headers(request.headers).get("Range")).toBe("bytes=0-3");
});

it("passes through media HEAD metadata and never exposes upstream errors", async () => {
  const fetchUpstream = vi.fn().mockResolvedValueOnce(new Response(null, {
    headers: { "Content-Type": "video/mp4", "Content-Length": "100" },
  })).mockResolvedValueOnce(Response.json({ secret: "unpublished provider id" }, { status: 403 }));
  vi.stubGlobal("fetch", fetchUpstream);
  const request = new Request("https://app.example.invalid/media", { method: "HEAD", headers: { Authorization: "Bearer synthetic" } });
  const head = await HEAD(request, context);
  expect(head.headers.get("Content-Length")).toBe("100");
  const denied = await HEAD(request, context);
  expect(denied.status).toBe(403);
  expect(await denied.text()).not.toContain("unpublished provider id");
});
