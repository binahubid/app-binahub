"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BriefcaseBusiness,
  CalendarCheck,
  CircleDollarSign,
  ClipboardCheck,
  HeartHandshake,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import type {
  ClientAccountRecord,
  ClientStakeholderRecord,
  DashboardData,
  DeliveryProjectRecord,
  PipelineLeadRecord,
  ProjectMilestoneRecord,
  RetentionOpportunityRecord,
} from "../_lib/types";
import { formatDate } from "../_lib/utils";
import {
  AdminInput,
  AdminModal,
  AdminSearch,
  AdminSelect,
  AdminTextarea,
  Badge,
  EmptyState,
  FieldLabel,
  Panel,
  StatCard,
} from "./shared";

type ModalName = "handoff" | "account" | "stakeholder" | "project" | "milestone" | "health" | "retention" | null;

const CLIENT_STATUS: Array<[string, string]> = [["onboarding", "Onboarding"], ["active", "Aktif"], ["at_risk", "Berisiko"], ["inactive", "Tidak Aktif"], ["churned", "Churned"]];
const RETAIN_STATUS: Array<[string, string]> = [["monitoring", "Monitoring"], ["opportunity", "Ada Peluang"], ["renewal_due", "Renewal Due"], ["expanded", "Expanded"], ["churned", "Churned"]];
const DELIVERY_STAGE: Array<[string, string]> = [["handoff", "Handoff"], ["kickoff", "Kickoff"], ["planning", "Planning"], ["in_progress", "In Progress"], ["at_risk", "At Risk"], ["on_hold", "On Hold"], ["completed", "Completed"], ["cancelled", "Cancelled"]];
const RISK_LEVEL: Array<[string, string]> = [["low", "Low"], ["medium", "Medium"], ["high", "High"], ["critical", "Critical"]];
const HEALTH_LEVEL: Array<[string, string]> = [["healthy", "Healthy"], ["watch", "Watch"], ["at_risk", "At Risk"], ["critical", "Critical"]];
const MILESTONE_STATUS: Array<[string, string]> = [["planned", "Planned"], ["in_progress", "In Progress"], ["blocked", "Blocked"], ["completed", "Completed"], ["cancelled", "Cancelled"]];
const STAKEHOLDER_ROLE: Array<[string, string]> = [["sponsor", "Sponsor"], ["decision_maker", "Decision Maker"], ["champion", "Champion"], ["pic", "PIC"], ["buyer", "Buyer"], ["user", "User"], ["blocker", "Blocker"], ["other", "Lainnya"]];
const RETENTION_TYPE: Array<[string, string]> = [["renewal", "Renewal"], ["upsell", "Upsell"], ["cross_sell", "Cross-sell"], ["repeat", "Repeat Order"], ["referral", "Referral"]];
const RETENTION_STATUS: Array<[string, string]> = [["identified", "Identified"], ["qualified", "Qualified"], ["proposal", "Proposal"], ["won", "Won"], ["lost", "Lost"], ["on_hold", "On Hold"]];

const inputButton = "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-xs font-bold text-white transition hover:bg-[#071B3D] disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton = "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-[#0B2C6B] transition hover:border-[#D9A441] disabled:opacity-50";

function rupiah(value: number | null | undefined) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);
}

function toLocalDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toneForRisk(value: string) {
  if (["critical", "at_risk", "high", "churned"].includes(value)) return "red" as const;
  if (["watch", "medium", "onboarding"].includes(value)) return "gold" as const;
  if (["healthy", "active", "low", "expanded"].includes(value)) return "green" as const;
  return "navy" as const;
}

export function ClientDeliveryPanel({
  data,
  onAction,
  onRefresh,
}: {
  data: DashboardData;
  onAction: (url: string, init?: RequestInit) => Promise<unknown>;
  onRefresh: () => Promise<void>;
}) {
  const accounts = useMemo(() => data.clientAccounts || [], [data.clientAccounts]);
  const [search, setSearch] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalName>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [handoffLead, setHandoffLead] = useState<PipelineLeadRecord | null>(null);
  const [editStakeholder, setEditStakeholder] = useState<ClientStakeholderRecord | null>(null);
  const [editMilestone, setEditMilestone] = useState<ProjectMilestoneRecord | null>(null);
  const [editRetention, setEditRetention] = useState<RetentionOpportunityRecord | null>(null);

  const [handoffForm, setHandoffForm] = useState({ commercialOwner: "", deliveryOwner: "", projectTitle: "", kickoffDate: "" });
  const [accountForm, setAccountForm] = useState({ status: "onboarding", commercialOwner: "", deliveryOwner: "", nextReviewAt: "", renewalDate: "", retainStatus: "monitoring", notes: "", changeReason: "" });
  const [stakeholderForm, setStakeholderForm] = useState({ name: "", email: "", phone: "", roleTitle: "", department: "", relationshipRole: "pic", isPrimary: false, active: true, notes: "" });
  const [projectForm, setProjectForm] = useState({ deliveryStage: "handoff", deliveryOwner: "", startDate: "", endDate: "", deliveryGoal: "", successMetrics: "", riskLevel: "low", riskSummary: "", note: "" });
  const [milestoneForm, setMilestoneForm] = useState({ title: "", description: "", owner: "", dueDate: "", status: "planned", progress: "0", weight: "0", blockerReason: "" });
  const [healthForm, setHealthForm] = useState({ deliveryScore: "3", engagementScore: "3", sentimentScore: "3", commercialScore: "3", riskLevel: "watch", riskReasons: "", notes: "", nextAction: "", nextActionDueAt: "" });
  const [retentionForm, setRetentionForm] = useState({ opportunityType: "repeat", status: "identified", owner: "", estimatedValue: "", expectedCloseDate: "", nextAction: "", nextActionDueAt: "", lostReason: "", humanApproved: false, approvalNote: "", moduleNotes: "" });

  const filteredAccounts = useMemo(() => {
    const keyword = search.toLowerCase();
    return accounts.filter((account) => [account.organizationName, account.industry, account.location, account.commercialOwner, account.deliveryOwner, account.status, account.healthStatus]
      .join(" ").toLowerCase().includes(keyword));
  }, [accounts, search]);
  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) || filteredAccounts[0] || accounts[0] || null;
  const accountProjects = (data.deliveryProjects || []).filter((project) => project.clientAccountId === selectedAccount?.id);
  const selectedProject = accountProjects.find((project) => project.id === selectedProjectId) || accountProjects[0] || null;
  const stakeholders = (data.clientStakeholders || []).filter((item) => item.clientAccountId === selectedAccount?.id);
  const milestones = (data.projectMilestones || []).filter((item) => item.projectId === selectedProject?.id);
  const healthReviews = (data.accountHealthReviews || []).filter((item) => item.clientAccountId === selectedAccount?.id).slice(0, 5);
  const retentionOpportunities = (data.retentionOpportunities || []).filter((item) => item.clientAccountId === selectedAccount?.id);
  const activities = (data.clientActivities || []).filter((item) => item.clientAccountId === selectedAccount?.id).slice(0, 20);
  const convertedLeadIds = new Set([
    ...accounts.map((account) => account.sourceLeadId),
    ...(data.deliveryProjects || []).filter((project) => project.initialHandoff).map((project) => project.sourceLeadId),
  ].filter((leadId): leadId is string => Boolean(leadId)));
  const wonAwaitingHandoff = (data.pipelineLeads || []).filter((lead) => lead.opportunityStage === "won" && !convertedLeadIds.has(lead.id));

  const closeModal = () => {
    setModal(null);
    setError("");
    setHandoffLead(null);
    setEditStakeholder(null);
    setEditMilestone(null);
    setEditRetention(null);
  };

  const execute = async (work: () => Promise<void>) => {
    setSaving(true);
    setError("");
    try {
      await work();
      closeModal();
      await onRefresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Aksi Fase 3 gagal diproses.");
    } finally {
      setSaving(false);
    }
  };

  const openHandoff = (lead: PipelineLeadRecord) => {
    setHandoffLead(lead);
    setHandoffForm({
      commercialOwner: lead.opportunityOwner || "",
      deliveryOwner: "",
      projectTitle: `${lead.company} — Initial Delivery`,
      kickoffDate: "",
    });
    setModal("handoff");
  };
  const openAccount = (account: ClientAccountRecord) => {
    setAccountForm({
      status: account.status,
      commercialOwner: account.commercialOwner,
      deliveryOwner: account.deliveryOwner,
      nextReviewAt: account.nextReviewAt || "",
      renewalDate: account.renewalDate || "",
      retainStatus: account.retainStatus,
      notes: account.notes || "",
      changeReason: "",
    });
    setModal("account");
  };
  const openStakeholder = (stakeholder?: ClientStakeholderRecord) => {
    const item = stakeholder || null;
    setEditStakeholder(item);
    setStakeholderForm({
      name: item?.name || "",
      email: item?.email || "",
      phone: item?.phone || "",
      roleTitle: item?.roleTitle || "",
      department: item?.department || "",
      relationshipRole: item?.relationshipRole || "pic",
      isPrimary: item?.isPrimary || false,
      active: item?.active ?? true,
      notes: item?.notes || "",
    });
    setModal("stakeholder");
  };
  const openProject = (project: DeliveryProjectRecord) => {
    setSelectedProjectId(project.id);
    setProjectForm({
      deliveryStage: project.deliveryStage,
      deliveryOwner: project.deliveryOwner || "",
      startDate: project.startDate || "",
      endDate: project.endDate || "",
      deliveryGoal: project.deliveryGoal || "",
      successMetrics: project.successMetrics.join("\n"),
      riskLevel: project.riskLevel,
      riskSummary: project.riskSummary || "",
      note: "",
    });
    setModal("project");
  };
  const openMilestone = (milestone?: ProjectMilestoneRecord) => {
    const item = milestone || null;
    setEditMilestone(item);
    setMilestoneForm({
      title: item?.title || "",
      description: item?.description || "",
      owner: item?.owner || selectedProject?.deliveryOwner || selectedAccount?.deliveryOwner || "",
      dueDate: item?.dueDate || "",
      status: item?.status || "planned",
      progress: String(item?.progress || 0),
      weight: String(item?.weight || 0),
      blockerReason: item?.blockerReason || "",
    });
    setModal("milestone");
  };
  const openHealth = () => {
    setHealthForm({ deliveryScore: "3", engagementScore: "3", sentimentScore: "3", commercialScore: "3", riskLevel: "watch", riskReasons: "", notes: "", nextAction: "", nextActionDueAt: "" });
    setModal("health");
  };
  const openRetention = (item?: RetentionOpportunityRecord) => {
    const opportunity = item || null;
    setEditRetention(opportunity);
    setRetentionForm({
      opportunityType: opportunity?.opportunityType || "repeat",
      status: opportunity?.status || "identified",
      owner: opportunity?.owner || selectedAccount?.commercialOwner || "",
      estimatedValue: opportunity?.estimatedValue == null ? "" : String(opportunity.estimatedValue),
      expectedCloseDate: opportunity?.expectedCloseDate || "",
      nextAction: opportunity?.nextAction || "",
      nextActionDueAt: toLocalDateTime(opportunity?.nextActionDueAt || null),
      lostReason: opportunity?.lostReason || "",
      humanApproved: opportunity?.humanGateStatus === "approved",
      approvalNote: opportunity?.approvalNote || "",
      moduleNotes: typeof opportunity?.moduleRequestData?.notes === "string" ? opportunity.moduleRequestData.notes : "",
    });
    setModal("retention");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Client aktif" value={data.summary.activeClients || 0} icon={HeartHandshake} tone="success" />
        <StatCard label="Client berisiko" value={data.summary.atRiskClients || 0} icon={AlertTriangle} tone="danger" />
        <StatCard label="Delivery terbuka" value={data.summary.openDeliveryProjects || 0} icon={BriefcaseBusiness} />
        <StatCard label="Milestone terlambat" value={data.summary.overdueMilestones || 0} icon={CalendarCheck} tone="gold" />
        <StatCard label="Pipeline retain" value={rupiah(data.summary.retentionPipelineValue)} icon={CircleDollarSign} />
      </div>

      {wonAwaitingHandoff.length > 0 && (
        <Panel title="Deal Menunggu Handoff" action={`${wonAwaitingHandoff.length} opportunity`}>
          <div className="grid gap-3 lg:grid-cols-2">
            {wonAwaitingHandoff.map((lead) => (
              <article key={lead.id} className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{lead.company}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{lead.name} · {lead.opportunityOwner || "Owner belum ada"}</p>
                  <p className="mt-2 text-xs font-semibold text-emerald-700">{rupiah(lead.opportunityValue)}</p>
                </div>
                <button type="button" onClick={() => openHandoff(lead)} className={inputButton}><HeartHandshake size={14} /> Handoff</button>
              </article>
            ))}
          </div>
        </Panel>
      )}

      <Panel title="Client, Delivery & Retain" action={`${filteredAccounts.length}/${accounts.length} account`}>
        <div className="mb-5">
          <AdminSearch value={search} onChange={setSearch} placeholder="Cari perusahaan, owner, industri, status, atau lokasi…" />
        </div>
        {!accounts.length ? (
          <EmptyState title="Belum ada client account" description="Ubah opportunity menjadi won, lalu jalankan handoff untuk membuat client account dan initial delivery project secara atomik." />
        ) : (
          <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-2">
              {filteredAccounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => { setSelectedAccountId(account.id); setSelectedProjectId(null); }}
                  className={`w-full rounded-xl border p-4 text-left transition ${selectedAccount?.id === account.id ? "border-[#D9A441] bg-[#FFF8EA]" : "border-slate-200 bg-white hover:border-slate-300"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{account.organizationName}</p><p className="mt-1 truncate text-xs text-slate-500">{account.deliveryOwner}</p></div>
                    <Badge tone={toneForRisk(account.healthStatus)}>{account.healthStatus}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5"><Badge tone={toneForRisk(account.status)}>{account.status}</Badge><Badge tone={toneForRisk(account.retainStatus)}>{account.retainStatus}</Badge></div>
                </button>
              ))}
            </aside>

            {selectedAccount && (
              <section className="min-w-0 space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-[#071B3D] p-5 text-white">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">Client account</p>
                      <h3 className="mt-1 text-2xl font-bold">{selectedAccount.organizationName}</h3>
                      <p className="mt-2 text-xs text-slate-300">{[selectedAccount.industry, selectedAccount.organizationSize, selectedAccount.location].filter(Boolean).join(" · ") || "Profil perusahaan belum lengkap"}</p>
                    </div>
                    <button type="button" onClick={() => openAccount(selectedAccount)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-bold hover:bg-white/15"><Pencil size={14} /> Kelola account</button>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div><p className="text-[10px] uppercase tracking-wider text-slate-400">Commercial owner</p><p className="mt-1 truncate text-xs font-semibold">{selectedAccount.commercialOwner}</p></div>
                    <div><p className="text-[10px] uppercase tracking-wider text-slate-400">Delivery owner</p><p className="mt-1 truncate text-xs font-semibold">{selectedAccount.deliveryOwner}</p></div>
                    <div><p className="text-[10px] uppercase tracking-wider text-slate-400">Health</p><p className="mt-1 text-xs font-semibold">{selectedAccount.healthScore == null ? "Belum direview" : `${selectedAccount.healthScore}/100`}</p></div>
                    <div><p className="text-[10px] uppercase tracking-wider text-slate-400">Review berikutnya</p><p className="mt-1 text-xs font-semibold">{selectedAccount.nextReviewAt ? formatDate(selectedAccount.nextReviewAt) : "Belum dijadwalkan"}</p></div>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-bold text-[#0B2C6B]">Stakeholder</p><p className="text-xs text-slate-500">PIC, sponsor, champion, dan decision maker</p></div><button type="button" onClick={() => openStakeholder()} className={secondaryButton}><Plus size={13} /> Tambah</button></div>
                    {!stakeholders.length ? <p className="text-xs text-slate-500">Belum ada stakeholder.</p> : <div className="space-y-2">{stakeholders.map((item) => (
                      <button key={item.id} type="button" onClick={() => openStakeholder(item)} className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-left hover:border-[#D9A441]">
                        <div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800">{item.name}</p><p className="mt-1 truncate text-[11px] text-slate-500">{item.roleTitle || item.relationshipRole} · {item.email || "tanpa email"}</p></div><div className="flex gap-1">{item.isPrimary && <Badge tone="gold">Primary</Badge>}{!item.active && <Badge tone="red">Inactive</Badge>}</div>
                      </button>
                    ))}</div>}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-bold text-[#0B2C6B]">Account Health</p><p className="text-xs text-slate-500">Review kualitas delivery dan hubungan client</p></div><button type="button" onClick={openHealth} className={secondaryButton}><ClipboardCheck size={13} /> Review</button></div>
                    {!healthReviews.length ? <p className="text-xs text-slate-500">Belum ada health review.</p> : <div className="space-y-2">{healthReviews.map((review) => (
                      <div key={review.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="flex items-center justify-between"><p className="text-sm font-bold text-slate-900">{review.overallScore}/100</p><Badge tone={toneForRisk(review.riskLevel)}>{review.riskLevel}</Badge></div><p className="mt-2 text-[11px] text-slate-500">{formatDate(review.reviewDate)} · {review.reviewedBy}</p>{review.nextAction && <p className="mt-2 text-xs text-slate-700">{review.nextAction}</p>}</div>
                    ))}</div>}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-bold text-[#0B2C6B]">Delivery Projects</p><p className="text-xs text-slate-500">Handoff, kickoff, progress, risiko, dan completion</p></div><Badge>{accountProjects.length} project</Badge></div>
                  {!accountProjects.length ? <p className="text-xs text-slate-500">Belum ada delivery project.</p> : <div className="grid gap-3 lg:grid-cols-2">{accountProjects.map((project) => (
                    <button key={project.id} type="button" onClick={() => setSelectedProjectId(project.id)} className={`rounded-xl border p-4 text-left ${selectedProject?.id === project.id ? "border-[#D9A441] bg-[#FFF8EA]" : "border-slate-200 bg-white"}`}>
                      <div className="flex items-start justify-between gap-3"><p className="text-sm font-bold text-slate-900">{project.programName}</p><Badge tone={toneForRisk(project.riskLevel)}>{project.riskLevel}</Badge></div>
                      <p className="mt-2 text-xs text-slate-500">{project.deliveryOwner || "Owner belum ada"}</p><div className="mt-3"><Badge tone={toneForRisk(project.deliveryStage)}>{project.deliveryStage}</Badge></div>
                    </button>
                  ))}</div>}
                </div>

                {selectedProject && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#D9A441]">Project terpilih</p><h4 className="mt-1 text-lg font-bold text-[#0B2C6B]">{selectedProject.programName}</h4><p className="mt-1 text-xs text-slate-500">{selectedProject.deliveryGoal || "Delivery goal belum ditetapkan."}</p></div><div className="flex gap-2"><button type="button" onClick={() => openMilestone()} className={secondaryButton}><Plus size={13} /> Milestone</button><button type="button" onClick={() => openProject(selectedProject)} className={secondaryButton}><Pencil size={13} /> Project</button></div></div>
                    <div className="mt-5 space-y-3">
                      {!milestones.length ? <p className="text-xs text-slate-500">Belum ada milestone.</p> : milestones.map((item) => (
                        <button key={item.id} type="button" onClick={() => openMilestone(item)} className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-left hover:border-[#D9A441]">
                          <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold text-slate-800">{item.title}</p><Badge tone={item.status === "blocked" ? "red" : item.status === "completed" ? "green" : "navy"}>{item.status}</Badge></div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#0B2C6B]" style={{ width: `${item.progress}%` }} /></div>
                          <p className="mt-2 text-[11px] text-slate-500">{item.owner} · {item.dueDate ? formatDate(item.dueDate) : "tanpa due date"} · {item.progress}%</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-bold text-[#0B2C6B]">Retain & Repeat</p><p className="text-xs text-slate-500">Renewal, upsell, cross-sell, dan repeat</p></div><button type="button" onClick={() => openRetention()} className={secondaryButton}><Plus size={13} /> Peluang</button></div>
                    {!retentionOpportunities.length ? <p className="text-xs text-slate-500">Belum ada retention opportunity.</p> : <div className="space-y-2">{retentionOpportunities.map((item) => (
                      <button key={item.id} type="button" onClick={() => openRetention(item)} className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-left hover:border-[#D9A441]"><div className="flex items-center justify-between"><p className="text-xs font-bold text-slate-800">{item.opportunityType.replace("_", " ")}</p><Badge tone={item.humanGateStatus === "approved" ? "green" : "gold"}>{item.status}</Badge></div><p className="mt-2 text-xs text-slate-500">{rupiah(item.estimatedValue)} · {item.owner}</p></button>
                    ))}</div>}
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-4 flex items-center gap-2"><Activity size={16} className="text-[#D9A441]" /><div><p className="text-sm font-bold text-[#0B2C6B]">Activity Trail</p><p className="text-xs text-slate-500">Jejak operasional immutable</p></div></div>
                    {!activities.length ? <p className="text-xs text-slate-500">Belum ada aktivitas.</p> : <div className="space-y-3">{activities.map((item) => <div key={item.id} className="border-l-2 border-slate-200 pl-3"><p className="text-xs font-bold text-slate-800">{item.eventType.replaceAll("_", " ")}</p><p className="mt-1 text-[11px] text-slate-500">{formatDate(item.createdAt)} · {item.actor}</p>{item.note && <p className="mt-1 text-xs text-slate-600">{item.note}</p>}</div>)}</div>}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </Panel>

      {modal && (
        <AdminModal title={{ handoff: "Handoff Deal ke Delivery", account: "Kelola Client Account", stakeholder: editStakeholder ? "Perbarui Stakeholder" : "Tambah Stakeholder", project: "Kelola Delivery Project", milestone: editMilestone ? "Perbarui Milestone" : "Tambah Milestone", health: "Account Health Review", retention: editRetention ? "Perbarui Retention Opportunity" : "Tambah Retention Opportunity" }[modal]} eyebrow="Fase 3 · Client lifecycle" onClose={closeModal} maxWidth="max-w-3xl">
          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {modal === "handoff" && handoffLead && <div className="space-y-4"><div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"><strong>{handoffLead.company}</strong> akan dibuat menjadi client account dan initial delivery project. Proses ini idempotent.</div><div className="grid gap-4 md:grid-cols-2"><AdminInput label="Commercial owner" type="email" value={handoffForm.commercialOwner} onChange={(value) => setHandoffForm((form) => ({ ...form, commercialOwner: value }))} /><AdminInput label="Delivery owner" type="email" value={handoffForm.deliveryOwner} onChange={(value) => setHandoffForm((form) => ({ ...form, deliveryOwner: value }))} /><AdminInput label="Nama initial project" value={handoffForm.projectTitle} onChange={(value) => setHandoffForm((form) => ({ ...form, projectTitle: value }))} /><AdminInput label="Target kickoff" type="date" value={handoffForm.kickoffDate} onChange={(value) => setHandoffForm((form) => ({ ...form, kickoffDate: value }))} /></div><button type="button" disabled={saving || !handoffForm.commercialOwner || !handoffForm.deliveryOwner || handoffForm.projectTitle.length < 3} onClick={() => execute(async () => { await onAction("/api/admin/client-delivery", { method: "POST", body: JSON.stringify({ leadId: handoffLead.id, ...handoffForm, kickoffDate: handoffForm.kickoffDate || null }) }); })} className={inputButton}>{saving ? <RefreshCw size={14} className="animate-spin" /> : <HeartHandshake size={14} />} Buat client & handoff</button></div>}

          {modal === "account" && selectedAccount && <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><label><FieldLabel label="Status client" /><AdminSelect value={accountForm.status} onChange={(value) => setAccountForm((form) => ({ ...form, status: value }))} options={CLIENT_STATUS} /></label><label><FieldLabel label="Status retain" /><AdminSelect value={accountForm.retainStatus} onChange={(value) => setAccountForm((form) => ({ ...form, retainStatus: value }))} options={RETAIN_STATUS} /></label><AdminInput label="Commercial owner" type="email" value={accountForm.commercialOwner} onChange={(value) => setAccountForm((form) => ({ ...form, commercialOwner: value }))} /><AdminInput label="Delivery owner" type="email" value={accountForm.deliveryOwner} onChange={(value) => setAccountForm((form) => ({ ...form, deliveryOwner: value }))} /><AdminInput label="Review berikutnya" type="date" value={accountForm.nextReviewAt} onChange={(value) => setAccountForm((form) => ({ ...form, nextReviewAt: value }))} /><AdminInput label="Tanggal renewal" type="date" value={accountForm.renewalDate} onChange={(value) => setAccountForm((form) => ({ ...form, renewalDate: value }))} /></div><AdminTextarea label="Catatan account" value={accountForm.notes} onChange={(value) => setAccountForm((form) => ({ ...form, notes: value }))} /><AdminTextarea label="Alasan perubahan" help="Wajib untuk at risk, inactive, dan churned." value={accountForm.changeReason} onChange={(value) => setAccountForm((form) => ({ ...form, changeReason: value }))} /><button type="button" disabled={saving} onClick={() => execute(async () => { await onAction("/api/admin/client-delivery", { method: "PATCH", body: JSON.stringify({ action: "account", payload: { clientAccountId: selectedAccount.id, ...accountForm, nextReviewAt: accountForm.nextReviewAt || null, renewalDate: accountForm.renewalDate || null, notes: accountForm.notes || null, changeReason: accountForm.changeReason || null } }) }); })} className={inputButton}>Simpan account</button></div>}

          {modal === "stakeholder" && selectedAccount && <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><AdminInput label="Nama" value={stakeholderForm.name} onChange={(value) => setStakeholderForm((form) => ({ ...form, name: value }))} /><AdminInput label="Email" type="email" value={stakeholderForm.email} onChange={(value) => setStakeholderForm((form) => ({ ...form, email: value }))} /><AdminInput label="Telepon" value={stakeholderForm.phone} onChange={(value) => setStakeholderForm((form) => ({ ...form, phone: value }))} /><AdminInput label="Jabatan" value={stakeholderForm.roleTitle} onChange={(value) => setStakeholderForm((form) => ({ ...form, roleTitle: value }))} /><AdminInput label="Departemen" value={stakeholderForm.department} onChange={(value) => setStakeholderForm((form) => ({ ...form, department: value }))} /><label><FieldLabel label="Peran relasi" /><AdminSelect value={stakeholderForm.relationshipRole} onChange={(value) => setStakeholderForm((form) => ({ ...form, relationshipRole: value }))} options={STAKEHOLDER_ROLE} /></label></div><div className="flex flex-wrap gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={stakeholderForm.isPrimary} onChange={(event) => setStakeholderForm((form) => ({ ...form, isPrimary: event.target.checked, active: event.target.checked ? true : form.active }))} /> Stakeholder utama</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={stakeholderForm.active} onChange={(event) => setStakeholderForm((form) => ({ ...form, active: event.target.checked }))} /> Aktif</label></div><AdminTextarea label="Catatan" value={stakeholderForm.notes} onChange={(value) => setStakeholderForm((form) => ({ ...form, notes: value }))} /><button type="button" disabled={saving || stakeholderForm.name.length < 2} onClick={() => execute(async () => { await onAction("/api/admin/client-delivery/stakeholders", { method: "POST", body: JSON.stringify({ id: editStakeholder?.id || null, clientAccountId: selectedAccount.id, ...stakeholderForm, email: stakeholderForm.email || null }) }); })} className={inputButton}>Simpan stakeholder</button></div>}

          {modal === "project" && selectedProject && <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><label><FieldLabel label="Delivery stage" /><AdminSelect value={projectForm.deliveryStage} onChange={(value) => setProjectForm((form) => ({ ...form, deliveryStage: value }))} options={DELIVERY_STAGE} /></label><label><FieldLabel label="Risk level" /><AdminSelect value={projectForm.riskLevel} onChange={(value) => setProjectForm((form) => ({ ...form, riskLevel: value }))} options={RISK_LEVEL} /></label><AdminInput label="Delivery owner" type="email" value={projectForm.deliveryOwner} onChange={(value) => setProjectForm((form) => ({ ...form, deliveryOwner: value }))} /><div /><AdminInput label="Tanggal mulai" type="date" value={projectForm.startDate} onChange={(value) => setProjectForm((form) => ({ ...form, startDate: value }))} /><AdminInput label="Tanggal selesai" type="date" value={projectForm.endDate} onChange={(value) => setProjectForm((form) => ({ ...form, endDate: value }))} /></div><AdminTextarea label="Delivery goal" value={projectForm.deliveryGoal} onChange={(value) => setProjectForm((form) => ({ ...form, deliveryGoal: value }))} /><AdminTextarea label="Success metrics" help="Satu metric per baris." value={projectForm.successMetrics} onChange={(value) => setProjectForm((form) => ({ ...form, successMetrics: value }))} /><AdminTextarea label="Ringkasan risiko" value={projectForm.riskSummary} onChange={(value) => setProjectForm((form) => ({ ...form, riskSummary: value }))} /><AdminTextarea label="Catatan perubahan" value={projectForm.note} onChange={(value) => setProjectForm((form) => ({ ...form, note: value }))} /><button type="button" disabled={saving} onClick={() => execute(async () => { await onAction("/api/admin/client-delivery", { method: "PATCH", body: JSON.stringify({ action: "project", payload: { projectId: selectedProject.id, ...projectForm, startDate: projectForm.startDate || null, endDate: projectForm.endDate || null, deliveryGoal: projectForm.deliveryGoal || null, successMetrics: projectForm.successMetrics.split(/\r?\n/).map((item) => item.trim()).filter(Boolean), riskSummary: projectForm.riskSummary || null, note: projectForm.note || null } }) }); })} className={inputButton}>Simpan project</button></div>}

          {modal === "milestone" && selectedProject && <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><AdminInput label="Judul milestone" value={milestoneForm.title} onChange={(value) => setMilestoneForm((form) => ({ ...form, title: value }))} /><AdminInput label="Owner" type="email" value={milestoneForm.owner} onChange={(value) => setMilestoneForm((form) => ({ ...form, owner: value }))} /><AdminInput label="Due date" type="date" value={milestoneForm.dueDate} onChange={(value) => setMilestoneForm((form) => ({ ...form, dueDate: value }))} /><label><FieldLabel label="Status" /><AdminSelect value={milestoneForm.status} onChange={(value) => setMilestoneForm((form) => ({ ...form, status: value }))} options={MILESTONE_STATUS} /></label><AdminInput label="Progress (%)" type="number" value={milestoneForm.progress} onChange={(value) => setMilestoneForm((form) => ({ ...form, progress: value }))} /><AdminInput label="Weight (%)" type="number" value={milestoneForm.weight} onChange={(value) => setMilestoneForm((form) => ({ ...form, weight: value }))} /></div><AdminTextarea label="Deskripsi" value={milestoneForm.description} onChange={(value) => setMilestoneForm((form) => ({ ...form, description: value }))} /><AdminTextarea label="Alasan blocker" help="Wajib saat status blocked." value={milestoneForm.blockerReason} onChange={(value) => setMilestoneForm((form) => ({ ...form, blockerReason: value }))} /><button type="button" disabled={saving || milestoneForm.title.length < 2 || !milestoneForm.owner} onClick={() => execute(async () => { await onAction("/api/admin/client-delivery/milestones", { method: "POST", body: JSON.stringify({ id: editMilestone?.id || null, projectId: selectedProject.id, ...milestoneForm, description: milestoneForm.description || null, dueDate: milestoneForm.dueDate || null, progress: Number(milestoneForm.progress), weight: Number(milestoneForm.weight), blockerReason: milestoneForm.blockerReason || null }) }); })} className={inputButton}>Simpan milestone</button></div>}

          {modal === "health" && selectedAccount && <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><AdminInput label="Delivery (1–5)" type="number" value={healthForm.deliveryScore} onChange={(value) => setHealthForm((form) => ({ ...form, deliveryScore: value }))} /><AdminInput label="Engagement (1–5)" type="number" value={healthForm.engagementScore} onChange={(value) => setHealthForm((form) => ({ ...form, engagementScore: value }))} /><AdminInput label="Sentiment (1–5)" type="number" value={healthForm.sentimentScore} onChange={(value) => setHealthForm((form) => ({ ...form, sentimentScore: value }))} /><AdminInput label="Commercial (1–5)" type="number" value={healthForm.commercialScore} onChange={(value) => setHealthForm((form) => ({ ...form, commercialScore: value }))} /></div><label><FieldLabel label="Risk level" /><AdminSelect value={healthForm.riskLevel} onChange={(value) => setHealthForm((form) => ({ ...form, riskLevel: value }))} options={HEALTH_LEVEL} /></label><AdminTextarea label="Risk reasons" help="Satu alasan per baris." value={healthForm.riskReasons} onChange={(value) => setHealthForm((form) => ({ ...form, riskReasons: value }))} /><AdminTextarea label="Catatan review" value={healthForm.notes} onChange={(value) => setHealthForm((form) => ({ ...form, notes: value }))} /><div className="grid gap-4 md:grid-cols-2"><AdminInput label="Next action" value={healthForm.nextAction} onChange={(value) => setHealthForm((form) => ({ ...form, nextAction: value }))} /><AdminInput label="Tenggat next action" type="date" value={healthForm.nextActionDueAt} onChange={(value) => setHealthForm((form) => ({ ...form, nextActionDueAt: value }))} /></div><button type="button" disabled={saving} onClick={() => execute(async () => { await onAction("/api/admin/client-delivery/health", { method: "POST", body: JSON.stringify({ clientAccountId: selectedAccount.id, projectId: selectedProject?.id || null, ...healthForm, deliveryScore: Number(healthForm.deliveryScore), engagementScore: Number(healthForm.engagementScore), sentimentScore: Number(healthForm.sentimentScore), commercialScore: Number(healthForm.commercialScore), riskReasons: healthForm.riskReasons.split(/\r?\n/).map((item) => item.trim()).filter(Boolean), notes: healthForm.notes || null, nextAction: healthForm.nextAction || null, nextActionDueAt: healthForm.nextActionDueAt || null }) }); })} className={inputButton}>Simpan health review</button></div>}

          {modal === "retention" && selectedAccount && <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><label><FieldLabel label="Jenis peluang" /><AdminSelect value={retentionForm.opportunityType} onChange={(value) => setRetentionForm((form) => ({ ...form, opportunityType: value }))} options={RETENTION_TYPE} /></label><label><FieldLabel label="Status" /><AdminSelect value={retentionForm.status} onChange={(value) => setRetentionForm((form) => ({ ...form, status: value }))} options={RETENTION_STATUS} /></label><AdminInput label="Owner" type="email" value={retentionForm.owner} onChange={(value) => setRetentionForm((form) => ({ ...form, owner: value }))} /><AdminInput label="Estimasi nilai" type="number" value={retentionForm.estimatedValue} onChange={(value) => setRetentionForm((form) => ({ ...form, estimatedValue: value }))} /><AdminInput label="Expected close" type="date" value={retentionForm.expectedCloseDate} onChange={(value) => setRetentionForm((form) => ({ ...form, expectedCloseDate: value }))} /><div /><AdminInput label="Next action" value={retentionForm.nextAction} onChange={(value) => setRetentionForm((form) => ({ ...form, nextAction: value }))} /><AdminInput label="Tenggat next action" type="datetime-local" value={retentionForm.nextActionDueAt} onChange={(value) => setRetentionForm((form) => ({ ...form, nextActionDueAt: value }))} /></div><AdminTextarea label="Kebutuhan modul / konteks" value={retentionForm.moduleNotes} onChange={(value) => setRetentionForm((form) => ({ ...form, moduleNotes: value }))} /><AdminTextarea label="Alasan lost" value={retentionForm.lostReason} onChange={(value) => setRetentionForm((form) => ({ ...form, lostReason: value }))} /><div className="rounded-xl border border-[#D9A441]/30 bg-[#FFF8EA] p-4"><label className="flex items-center gap-2 text-sm font-semibold text-[#0B2C6B]"><input type="checkbox" checked={retentionForm.humanApproved} onChange={(event) => setRetentionForm((form) => ({ ...form, humanApproved: event.target.checked }))} /> Human gate disetujui</label><div className="mt-3"><AdminTextarea label="Catatan approval" help="Wajib untuk status proposal atau won." value={retentionForm.approvalNote} onChange={(value) => setRetentionForm((form) => ({ ...form, approvalNote: value }))} /></div></div><button type="button" disabled={saving || !retentionForm.owner} onClick={() => execute(async () => { await onAction("/api/admin/client-delivery/retention", { method: "POST", body: JSON.stringify({ id: editRetention?.id || null, clientAccountId: selectedAccount.id, sourceProjectId: selectedProject?.id || null, ...retentionForm, moduleRequestData: { notes: retentionForm.moduleNotes }, estimatedValue: retentionForm.estimatedValue === "" ? null : Number(retentionForm.estimatedValue), expectedCloseDate: retentionForm.expectedCloseDate || null, nextAction: retentionForm.nextAction || null, nextActionDueAt: retentionForm.nextActionDueAt ? new Date(retentionForm.nextActionDueAt).toISOString() : null, lostReason: retentionForm.lostReason || null, approvalNote: retentionForm.approvalNote || null, moduleNotes: undefined }) }); })} className={inputButton}><ShieldCheck size={14} /> Simpan retention</button></div>}
        </AdminModal>
      )}
    </div>
  );
}
