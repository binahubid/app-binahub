import { NextRequest, NextResponse } from "next/server";
import { safeInternalPath } from "@/lib/safe-navigation";
import { resolvePublicAppOrigin } from "@/lib/public-app-origin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };

export async function GET(request: NextRequest) {
  const ticket = request.nextUrl.searchParams.get("ticket");
  if (!ticket || !/^[A-Za-z0-9_-]{32,128}$/.test(ticket)) return redirectToSignIn(request, "ams_ticket_invalid");

  const apiUrl = (process.env.NEXT_PUBLIC_BINAHUB_API_URL || "https://api.binahub.id").replace(/\/$/, "");
  const supabase = request.nextUrl.searchParams.get("portal") === "konsultan" ? await createClient() : null;
  const existing = await supabase?.auth.getSession().catch(() => null);
  const accessToken = existing?.data.session?.access_token;
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/api/integrations/ams/session`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ ticket }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return redirectToSignIn(request, "ams_session_unavailable");
  }
  const login = await response.json().catch(() => null) as { success?: boolean; tokenHash?: string; nextPath?: string; reuseSession?: boolean } | null;
  if (!response.ok || !login?.success || !(login.tokenHash || (accessToken && login.reuseSession === true))) {
    return redirectToSignIn(request, response.status === 401 ? "ams_ticket_expired" : "ams_session_failed");
  }

  if (login.tokenHash) {
    const client = supabase ?? await createClient();
    const { error } = await client.auth.verifyOtp({ token_hash: login.tokenHash, type: "magiclink" });
    if (error) return redirectToSignIn(request, "ams_session_failed");
  }

  const destination = safeInternalPath(login.nextPath || "/fasilitator/tbos", "/fasilitator/tbos");
  return NextResponse.redirect(new URL(destination, resolvePublicAppOrigin(request.nextUrl.origin)), { status: 303, headers: privateHeaders });
}

function redirectToSignIn(request: NextRequest, reason: string) {
  const destination = new URL("/", resolvePublicAppOrigin(request.nextUrl.origin));
  destination.searchParams.set("mode", "signin");
  destination.searchParams.set("error", reason);
  return NextResponse.redirect(destination, { status: 303, headers: privateHeaders });
}
