import { createClient } from "@/lib/supabase/server";
import { TutorialCatalogError, tutorialFailure, tutorialPrivateHeaders } from "@/lib/consultant-tutorial-catalog-server";
import { publicApiUrl } from "@/lib/public-api";
import { isTutorialVersion } from "@/lib/consultant-tutorials";

async function media(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    let authorization = request.headers.get("Authorization");
    if (!authorization) {
      const supabase = await createClient();
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) authorization = `Bearer ${data.session.access_token}`;
    }
    if (!authorization) throw new TutorialCatalogError(401);
    const { id } = await context.params;
    const version = new URL(request.url).searchParams.get("version") ?? "id";
    if (!/^[FS]\d{2}$/.test(id) || !isTutorialVersion(version)) throw new TutorialCatalogError(404);

    const range = request.headers.get("Range");
    const response = await fetch(publicApiUrl(`/api/konsultan/materials/media/${id}?version=${version}`), {
      method: request.method,
      headers: { Authorization: authorization, ...(range ? { Range: range } : {}) },
      signal: request.signal,
      cache: "no-store",
      redirect: "error",
    });
    if (response.status === 416) return new Response(null, { status: 416, headers: tutorialPrivateHeaders });
    if (![200, 206].includes(response.status) || !response.headers.get("Content-Type")?.startsWith("video/mp4")) {
      await response.body?.cancel();
      throw new TutorialCatalogError([401, 403, 404].includes(response.status) ? response.status : 503);
    }

    const headers = new Headers({ ...tutorialPrivateHeaders, "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes", "Content-Disposition": "inline", "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "same-origin", Vary: "Cookie, Authorization" });
    for (const name of ["Content-Length", "Content-Range"]) {
      const value = response.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(response.body, { status: response.status, headers });
  } catch (error) { return tutorialFailure(error); }
}

export const GET = media;
export const HEAD = media;
