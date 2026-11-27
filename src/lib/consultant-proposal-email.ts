import type { ConsultantDetail, Proposal } from "./consultant-client";

export function consultantEmailDraft(detail: ConsultantDetail, locale: "id" | "en", proposal?: Proposal) {
  const en = locale === "en";
  const company = (detail.record.company || detail.record.name).replace(/[\r\n]/g, " ");
  if (proposal) {
    const programs = proposal.snapshot.programs;
    const plan = programs.slice(0, 3).map(program => program.name).join(", ");
    const subject = (en ? `Program partnership proposal | ${company}` : `Usulan kerja sama program | ${company}`).slice(0, 180);
    const body = en
      ? `Following our discussion about ${company}'s development needs, I am sharing BinaHub's program partnership proposal for ${plan}. The attachment outlines the delivery scope, expected outputs, and proposed investment.\n\nPlease let me know whether the proposed scope and timing suit your team. Once I receive your feedback, I can confirm the details for approval and prepare for delivery.`
      : `Sebagai tindak lanjut pembahasan kebutuhan pengembangan ${company}, saya lampirkan usulan kerja sama BinaHub untuk ${plan}. Dokumen ini memuat ruang lingkup pelaksanaan, hasil yang dituju, dan estimasi investasi.\n\n${proposal.snapshot.nextStep || "Mohon konfirmasi kesesuaian ruang lingkup dan pilihan jadwal. Setelah menerima masukan Anda, saya akan menyiapkan rincian pelaksanaan untuk persetujuan."}`;
    return { subject, body };
  }
  if (detail.initialRecommendation?.sentAt) return en
    ? { subject: `Follow-up on BinaHub's program recommendation | ${company}`.slice(0, 180),
      body: "I am following up on the program recommendation BinaHub shared with your team. I would be happy to discuss how the proposed approach fits your priorities.\n\nPlease let me know which program or outcome you would like to explore further, or when would be a convenient time to speak." }
    : { subject: `Tindak lanjut rekomendasi program BinaHub | ${company}`.slice(0, 180),
      body: "Saya menindaklanjuti rekomendasi program yang sudah BinaHub kirimkan untuk tim Anda. Saya siap membahas bagaimana pendekatan tersebut dapat mendukung prioritas pengembangan Anda.\n\nMohon sampaikan program atau sasaran yang ingin dibahas lebih lanjut. Jika lebih mudah dibicarakan langsung, silakan usulkan waktu yang sesuai." };
  return { subject: "", body: "" };
}
