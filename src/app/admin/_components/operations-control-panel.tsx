"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw, ShieldCheck } from "lucide-react";
import { AdminInput, AdminSearch, AdminSelect, AdminTextarea, FieldLabel, Panel, StatCard } from "./shared";

type AdminAction = (url: string, init?: RequestInit) => Promise<unknown>;

type OperationalTask = {
  id: string;
  taskKey: string;
  taskType: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "waiting" | "completed" | "cancelled";
  assignedTo: string | null;
  dueAt: string | null;
  slaPolicyKey: string | null;
  escalationLevel: number;
  metadata: Record<string, unknown>;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
};

type AutomationRun = {
  id: string;
  workflowKey: string;
  triggerSource: string;
  dryRun: boolean;
  status: string;
  referenceDate: string | null;
  candidateCount: number;
  processedCount: number;
  failureCount: number;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
};

type OperationsResponse = {
  success: boolean;
  phase4Ready: boolean;
  tasks: OperationalTask[];
  automationRuns: AutomationRun[];
};

const STATUS_OPTIONS: Array<[string, string]> = [
  ["open", "Open"],
  ["in_progress", "In progress"],
  ["waiting", "Waiting"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
];
const PRIORITY_OPTIONS: Array<[string, string]> = [
  ["low", "Low"],
  ["medium", "Medium"],
  ["high", "High"],
  ["critical", "Critical"],
];

const TYPE_LABEL: Record<string, string> = {
  client_review: "Client review",
  renewal_review: "Renewal 90/60/30",
  account_risk: "Account risk",
  delivery_risk: "Delivery risk",
  milestone_overdue: "Milestone overdue",
  retention_action: "Retention action",
  proposal_review: "Proposal review",
  system_alert: "System alert",
};

function displayDate(value: string | null) {
  if (!value) return "Belum ditentukan";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(date);
}

function inputDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function OperationsControlPanel({ onAction }: { onAction: AdminAction }) {
  const [payload, setPayload] = useState<OperationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [renderedAt] = useState(() => Date.now());
  const [selected, setSelected] = useState<OperationalTask | null>(null);
  const [form, setForm] = useState({ status: "open", priority: "medium", assignedTo: "", dueAt: "", resolutionNote: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await onAction("/api/admin/operations") as OperationsResponse;
      setPayload(response);
      setSelected((current) => current ? response.tasks.find((task) => task.id === current.id) || null : null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat operations control.");
    } finally {
      setLoading(false);
    }
  }, [onAction]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const chooseTask = (task: OperationalTask) => {
    setSelected(task);
    setForm({
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo || "",
      dueAt: inputDate(task.dueAt),
      resolutionNote: task.resolutionNote || "",
    });
    setError("");
  };

  const tasks = useMemo(() => payload?.tasks || [], [payload]);
  const runs = useMemo(() => payload?.automationRuns || [], [payload]);
  const now = renderedAt;
  const openTasks = tasks.filter((task) => !["completed", "cancelled"].includes(task.status));
  const overdueTasks = openTasks.filter((task) => task.dueAt && new Date(task.dueAt).getTime() < now);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tasks.filter((task) => {
      const statusMatch = statusFilter === "all"
        || (statusFilter === "active" && !["completed", "cancelled"].includes(task.status))
        || task.status === statusFilter;
      const textMatch = !normalized || [task.title, task.description, task.assignedTo, task.taskType]
        .join(" ").toLowerCase().includes(normalized);
      return statusMatch && textMatch;
    });
  }, [query, statusFilter, tasks]);

  const saveTask = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      await onAction("/api/admin/operations", {
        method: "PATCH",
        body: JSON.stringify({
          taskId: selected.id,
          status: form.status,
          priority: form.priority,
          assignedTo: form.assignedTo || null,
          dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
          resolutionNote: form.resolutionNote || null,
        }),
      });
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan operational task.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !payload) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Memuat Operations Control…</div>;
  }

  if (payload && !payload.phase4Ready) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Migration Fase 4 belum tersedia. Terapkan migration 0029 sebelum menggunakan Operations Control.</div>;
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        Scheduler hanya mendeteksi sinyal dan membuat antrean. Penyelesaian, eskalasi, serta keputusan komersial tetap dilakukan manusia. Selama <code>OPERATIONS_DRY_RUN=true</code>, kandidat hanya tercatat pada automation run dan tidak menjadi task.
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Task aktif" value={openTasks.length} icon={Clock3} />
        <StatCard label="Melewati SLA" value={overdueTasks.length} icon={AlertTriangle} />
        <StatCard label="Prioritas critical" value={openTasks.filter((task) => task.priority === "critical").length} icon={ShieldCheck} />
        <StatCard label="Run gagal" value={runs.filter((run) => run.status === "failed").length} icon={RefreshCw} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Human Task Queue" action={`${filtered.length} task`}>
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
            <AdminSearch value={query} onChange={setQuery} placeholder="Cari task, owner, atau tipe…" />
            <AdminSelect value={statusFilter} onChange={setStatusFilter} ariaLabel="Filter status" options={[["active", "Task aktif"], ["all", "Semua status"], ...STATUS_OPTIONS]} />
          </div>
          <div className="max-h-[650px] space-y-3 overflow-y-auto pr-1">
            {!filtered.length && <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Belum ada task pada filter ini.</p>}
            {filtered.map((task) => {
              const overdue = task.dueAt && new Date(task.dueAt).getTime() < now && !["completed", "cancelled"].includes(task.status);
              return (
                <button key={task.id} type="button" onClick={() => chooseTask(task)} className={`w-full rounded-xl border p-4 text-left transition ${selected?.id === task.id ? "border-[#D9A441] bg-[#FFF8EA]" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-[#0B2C6B]">{task.title}</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{TYPE_LABEL[task.taskType] || task.taskType} · {task.status.replaceAll("_", " ")}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${task.priority === "critical" ? "bg-red-100 text-red-700" : task.priority === "high" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{task.priority}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>{task.assignedTo || "Belum ada owner"}</span>
                    <span className={overdue ? "font-bold text-red-600" : ""}>{displayDate(task.dueAt)}</span>
                    {task.escalationLevel > 0 && <span>Escalation L{task.escalationLevel}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title="Task Detail" action={selected ? TYPE_LABEL[selected.taskType] || selected.taskType : "Pilih task"}>
          {!selected ? <p className="text-sm text-slate-500">Pilih task untuk menetapkan owner, SLA, status, dan catatan penyelesaian.</p> : (
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-[#0B2C6B]">{selected.title}</p>
                {selected.description && <p className="mt-2 text-xs leading-relaxed text-slate-600">{selected.description}</p>}
                <p className="mt-3 text-[11px] text-slate-400">Policy: {selected.slaPolicyKey || "belum ditetapkan"}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label><FieldLabel label="Status" /><AdminSelect value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={STATUS_OPTIONS} /></label>
                <label><FieldLabel label="Priority" /><AdminSelect value={form.priority} onChange={(value) => setForm((current) => ({ ...current, priority: value }))} options={PRIORITY_OPTIONS} /></label>
              </div>
              <AdminInput label="Assigned owner" type="email" value={form.assignedTo} onChange={(value) => setForm((current) => ({ ...current, assignedTo: value }))} />
              <AdminInput label="Due at" type="datetime-local" value={form.dueAt} onChange={(value) => setForm((current) => ({ ...current, dueAt: value }))} />
              <AdminTextarea label="Catatan penyelesaian" help="Wajib minimal 5 karakter saat completed atau cancelled." value={form.resolutionNote} onChange={(value) => setForm((current) => ({ ...current, resolutionNote: value }))} />
              <button type="button" disabled={saving} onClick={saveTask} className="inline-flex items-center gap-2 rounded-xl bg-[#0B2C6B] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Simpan task
              </button>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Automation Run Audit" action={`${runs.length} run terakhir`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead><tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400"><th className="pb-3">Workflow</th><th className="pb-3">Mode</th><th className="pb-3">Status</th><th className="pb-3">Kandidat</th><th className="pb-3">Dibuat</th><th className="pb-3">Mulai</th><th className="pb-3">Error</th></tr></thead>
            <tbody>{runs.map((run) => <tr key={run.id} className="border-b border-slate-100"><td className="py-3 font-semibold text-[#0B2C6B]">{run.workflowKey}</td><td className="py-3">{run.dryRun ? "Dry-run" : "Live"}</td><td className="py-3">{run.status}</td><td className="py-3">{run.candidateCount}</td><td className="py-3">{run.processedCount}</td><td className="py-3">{displayDate(run.startedAt)}</td><td className="max-w-[240px] truncate py-3 text-red-600">{run.errorMessage || "—"}</td></tr>)}</tbody>
          </table>
          {!runs.length && <p className="py-5 text-sm text-slate-500">Belum ada automation run. Workflow n8n Fase 4 masih inactive.</p>}
        </div>
      </Panel>
    </div>
  );
}
