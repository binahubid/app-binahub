"use client";

import { consultantDate, stageLabels, type ConsultantLead } from "@/lib/consultant-client";
import s from "./consultant.module.css";
import { useConsultantLocale } from "@/components/consultant-language";

const sourceAdvice = {
  recommendation: "Tinjau kebutuhan dan rekomendasi yang sudah diterima klien. Gunakan pengisian terkait pada Kebutuhan & meeting sebagai acuan klarifikasi.",
  assessment_team: "Bahas hasil diagnosis tim atau organisasi yang dibagikan klien, lalu konfirmasikan prioritas pengembangan dan dampaknya pada pekerjaan.",
  assessment_individual: "Mulai dari tujuan pengembangan pribadi dan hasil yang dibagikan klien. Sesuaikan pembahasan serta usulan dengan kebutuhan individu tersebut.",
  inquiry: "Baca permintaan informasi klien, kemudian klarifikasi tujuan, peserta, dan kebutuhan awal sebelum menyiapkan usulan.",
  consultation: "Tinjau jadwal konsultasi dan tanyakan tujuan pertemuan serta konteks kebutuhan yang belum tercatat.",
  outbound: "Tinjau konteks perkenalan dan respons terakhir sebelum menawarkan langkah pembahasan berikutnya.",
  unknown: "Konfirmasikan jalur perkenalan dan kebutuhan awal pada komunikasi pertama. Sumber belum dicatat secara pasti pada peluang ini.",
};
const stageAdvice: Record<string, string> = {
  identified: "Konfirmasikan kebutuhan awal dan tentukan langkah komunikasi pertama.",
  qualified: "Perjelas kebutuhan, peserta, dan kesiapan untuk berdiskusi.",
  consultation: "Siapkan meeting, tinjau informasi awal, dan lengkapi checklist kebutuhan.",
  proposal: "Periksa proposal yang telah dibuat atau dikirim dan jadwalkan pembahasan masukan.",
  negotiation: "Bahas masukan klien, sesuaikan usulan, dan catat kesepakatan terbaru.",
  won: "Tinjau kesepakatan dan catatan serah terima untuk kelanjutan pelaksanaan.",
  lost: "Baca alasan penutupan dan riwayat percakapan sebelum menentukan apakah ada tindak lanjut yang relevan.",
};

export function ConsultantContext({ record }: { record: ConsultantLead }) {
  const { t, locale } = useConsultantLocale();
  const kind = record.origin?.kind || "unknown";
  const source = record.origin?.label || "Sumber belum tercatat";
  return (
    <section className={s.clientContext} aria-label={t("Konteks klien")}>
      <dl>
        <div><dt>{t("Jalur masuk tercatat")}</dt><dd>{t(source)}</dd></div>
        <div><dt>{t("Tahap peluang")}</dt><dd>{t(stageLabels[record.stage] || "Tahap perlu dikonfirmasi")}</dd></div>
        {record.nextAction && <div><dt>{t("Langkah yang dicatat")}</dt><dd>{record.nextAction}</dd>
          {record.nextActionDueAt && <p className={s.muted}>{consultantDate(record.nextActionDueAt, locale)}</p>}</div>}
      </dl>
      <details>
        <summary>{t("Acuan penanganan klien")}</summary>
        <p>{t(record.origin?.status === "unavailable" ? "Gunakan Perbarui untuk mencoba memuat sumber kembali." : sourceAdvice[kind])}</p>
        <p>{t(stageAdvice[record.stage] || "Tinjau kebutuhan dan riwayat komunikasi klien.")}</p>
      </details>
    </section>
  );
}
