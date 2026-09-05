export function programAccessPath(programId: string, code?: string) {
  const params = new URLSearchParams({ program: programId });
  if (code?.trim()) params.set("code", code.trim().toUpperCase());
  return `/client/access?${params.toString()}`;
}

export function programAccessUrl(programId: string, origin: string, code?: string) {
  return `${origin.replace(/\/$/, "")}${programAccessPath(programId, code)}`;
}

export function programInvitationText({
  programId,
  code,
  title,
  origin,
}: {
  programId: string;
  code: string;
  title: string;
  origin: string;
}) {
  return [
    `Undangan Program BinaHub — ${title}`,
    `Buka tautan: ${programAccessUrl(programId, origin, code)}`,
    `Kode akses: ${code} (terisi otomatis dari tautan/QR)`,
    "Isi nama Anda untuk membuka modul program.",
  ].join("\n");
}
