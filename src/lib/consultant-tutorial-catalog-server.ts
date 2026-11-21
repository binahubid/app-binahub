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
    && typeof row.drive?.fileId === "string" && /^[\w-]{20,100}$/.test(row.drive.fileId),
  )) throw new TutorialCatalogError(503);
  return rows as ConsultantTutorial[];
}

export function tutorialFailure(error: unknown) {
  const status = error instanceof TutorialCatalogError ? error.status : 503;
  return Response.json({ error: status === 401 || status === 403
    ? "Masuk dengan akun konsultan yang aktif untuk membuka video."
    : "Video belum dapat dimuat. Coba lagi atau buka di Drive." }, { status, headers: tutorialPrivateHeaders });
}
