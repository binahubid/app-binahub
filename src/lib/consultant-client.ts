import { apiFetch } from "./api-fetch";
export type ConsultantSession = {
  id: string;
  name: string;
  isAdmin: boolean;
  role: string;
};
export type ConsultantMember = { id: string; name: string; active: boolean };
export type ConsultantLead = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  stage: string;
  assigneeId: string | null;
  assigneeName: string;
  canEdit: boolean;
  version: number;
  assignmentRevision: number;
  checklistStatus: string;
  handoff: { note: string; requestedAt: string } | null;
  updatedAt: string;
  nextAction: string | null;
  nextActionDueAt: string | null;
};
export type Program = {
  code: string;
  name: string;
  dailyRateIdr: number | null;
  pricingModel: string;
  capacity: string;
};
export type Proposal = {
  id: string;
  revision: number;
  status: string;
  checklist_revision: number;
  created_at: string;
  snapshot: {
    programs: {
      code: string;
      name: string;
      objectives: string[];
      dailyRate: number | null;
      total: number | null;
    }[];
    days: number;
    participants: number;
    venue: string;
    location: string;
    scopeNote: string;
    total: number | null;
    priceNote: string;
    summary: {
      situation: string;
      problem: string;
      impact: string;
      outcome: string;
    };
  };
};
export type Task = {
  id: string;
  lead_id: string;
  title: string;
  due_at: string;
  status: string;
  revision: number;
  company?: string;
  assigneeId?: string;
  assigneeName?: string;
};
export type Booking = {
  id: string;
  leadId?: string;
  lead_id?: string;
  title: string;
  startTime?: string;
  start_time?: string;
  endTime?: string;
  status: string;
  meetingUrl?: string;
  meeting_url?: string;
  assigneeName?: string;
  company?: string;
};
export type Message = {
  id: string;
  kind: string;
  status: string;
  scheduled_at: string;
  envelope: {
    subject: string;
    body: string;
    to: string;
    senderName: string;
    replyTo: string;
  };
  error: string | null;
};
export type ConsultantDetail = {
  record: ConsultantLead;
  proposalDefaults?: {
    participants?: number;
    days?: number;
    venue?: string;
    location: string;
    spiritualOptIn: boolean;
  };
  workspace: {
    source_id: string | null;
    version: number;
    checklist_revision: number;
  } | null;
  tasks: Task[];
  proposals: Proposal[];
  messages: Message[];
  sources: { id: string; submittedAt: string; company: string }[];
  bookings: Booking[];
  activities: {
    id: string;
    event_type: string;
    note: string;
    actor: string;
    created_at: string;
  }[];
  activityTotal: number;
};
export type ConsultantList = {
  records: ConsultantLead[];
  members: ConsultantMember[];
  actorId: string;
  isAdmin: boolean;
  total: number;
  page: number;
  pageSize: number;
  summary: {
    opportunities: number;
    active: number;
    overdue: number;
    proposals: number;
    handoffs: number;
  };
  tasks: Task[];
  bookings: Booking[];
  catalog: Program[];
};
export async function consultantRequest<T>(
  path: string,
  body?: unknown,
  method = "POST",
  signal?: AbortSignal,
): Promise<T> {
  const r = await apiFetch(path, {
    cache: "no-store",
    signal,
    ...(body === undefined
      ? {}
      : {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  const v = await r.json();
  if (!r.ok)
    throw new Error(
      v.error || "Data belum dapat diproses. Coba perbarui halaman.",
    );
  return v as T;
}
export async function fetchConsultantFile(path: string, signal?: AbortSignal) {
  const r = await apiFetch(path, { cache: "no-store", signal });
  if (!r.ok) {
    const b = await r.json().catch(() => null);
    throw new Error(b?.error || "Dokumen belum tersedia.");
  }
  return r;
}
export async function downloadConsultantFile(path: string, filename: string) {
  const r = await fetchConsultantFile(path);
  const url = URL.createObjectURL(await r.blob()),
    a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export const stageLabels: Record<string, string> = {
  identified: "Baru",
  qualified: "Terkualifikasi",
  consultation: "Konsultasi",
  proposal: "Proposal",
  negotiation: "Pembahasan",
  won: "Disepakati",
  lost: "Tidak dilanjutkan",
};
export const messageLabels: Record<string, string> = {
  queued: "Menunggu jadwal",
  processing: "Sedang dikirim",
  accepted: "Diterima penyedia email",
  failed: "Gagal diproses",
  cancelled: "Dibatalkan",
  uncertain: "Pengiriman perlu diperiksa",
};
export const consultantDate = (v?: string | null) =>
  v
    ? new Date(v).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Belum dijadwalkan";
export const consultantMoney = (v: number | null) =>
  v === null ? "—" : "Rp" + v.toLocaleString("id-ID");
