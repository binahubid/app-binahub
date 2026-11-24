import { messageLabels, type Booking, type ConsultantDetail, type ConsultantLead, type Proposal } from "./consultant-client";

export const clientListPath = "/konsultan/clients";
export const agendaPath = "/konsultan/tasks";
export const workSections = {
  summary: "Ringkasan",
  meeting: "Kebutuhan & meeting",
  proposal: "Proposal",
  followup: "Tindak lanjut",
} as const;
export type WorkSection = keyof typeof workSections;
const sectionIds = Object.keys(workSections) as WorkSection[];
export const workTargets = {
  meeting: ["checklist"],
  proposal: ["draft", "review"],
  followup: ["tasks", "email", "delivery", "activity"],
  summary: ["contact", "schedule", "handoff", "assignment"],
} as const;
export type WorkTarget = (typeof workTargets)[WorkSection][number];
export type WorkDestination = { section: WorkSection; target?: WorkTarget; proposalId?: string };

export const isRecordId = (value: string | null | undefined): value is string =>
  !!value && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);

export function readWorkDestination(params: Pick<URLSearchParams, "get">): WorkDestination {
  const value = params.get("step");
  const section = sectionIds.includes(value as WorkSection) ? value as WorkSection : "summary";
  const focus = params.get("focus");
  const chosenProposal = params.get("proposal");
  return {
    section,
    target: (workTargets[section] as readonly string[]).includes(focus ?? "") ? focus as WorkTarget : undefined,
    proposalId: isRecordId(chosenProposal) ? chosenProposal : undefined,
  };
}

export function workUrl(id: string, destination?: WorkDestination, returnTo?: string) {
  const params = new URLSearchParams();
  if (destination) {
    params.set("step", destination.section);
    if (destination.target) params.set("focus", destination.target);
    if (destination.proposalId) params.set("proposal", destination.proposalId);
  }
  if (returnTo) params.set("from", returnTo);
  const query = params.toString();
  return clientListPath + "/" + encodeURIComponent(id) + (query ? "?" + query : "");
}

export function readOwner(params: Pick<URLSearchParams, "get">, fallback: "mine" | "all") {
  const value = params.get("owner");
  return value === "mine" || value === "all" || value === "unassigned" || isRecordId(value) ? value : fallback;
}

export const directoryViews = ["all", "active", "won", "lost", "handoff"] as const;
export function readDirectoryView(params: Pick<URLSearchParams, "get">) {
  const view = params.get("view");
  return directoryViews.includes(view as (typeof directoryViews)[number]) ? view! : "all";
}

export function readPage(params: Pick<URLSearchParams, "get">) {
  const page = Number(params.get("page"));
  return Number.isInteger(page) && page >= 0 && page <= 10000 ? page : 0;
}

export function safeWorkReturn(from: string | null) {
  if (!from?.startsWith("/")) return clientListPath;
  const [path, query] = from.split("?", 2);
  if (path !== clientListPath && path !== agendaPath) return clientListPath;
  const raw = new URLSearchParams(query);
  const params = new URLSearchParams();
  const owner = readOwner(raw, "mine");
  if (owner !== "mine") params.set("owner", owner);
  const page = readPage(raw);
  if (page) params.set("page", String(page));
  if (path === agendaPath && raw.get("kind") === "bookings") params.set("kind", "bookings");
  const view = readDirectoryView(raw);
  if (path === clientListPath && view !== "all") params.set("view", view);
  return params.size ? path + "?" + params.toString() : path;
}

const bookingLabels: Readonly<Record<string, string>> = {
  requested: "Menunggu konfirmasi",
  confirmed: "Terkonfirmasi",
  rescheduled: "Dijadwal ulang",
  cancelled: "Dibatalkan",
  completed: "Selesai",
  no_show: "Tidak hadir",
};

export function bookingLabel(status: string) {
  return Object.hasOwn(bookingLabels, status) ? bookingLabels[status] : "Status jadwal belum diketahui";
}

export function appointmentTime(booking: Booking) {
  return booking.startTime || booking.start_time;
}

export function appointmentEnded(booking: Booking, now: number) {
  return Date.parse(booking.endTime || booking.end_time || "") < now;
}

export function meetingHref(booking: Booking) {
  const href = booking.meetingUrl || booking.meeting_url;
  if (!href || !["confirmed", "rescheduled"].includes(booking.status)) return;
  try {
    if (new URL(href).protocol === "https:") return href;
  } catch {
    return;
  }
}

export function isOpenOpportunity(record: ConsultantLead) {
  return !record.handoff && !["won", "lost"].includes(record.stage);
}

export function canAttachProposal(proposal: Proposal, revision: number | undefined) {
  return revision !== undefined && proposal.checklist_revision === revision;
}

type WorkAction = {
  status: string;
  description: string;
  label: string;
  destination: WorkDestination;
};

export function workAction(
  data: ConsultantDetail,
  canOperate: boolean,
  isAdmin: boolean,
  checklistComplete: boolean,
  now: number,
  checklistRevision: number | undefined,
): WorkAction {
  const { record } = data;
  const latest = data.proposals[0];
  const ready = latest && canAttachProposal(latest, checklistRevision);
  const sent = data.proposals.some((proposal) =>
    proposal.status === "sent" && canAttachProposal(proposal, checklistRevision));
  const email = data.messages[0];

  if (record.handoff) return {
    status: "Serah terima tercatat",
    description: "Kesepakatan sudah diserahkan ke admin untuk persiapan pelaksanaan.",
    label: "Lihat serah terima",
    destination: { section: "summary", target: "handoff" },
  };
  if (!record.assigneeId && isAdmin) return {
    status: "Belum ada penanggung jawab",
    description: "Tetapkan konsultan aktif agar pekerjaan klien ini bisa dimulai.",
    label: "Tetapkan penanggung jawab",
    destination: { section: "summary", target: "assignment" },
  };
  if (!canOperate) return {
    status: record.assigneeId ? "Peluang tim · Hanya baca" : "Menunggu penugasan admin",
    description: record.assigneeId ? "Lihat perkembangan dan riwayat pekerjaan konsultan yang ditugaskan."
      : "Admin perlu menetapkan penanggung jawab sebelum pekerjaan bisa dimulai.",
    label: "Lihat riwayat aktivitas",
    destination: { section: "followup", target: "activity" },
  };
  if (record.stage === "lost") return {
    status: "Tidak dilanjutkan",
    description: "Peluang sudah ditutup. Riwayatnya tersedia jika Anda perlu meninjau keputusan tersebut.",
    label: "Lihat riwayat aktivitas",
    destination: { section: "followup", target: "activity" },
  };
  if (record.stage === "won") return {
    status: "Program disepakati",
    description: sent ? "Catat arahan pelaksanaan untuk admin." : "Serah terima memerlukan proposal terbaru yang sudah dikirim. Periksa riwayat jika ada langkah yang belum tercatat.",
    label: sent ? "Siapkan serah terima" : "Periksa proposal",
    destination: sent ? { section: "summary", target: "handoff" } : { section: "proposal", target: "review" },
  };
  const nextMeeting = data.bookings.find((booking) => {
    const start = Date.parse(appointmentTime(booking) ?? "");
    const end = Date.parse(booking.endTime || booking.end_time || "");
    return meetingHref(booking) && start <= now + 15 * 60 * 1000 && end >= now;
  });
  if (nextMeeting) return {
    status: "Meeting segera dimulai",
    description: "Jadwal sudah terkonfirmasi. Buka tautan pada bagian jadwal konsultasi.",
    label: "Lihat jadwal meeting",
    destination: { section: "summary", target: "schedule" },
  };
  if (email && ["queued", "processing", "uncertain", "failed"].includes(email.status)) return {
    status: messageLabels[email.status],
    description: email.status === "uncertain" || email.status === "failed" ?
      "Periksa status dan penerima di riwayat sebelum menyiapkan pengiriman baru." :
      "Pantau status dan waktu kirim di riwayat pengiriman.",
    label: "Lihat status email",
    destination: { section: "followup", target: "delivery" },
  };
  const task = data.tasks.find((item) => item.status === "open" && Date.parse(item.due_at) <= now);
  if (task) return {
    status: "Tugas lewat tenggat",
    description: task.title,
    label: "Buka tugas",
    destination: { section: "followup", target: "tasks" },
  };
  const earlyStage = record.stage === "identified" || record.stage === "qualified";
  const scheduled = data.bookings.some((booking) => ["confirmed", "rescheduled"].includes(booking.status) && !appointmentEnded(booking, now));
  if (!checklistComplete && earlyStage && !scheduled) return {
    status: record.stage === "identified" ? "Peluang baru" : "Kebutuhan awal perlu diklarifikasi",
    description: "Periksa kontak dan jalur masuk. Hubungi klien untuk mengonfirmasi tujuan atau menyiapkan konsultasi.",
    label: "Tinjau kontak klien",
    destination: { section: "summary", target: "contact" },
  };
  if (!checklistComplete) return {
    status: "Checklist belum selesai",
    description: "Lengkapi pertanyaan wajib dan tandai sesi selesai untuk membuka penyusunan proposal.",
    label: "Lengkapi checklist",
    destination: { section: "meeting", target: "checklist" },
  };
  if (checklistRevision === undefined) return {
    status: "Checklist selesai",
    description: "Buka Proposal untuk memuat versi checklist terbaru.",
    label: "Susun proposal",
    destination: { section: "proposal", target: "draft" },
  };
  if (latest && !ready) return {
    status: "Proposal perlu revisi",
    description: "Kebutuhan berubah setelah proposal ini dibuat. Buat revisi dari checklist terbaru sebelum mengirim.",
    label: "Buat revisi",
    destination: { section: "proposal", target: "draft" },
  };
  if (latest?.status === "draft") return {
    status: "Draf siap ditinjau",
    description: "Periksa isi dan biaya pada PDF sebelum menyiapkan pengiriman.",
    label: "Tinjau proposal",
    destination: { section: "proposal", target: "review", proposalId: latest.id },
  };
  if (latest?.status === "sent") return {
    status: "Proposal sudah dikirim",
    description: "Catat balasan klien atau jadwalkan tindak lanjut. Jika klien setuju, catat serah terima.",
    label: "Tindak lanjuti klien",
    destination: { section: "followup", target: "email" },
  };
  return {
    status: "Checklist selesai",
    description: "Gunakan kebutuhan yang sudah ditinjau untuk membuat draf proposal.",
    label: "Susun proposal",
    destination: { section: "proposal", target: "draft" },
  };
}
