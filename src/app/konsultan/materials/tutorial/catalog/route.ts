import { publicApiUrl } from "@/lib/public-api";
import { type ConsultantTutorial } from "@/lib/consultant-tutorials";
import catalog from "./episodes.json";

const episodes: readonly ConsultantTutorial[] = catalog.map((episode) => ({
  ...episode,
  series: episode.series === "sop" ? "sop" : "fitur",
}));

const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const authorization = request.headers.get("Authorization");
  if (!authorization) {
    return Response.json(
      { error: "Masuk ke Portal Konsultan untuk membuka video." },
      { status: 401, headers },
    );
  }

  try {
    const session = await fetch(publicApiUrl("/api/konsultan/session"), {
      headers: { Authorization: authorization },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
    });
    if (session.status === 401 || session.status === 403) {
      return Response.json(
        { error: "Masuk dengan akun konsultan yang aktif untuk membuka video." },
        { status: session.status, headers },
      );
    }
    if (session.ok) return Response.json(episodes, { headers });
  } catch {
    // Handle a network or session service failure in the library.
  }

  return Response.json(
    { error: "Daftar video belum dapat dimuat. Coba lagi." },
    { status: 503, headers },
  );
}
