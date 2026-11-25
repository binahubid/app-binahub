import { publicApiUrl } from "./public-api";
import type { ConsultantTutorial } from "./consultant-tutorials";

export class TutorialCatalogError extends Error {
  constructor(public status: number) { super("Tutorial catalog unavailable"); }
}
export const tutorialPrivateHeaders = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };

export async function readTutorialCatalog(authorization: string | null) {
  if (!authorization) throw new TutorialCatalogError(401);
  const response = await fetch(publicApiUrl("/api/konsultan/materials/catalog"), {
    headers: { Authorization: authorization }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8_000),
  });
  if (response.status === 401 || response.status === 403) throw new TutorialCatalogError(response.status);
  if (!response.ok) throw new TutorialCatalogError(503);
  const rows: unknown = await response.json();
  if (!Array.isArray(rows) || !rows.length || !rows.every((row) =>
    row && typeof row.id === "string" && /^[FS]\d{2}$/.test(row.id)
    && typeof row.duration === "string" && typeof row.title === "string"
    && typeof row.description === "string"
    && (row.series === "fitur" || row.series === "sop"),
  )) throw new TutorialCatalogError(503);
  return (rows as ConsultantTutorial[]).map(({ id, series, title, description, duration, versions }) => ({
    id, series, title, description, duration,
    versions: versions && Object.fromEntries(
      (["en", "mobile"] as const).flatMap((key) => {
        const value = versions[key];
        return value ? [[key, { title: value.title, description: value.description, duration: value.duration }]] : [];
      }),
    ),
  }));
}

export function tutorialFailure(error: unknown) {
  const status = error instanceof TutorialCatalogError ? error.status : 503;
  return Response.json({ error: status === 401 || status === 403
    ? "Masuk dengan akun konsultan yang aktif untuk membuka video."
    : "Video belum dapat dimuat. Coba lagi." }, { status, headers: tutorialPrivateHeaders });
}
