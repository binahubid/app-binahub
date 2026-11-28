import { publicApiUrl as endpoint } from "@/lib/public-api";
import { readAssessmentJourneyId as journey } from "@/lib/attribution";

const codePattern = /^BH-[A-F0-9]{10}$/;
export type ReferralContext = { code: string; method: "link" | "manual"; expiresAt: string };
type ContextReply = { context: ReferralContext | null; bookingAvailable: boolean };
type CaptureReply = { data?: ContextReply; error?: "invalid" | "unavailable" };
const contextPath = "/api/referrals/context";

let capture: { code: string; promise: Promise<CaptureReply> } | undefined;
let lastContext: ContextReply | undefined;

export function referralCodeFromLink(search: string) {
  const code = new URLSearchParams(search).get("ref")?.trim().toUpperCase();
  return code && codePattern.test(code) ? code : undefined;
}

export async function applyReferral(rawCode: string, method: ReferralContext["method"]): Promise<CaptureReply> {
  const code = rawCode.trim().toUpperCase();
  if (!codePattern.test(code)) return { error: "invalid" };
  if (capture?.code === code) return capture.promise;
  if (capture) await capture.promise;
  if (capture) return applyReferral(code, method);

  const promise = (async (): Promise<CaptureReply> => {
    try {
      const response = await fetch(endpoint(contextPath), {
        method: "POST", credentials: "include", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({ code, method, journeyId: journey(window.location.search) }),
      });
      if (response.ok) {
        const data = await response.json() as ContextReply;
        lastContext = data;
        return { data };
      }
      return { error: response.status === 400 || response.status === 404 ? "invalid" : "unavailable" };
    } catch {
      return { error: "unavailable" };
    }
  })();
  capture = { code, promise };
  try { return await promise; } finally { if (capture?.promise === promise) capture = undefined; }
}

export function captureReferralFromLink(search: string) {
  const code = referralCodeFromLink(search);
  return code ? applyReferral(code, "link") : undefined;
}

export async function ensureReferralCapture() {
  if (capture) await capture.promise;
  else {
    const code = referralCodeFromLink(window.location.search);
    if (code && !lastContext?.context) await applyReferral(code, "link");
  }
}

export async function getReferral(): Promise<CaptureReply> {
  await ensureReferralCapture();
  try {
    const response = await fetch(endpoint(contextPath), {
      credentials: "include", cache: "no-store", signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return { error: "unavailable" };
    lastContext = await response.json() as ContextReply;
    return { data: lastContext };
  } catch {
    return { error: "unavailable" };
  }
}

export function referralBookingHref() {
  return endpoint("/api/referrals/book");
}
