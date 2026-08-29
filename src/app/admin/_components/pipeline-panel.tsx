"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CircleDollarSign, MailWarning, Pencil, UserRoundX } from "lucide-react";
import type { DashboardData, PipelineLeadRecord } from "../_lib/types";
import { formatDate } from "../_lib/utils";
import { AdminInput, AdminModal, AdminSearch, AdminSelect, AdminTextarea, Badge, EmptyState, Panel, StatCard } from "./shared";

const STAGES = ["identified", "qualified", "consultation", "proposal", "negotiation", "won", "lost"] as const;
const STAGE_LABELS: Record<string, string> = {
  identified: "Teridentifikasi",
  qualified: "Qualified",
  consultation: "Konsultasi",
  proposal: "Proposal",
  negotiation: "Negosiasi",
  won: "Deal",
  lost: "Tidak Lanjut",
};

type PipelineForm = {
  stage: string;
  owner: string;
  nextAction: string;
  nextActionDueAt: string;
  opportunityValue: string;
  leadTimeZone: string;
  lostReason: string;
  outreachPaused: boolean;
  outreachPauseReason: string;
  note: string;
};

function toLocalDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formFromLead(lead: PipelineLeadRecord): PipelineForm {
  return {
    stage: lead.opportunityStage,
    owner: lead.opportunityOwner || "",
    nextAction: lead.nextAction || "",
    nextActionDueAt: toLocalDateTime(lead.nextActionDueAt),
    opportunityValue: lead.opportunityValue == null ? "" : String(lead.opportunityValue),
    leadTimeZone: lead.leadTimeZone || "Asia/Jakarta",
    lostReason: lead.lostReason || "",
    outreachPaused: lead.outreachPaused,
    outreachPauseReason: lead.outreachPauseReason || "",
    note: "",
  };
}

function rupiah(value: number | null) {
  if (value == null) return "Belum dinilai";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function dueTone(value: string | null) {
  if (!value) return "navy" as const;
  return new Date(value).getTime() < Date.now() ? "red" as const : "gold" as const;
}

export function PipelinePanel({
  data,
  onAction,
  onRefresh,
}: {
  data: DashboardData;
  onAction: (url: string, init?: RequestInit) => Promise<unknown>;
  onRefresh: () => Promise<void>;
}) {
  const leads = useMemo(() => data.pipelineLeads || [], [data.pipelineLeads]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PipelineLeadRecord | null>(null);
  const [form, setForm] = useState<PipelineForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const filtered = useMemo(() => {
    const keyword = search.toLowerCase();
    return leads.filter((lead) => [lead.name, lead.email, lead.company, lead.industry, lead.location, lead.opportunityOwner, lead.nextAction]
      .join(" ").toLowerCase().includes(keyword));
  }, [leads, search]);
  const activities = useMemo(() => (data.opportunityActivities || [])
    .filter((item) => item.leadId === selected?.id)
    .slice(0, 20), [data.opportunityActivities, selected?.id]);
  const activeFormStage = Boolean(form && ["qualified", "consultation", "proposal", "negotiation"].includes(form.stage));
  const formInvalid = !form
    || (form.stage !== "identified" && !form.owner.trim())
    || (activeFormStage && (!form.nextAction.trim() || !form.nextActionDueAt))
    || (form.stage === "lost" && form.lostReason.trim().length < 5);

  const openEditor = (lead: PipelineLeadRecord) => {
    setSelected(lead);
    setForm(formFromLead(lead));
    setError("");
  };
  const closeEditor = () => {
    setSelected(null);
    setForm(null);
    setError("");
  };
  const save = async () => {
    if (!selected || !form) return;
    setSaving(true);
    setError("");
    try {
      await onAction("/api/admin/pipeline", {
        method: "PATCH",
        body: JSON.stringify({
          leadId: selected.id,
          ...form,
          owner: form.owner || null,
          nextAction: form.nextAction || null,
          nextActionDueAt: form.nextActionDueAt ? new Date(form.nextActionDueAt).toISOString() : null,
          opportunityValue: form.opportunityValue === "" ? null : Number(form.opportunityValue),
          lostReason: form.lostReason || null,
          outreachPauseReason: form.outreachPauseReason || null,
          note: form.note || null,
        }),
      });
      closeEditor();
      await onRefresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Peluang gagal diperbarui.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Peluang aktif" value={data.summary.openOpportunities || 0} icon={CircleDollarSign} />
        <StatCard label="Next action terlambat" value={data.summary.overdueNextActions || 0} icon={CalendarClock} tone="danger" />
        <StatCard label="Belum ada owner" value={data.summary.unassignedOpportunities || 0} icon={UserRoundX} tone="gold" />
        <StatCard label="Alert deliverability" value={data.summary.deliverabilityAlerts || 0} icon={MailWarning} tone="danger" />
      </div>

      <Panel title="Sales Pipeline" action={`${filtered.length}/${leads.length} peluang`}>
        <div className="mb-5">
          <AdminSearch value={search} onChange={setSearch} placeholder="Cari nama, perusahaan, owner, atau next action…" />
        </div>
        {!leads.length ? (
          <EmptyState title="Belum ada peluang" description="Lead dari assessment, inquiry, atau booking Cal.com akan muncul di pipeline ini." />
        ) : (
          <div className="overflow-x-auto pb-3">
            <div className="grid min-w-[1680px] grid-cols-7 gap-3">
              {STAGES.map((stage) => {
                const stageLeads = filtered.filter((lead) => lead.opportunityStage === stage);
                return (
                  <section key={stage} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#0B2C6B]">{STAGE_LABELS[stage]}</h3>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-500">{stageLeads.length}</span>
                    </div>
                    <div className="space-y-3">
                      {stageLeads.map((lead) => (
                        <article key={lead.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900">{lead.name}</p>
                              <p className="mt-0.5 truncate text-xs text-slate-500">{lead.company}</p>
                              <p className="mt-1 truncate text-[10px] text-slate-400">{[lead.industry, lead.location].filter(Boolean).join(" · ") || lead.source}</p>
                            </div>
                            <button type="button" onClick={() => openEditor(lead)} aria-label={`Edit ${lead.name}`} className="rounded-lg border border-slate-200 p-1.5 text-[#0B2C6B] hover:border-[#D9A441]"><Pencil size={13} /></button>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            <Badge tone={lead.leadTemperature === "hot" ? "red" : lead.leadTemperature === "warm" ? "gold" : "navy"}>{lead.leadTemperature}</Badge>
                            {lead.outreachPaused && <Badge tone="red">Outreach dijeda</Badge>}
                          </div>
                          <dl className="mt-3 space-y-2 text-xs">
                            <div><dt className="text-slate-400">Owner</dt><dd className="truncate font-semibold text-slate-700">{lead.opportunityOwner || "Belum ditetapkan"}</dd></div>
                            <div><dt className="text-slate-400">Next action</dt><dd className="line-clamp-2 font-medium text-slate-700">{lead.nextAction || "Belum ditentukan"}</dd></div>
                            <div className="flex items-center justify-between gap-2"><dd><Badge tone={dueTone(lead.nextActionDueAt)}>{lead.nextActionDueAt ? formatDate(lead.nextActionDueAt) : "Tanpa tenggat"}</Badge></dd></div>
                          </dl>
                          <p className="mt-3 border-t border-slate-100 pt-3 text-xs font-bold text-[#0B2C6B]">{rupiah(lead.opportunityValue)}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Kesehatan Email" action={`${data.emailDeliverySummary?.total || 0} event terbaru`}>
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {[
            ["Delivered", data.emailDeliverySummary?.delivered || 0],
            ["Reply", data.emailDeliverySummary?.received || 0],
            ["Bounce", data.emailDeliverySummary?.bounced || 0],
            ["Complaint", data.emailDeliverySummary?.complained || 0],
            ["Failed", data.emailDeliverySummary?.failed || 0],
            ["Gagal diproses", data.emailDeliverySummary?.processingFailed || 0],
          ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-xl font-bold text-slate-900">{value}</p></div>)}
        </div>
      </Panel>

      {selected && form && (
        <AdminModal title={`${selected.name} · ${selected.company}`} eyebrow="Human control" onClose={closeEditor} maxWidth="max-w-5xl">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            <div className="space-y-4">
              {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-black/36">Tahap peluang</span><AdminSelect value={form.stage} onChange={(stage) => setForm({ ...form, stage })} options={STAGES.map((stage) => [stage, STAGE_LABELS[stage]])} /></label>
                <AdminInput label="Owner" value={form.owner} onChange={(owner) => setForm({ ...form, owner })} placeholder="nama@binahub.id" />
                <AdminInput label="Nilai peluang" type="number" value={form.opportunityValue} onChange={(opportunityValue) => setForm({ ...form, opportunityValue })} placeholder="0" />
                <AdminInput label="Zona waktu lead" value={form.leadTimeZone} onChange={(leadTimeZone) => setForm({ ...form, leadTimeZone })} />
                <div className="md:col-span-2"><AdminTextarea label="Next action" value={form.nextAction} onChange={(nextAction) => setForm({ ...form, nextAction })} placeholder="Tindakan konkret berikutnya dan siapa yang menunggu siapa." /></div>
                <AdminInput label="Tenggat next action" type="datetime-local" value={form.nextActionDueAt} onChange={(nextActionDueAt) => setForm({ ...form, nextActionDueAt })} />
                {form.stage === "lost" && <AdminInput label="Alasan tidak lanjut" value={form.lostReason} onChange={(lostReason) => setForm({ ...form, lostReason })} placeholder="Wajib minimal 5 karakter" />}
                <div className="md:col-span-2"><AdminTextarea label="Catatan audit" value={form.note} onChange={(note) => setForm({ ...form, note })} placeholder="Tuliskan konteks keputusan agar dapat ditelusuri tim." /></div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <label className="flex items-start gap-3 text-sm font-semibold text-slate-800"><input type="checkbox" checked={form.outreachPaused} onChange={(event) => setForm({ ...form, outreachPaused: event.target.checked })} className="mt-1" /><span>Jeda outreach otomatis<span className="mt-1 block text-xs font-normal leading-relaxed text-slate-600">Gunakan saat lead membalas, sedang konsultasi, ada risiko deliverability, atau memerlukan penanganan khusus.</span></span></label>
                {form.outreachPaused && <div className="mt-3"><AdminInput label="Alasan jeda" value={form.outreachPauseReason} onChange={(outreachPauseReason) => setForm({ ...form, outreachPauseReason })} /></div>}
              </div>
              {formInvalid && <p className="text-xs leading-relaxed text-amber-700">Tahap aktif/selesai wajib memiliki owner. Tahap aktif juga wajib memiliki next action dan tenggat; tahap lost wajib memiliki alasan.</p>}
              <button type="button" disabled={saving || formInvalid} onClick={() => void save()} className="w-full rounded-xl bg-[#0B2C6B] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? "Menyimpan…" : "Simpan Perubahan"}</button>
            </div>
            <aside>
              <div className="mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-[#D9A441]" /><h4 className="text-sm font-bold text-slate-900">Jejak aktivitas</h4></div>
              <div className="space-y-3">
                {activities.length ? activities.map((activity) => (
                  <article key={activity.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-bold text-[#0B2C6B]">{activity.eventType.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{activity.note || `${activity.fromStage || "-"} → ${activity.toStage || "-"}`}</p>
                    <p className="mt-2 text-[10px] text-slate-400">{activity.actor} · {formatDate(activity.createdAt)}</p>
                  </article>
                )) : <p className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-500">Belum ada aktivitas tercatat.</p>}
              </div>
            </aside>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
