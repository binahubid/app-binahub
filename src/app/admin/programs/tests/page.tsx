"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Check,
  Copy,
  Download,
  Eye,
  FileUp,
  ListChecks,
  Loader2,
  Monitor,
  Pencil,
  Plus,
  Save,
  Send,
  Settings2,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { AdminShell } from "@/components/admin-shell";
import { ProgramQuestionnaireForm } from "@/components/program-questionnaire-form";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { downloadBlob } from "@/lib/download";
import {
  QUESTION_TYPE_OPTIONS,
  createEmptyQuestionDraft,
  draftToQuestionPayload,
  moveQuestion,
  questionToDraft,
  questionTypeLabel,
  storedQuestionToPayload,
  totalQuestionnairePoints,
  validateQuestionDraft,
  type QuestionDraft,
  type ScoredProgramQuestion,
} from "@/lib/program-questionnaire-editor";
import { supabase } from "@/lib/supabase";

type Kind = "pre_test" | "post_test";
type WorkspaceTab = "questions" | "responses" | "settings";
type QuestionnaireStatus = "draft" | "published" | "archived";

type QuestionnaireStatistics = {
  overall: {
    submissionCount: number;
    scoredSubmissionCount: number;
    averagePercentage: number | null;
    minimumPercentage: number | null;
    maximumPercentage: number | null;
    distribution: Array<{ label: string; count: number }>;
  };
  perQuestion: Array<{
    questionId: string;
    position: number;
    prompt: string;
    questionType: string;
    responseCount: number;
    unansweredCount: number;
    responseRatePercent: number;
    optionCounts: Array<{ label: string; count: number }>;
    numericSummary: { average: number; minimum: number; maximum: number } | null;
  }>;
};

type Questionnaire = {
  id: string;
  kind: Kind;
  title: string;
  description: string | null;
  instructions: string | null;
  passing_score: number | null;
  allow_retake: boolean;
  shuffle_questions: boolean;
  status: QuestionnaireStatus;
  version: number;
  published_at: string | null;
  questions: ScoredProgramQuestion[];
  statistics: QuestionnaireStatistics;
  submissions: Array<{
    id: string;
    profile_id: string | null;
    participant_id: string | null;
    answers: unknown;
    score: number | null;
    maximum_score: number | null;
    percentage: number | null;
    attempt_number: number;
    submitted_at: string;
  }>;
};

type QuestionnaireMeta = {
  title: string;
  description: string;
  instructions: string;
  passingScore: string;
  allowRetake: boolean;
  shuffleQuestions: boolean;
};

const EMPTY_STATISTICS: QuestionnaireStatistics = {
  overall: {
    submissionCount: 0,
    scoredSubmissionCount: 0,
    averagePercentage: null,
    minimumPercentage: null,
    maximumPercentage: null,
    distribution: [],
  },
  perQuestion: [],
};

function questionnaireMeta(questionnaire: Questionnaire | null, kind: Kind, programTitle: string): QuestionnaireMeta {
  if (questionnaire) {
    return {
      title: questionnaire.title,
      description: questionnaire.description || "",
      instructions: questionnaire.instructions || "",
      passingScore: questionnaire.passing_score === null ? "" : String(questionnaire.passing_score),
      allowRetake: questionnaire.allow_retake,
      shuffleQuestions: questionnaire.shuffle_questions,
    };
  }
  return {
    title: kind === "pre_test" ? `Pre-test ${programTitle || "program"}` : `Post-test ${programTitle || "program"}`,
    description: "",
    instructions: "Jawab seluruh pertanyaan dengan teliti.",
    passingScore: "",
    allowRetake: false,
    shuffleQuestions: false,
  };
}

async function token() {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error("Sesi admin tidak tersedia.");
  return data.session.access_token;
}

function statusLabel(status: QuestionnaireStatus | undefined) {
  if (status === "published") return "Dipublikasikan";
  if (status === "archived") return "Respons ditutup";
  return "Draf";
}

function QuestionEditorDialog({
  draft,
  saving,
  onChange,
  onClose,
  onSave,
}: {
  draft: QuestionDraft;
  saving: boolean;
  onChange: (next: QuestionDraft) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const [validationError, setValidationError] = useState("");
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose, saving);
  const choiceQuestion = draft.questionType === "single_choice" || draft.questionType === "multiple_choice";

  const changeType = (questionType: QuestionDraft["questionType"]) => {
    onChange({
      ...draft,
      questionType,
      options: ["single_choice", "multiple_choice"].includes(questionType) ? (draft.options.length >= 2 ? draft.options : ["", ""]) : [],
      correctAnswers: [],
    });
    setValidationError("");
  };

  const changeOption = (index: number, value: string) => {
    const previous = draft.options[index];
    const options = draft.options.map((item, optionIndex) => optionIndex === index ? value : item);
    const correctAnswers = draft.correctAnswers.map((answer) => answer === previous ? value : answer);
    onChange({ ...draft, options, correctAnswers });
  };

  const removeOption = (index: number) => {
    const removed = draft.options[index];
    onChange({
      ...draft,
      options: draft.options.filter((_, optionIndex) => optionIndex !== index),
      correctAnswers: draft.correctAnswers.filter((answer) => answer !== removed),
    });
  };

  const save = () => {
    const validation = validateQuestionDraft(draft);
    setValidationError(validation);
    if (!validation) onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="question-editor-title" className="max-h-[96vh] w-full max-w-3xl overflow-y-auto bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600">Editor pertanyaan</p>
            <h2 id="question-editor-title" className="mt-1 text-xl font-semibold text-[#0B2C6B]">{draft.id ? "Edit pertanyaan" : "Pertanyaan baru"}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Tutup editor pertanyaan" className="grid h-11 w-11 place-items-center border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"><X className="h-5 w-5" /></button>
        </header>

        <div className="space-y-6 px-5 py-6 sm:px-7">
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_15rem]">
            <label className="text-xs font-bold text-slate-700">
              Pertanyaan
              <textarea data-autofocus rows={3} value={draft.prompt} maxLength={4000} onChange={(event) => onChange({ ...draft, prompt: event.target.value })} placeholder="Tulis pertanyaan yang jelas dan hanya mengukur satu hal" className="mt-2 w-full border border-slate-300 px-4 py-3 text-sm font-normal outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="text-xs font-bold text-slate-700">
              Jenis jawaban
              <select value={draft.questionType} onChange={(event) => changeType(event.target.value as QuestionDraft["questionType"])} className="mt-2 min-h-12 w-full border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-700">
                {QUESTION_TYPE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <span className="mt-2 block text-[11px] font-normal leading-5 text-slate-500">{QUESTION_TYPE_OPTIONS.find((item) => item.value === draft.questionType)?.description}</span>
            </label>
          </div>

          <label className="block text-xs font-bold text-slate-700">
            Deskripsi atau bantuan <span className="font-normal text-slate-400">(opsional)</span>
            <input value={draft.helpText} maxLength={2000} onChange={(event) => onChange({ ...draft, helpText: event.target.value })} placeholder="Berikan konteks tanpa mengarahkan jawaban" className="mt-2 min-h-11 w-full border border-slate-300 px-4 text-sm font-normal outline-none focus:border-blue-700" />
          </label>

          {choiceQuestion && (
            <section className="border-t border-slate-200 pt-5">
              <div className="flex items-center justify-between gap-3">
                <div><h3 className="text-sm font-bold text-slate-900">Pilihan jawaban</h3><p className="mt-1 text-xs text-slate-500">Tandai lingkaran/kotak di kiri untuk menentukan kunci jawaban.</p></div>
                <button type="button" onClick={() => onChange({ ...draft, options: [...draft.options, ""] })} className="inline-flex min-h-10 items-center gap-2 border border-blue-200 px-3 text-xs font-bold text-blue-900 hover:bg-blue-50"><Plus className="h-4 w-4" /> Tambah pilihan</button>
              </div>
              <div className="mt-4 space-y-2">
                {draft.options.map((option, index) => {
                  const selected = draft.correctAnswers.includes(option) && option !== "";
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        aria-label={`Jadikan pilihan ${index + 1} sebagai kunci jawaban`}
                        type={draft.questionType === "multiple_choice" ? "checkbox" : "radio"}
                        name="correct-option"
                        checked={selected}
                        disabled={!option.trim()}
                        onChange={() => onChange({ ...draft, correctAnswers: draft.questionType === "multiple_choice" ? (selected ? draft.correctAnswers.filter((answer) => answer !== option) : [...draft.correctAnswers, option]) : [option] })}
                      />
                      <input value={option} maxLength={500} onChange={(event) => changeOption(index, event.target.value)} placeholder={`Pilihan ${index + 1}`} className="min-h-11 flex-1 border border-slate-300 px-3 text-sm outline-none focus:border-blue-700" />
                      <button type="button" onClick={() => removeOption(index)} disabled={draft.options.length <= 2} aria-label={`Hapus pilihan ${index + 1}`} className="grid h-11 w-11 place-items-center text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  );
                })}
              </div>
              {draft.correctAnswers.length > 0 && <button type="button" onClick={() => onChange({ ...draft, correctAnswers: [] })} className="mt-3 min-h-9 text-xs font-bold text-slate-500 hover:text-red-700">Hapus kunci jawaban</button>}
            </section>
          )}

          {draft.questionType === "yes_no" && (
            <label className="block text-xs font-bold text-slate-700">Kunci jawaban <span className="font-normal text-slate-400">(opsional)</span><select value={draft.correctAnswers[0] || ""} onChange={(event) => onChange({ ...draft, correctAnswers: event.target.value ? [event.target.value] : [] })} className="mt-2 min-h-11 w-full border border-slate-300 bg-white px-3 text-sm font-normal"><option value="">Tidak dinilai</option><option value="Ya">Ya</option><option value="Tidak">Tidak</option></select></label>
          )}

          {draft.questionType === "scale" && (
            <section className="border-t border-slate-200 pt-5">
              <h3 className="text-sm font-bold text-slate-900">Rentang dan label skala</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-700">Nilai awal<input type="number" min="0" max="99" value={draft.scaleMin} onChange={(event) => onChange({ ...draft, scaleMin: Number(event.target.value) })} className="mt-2 min-h-11 w-full border border-slate-300 px-3 text-sm font-normal" /></label>
                <label className="text-xs font-bold text-slate-700">Nilai akhir<input type="number" min="1" max="100" value={draft.scaleMax} onChange={(event) => onChange({ ...draft, scaleMax: Number(event.target.value) })} className="mt-2 min-h-11 w-full border border-slate-300 px-3 text-sm font-normal" /></label>
                <label className="text-xs font-bold text-slate-700">Label nilai awal<input value={draft.scaleMinLabel} maxLength={200} onChange={(event) => onChange({ ...draft, scaleMinLabel: event.target.value })} placeholder="Contoh: Sangat tidak setuju" className="mt-2 min-h-11 w-full border border-slate-300 px-3 text-sm font-normal" /></label>
                <label className="text-xs font-bold text-slate-700">Label nilai akhir<input value={draft.scaleMaxLabel} maxLength={200} onChange={(event) => onChange({ ...draft, scaleMaxLabel: event.target.value })} placeholder="Contoh: Sangat setuju" className="mt-2 min-h-11 w-full border border-slate-300 px-3 text-sm font-normal" /></label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Kunci jawaban <span className="font-normal text-slate-400">(opsional)</span><select value={draft.correctAnswers[0] || ""} onChange={(event) => onChange({ ...draft, correctAnswers: event.target.value ? [event.target.value] : [] })} className="mt-2 min-h-11 w-full border border-slate-300 bg-white px-3 text-sm font-normal"><option value="">Tidak dinilai</option>{draft.scaleMax > draft.scaleMin && draft.scaleMax - draft.scaleMin <= 20 && Array.from({ length: draft.scaleMax - draft.scaleMin + 1 }, (_, offset) => draft.scaleMin + offset).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
              </div>
            </section>
          )}

          {["short_text", "long_text", "number"].includes(draft.questionType) && (
            <label className="block text-xs font-bold text-slate-700">Kunci jawaban <span className="font-normal text-slate-400">(opsional; kosong berarti tidak dinilai otomatis)</span><input type={draft.questionType === "number" ? "number" : "text"} value={draft.correctAnswers[0] || ""} maxLength={2000} onChange={(event) => onChange({ ...draft, correctAnswers: event.target.value ? [event.target.value] : [] })} className="mt-2 min-h-11 w-full border border-slate-300 px-3 text-sm font-normal" /></label>
          )}

          <section className="grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-700">Poin<input type="number" min="0" max="10000" value={draft.points} onChange={(event) => onChange({ ...draft, points: Number(event.target.value) })} className="mt-2 min-h-11 w-full border border-slate-300 px-3 text-sm font-normal" /></label>
            <label className="flex min-h-11 items-center gap-3 self-end border border-slate-200 px-4 text-xs font-bold text-slate-700"><input type="checkbox" checked={draft.required} onChange={(event) => onChange({ ...draft, required: event.target.checked })} /> Wajib dijawab peserta</label>
          </section>

          {validationError && <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{validationError}</p>}
        </div>

        <footer className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <button type="button" onClick={onClose} disabled={saving} className="min-h-11 px-5 text-sm font-bold text-slate-600 disabled:opacity-50">Batal</button>
          <button type="button" onClick={save} disabled={saving} className="inline-flex min-h-11 items-center gap-2 bg-blue-900 px-5 text-sm font-bold text-white hover:bg-blue-950 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan pertanyaan</button>
        </footer>
      </div>
    </div>
  );
}

function QuestionnairePreviewDialog({
  kind,
  meta,
  questions,
  status,
  onClose,
}: {
  kind: Kind;
  meta: QuestionnaireMeta;
  questions: ScoredProgramQuestion[];
  status: QuestionnaireStatus;
  onClose: () => void;
}) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose);
  const answeredCount = useMemo(() => questions.filter((question) => {
    const answer = answers[question.id];
    if (Array.isArray(answer)) return answer.length > 0;
    return answer !== undefined && answer !== null && answer !== "";
  }).length, [answers, questions]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 p-0 backdrop-blur-sm sm:p-5" role="presentation">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="preview-title" className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden bg-slate-100 shadow-2xl sm:h-[calc(100vh-2.5rem)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600">Pratinjau peserta</p><h2 id="preview-title" className="mt-1 text-lg font-semibold text-[#0B2C6B]">Tampilan sebelum dipublikasikan</h2></div>
          <div className="flex items-center gap-2">
            <div className="hidden border border-slate-200 bg-slate-50 p-1 sm:flex" role="group" aria-label="Ukuran pratinjau">
              <button type="button" onClick={() => setDevice("desktop")} aria-pressed={device === "desktop"} className={`grid h-9 w-10 place-items-center ${device === "desktop" ? "bg-white text-blue-900 shadow-sm" : "text-slate-400"}`} aria-label="Pratinjau desktop"><Monitor className="h-4 w-4" /></button>
              <button type="button" onClick={() => setDevice("mobile")} aria-pressed={device === "mobile"} className={`grid h-9 w-10 place-items-center ${device === "mobile" ? "bg-white text-blue-900 shadow-sm" : "text-slate-400"}`} aria-label="Pratinjau mobile"><Smartphone className="h-4 w-4" /></button>
            </div>
            <button data-autofocus type="button" onClick={onClose} aria-label="Tutup pratinjau" className="grid h-11 w-11 place-items-center border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><X className="h-5 w-5" /></button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6">
          <div className={`mx-auto overflow-hidden bg-slate-50 shadow-[0_20px_60px_rgba(15,23,42,0.16)] transition-[max-width] ${device === "mobile" ? "max-w-[390px]" : "max-w-3xl"}`}>
            <div className="border-b border-slate-200 bg-white px-5 py-7 sm:px-8">
              <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">{kind === "pre_test" ? "Pengukuran awal" : "Pengukuran akhir"}</p><span className="bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{statusLabel(status)}</span></div>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{meta.title || "Judul belum diisi"}</h3>
              {meta.description && <p className="mt-3 text-sm leading-6 text-slate-600">{meta.description}</p>}
              <p className="mt-5 text-xs text-slate-500">{answeredCount}/{questions.length} terjawab · {meta.allowRetake ? "Dapat diulang" : "Satu kali pengiriman"}</p>
            </div>
            <div className="space-y-5 px-4 py-6 sm:px-8">
              <div className="border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900"><strong>Mode pratinjau.</strong> Anda dapat mencoba semua kontrol; jawaban tidak disimpan dan tidak memengaruhi statistik.</div>
              {meta.instructions && <div className="border-l-4 border-amber-400 bg-white px-5 py-4 text-sm leading-6 text-slate-600"><strong className="text-slate-900">Petunjuk:</strong> {meta.instructions}</div>}
              <ProgramQuestionnaireForm questions={questions} answers={answers} onAnswer={(questionId, value) => setAnswers((current) => ({ ...current, [questionId]: value }))} />
              <button type="button" disabled className="min-h-12 w-full bg-blue-900 px-6 text-sm font-bold text-white opacity-60">Kirim jawaban — dinonaktifkan di pratinjau</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestManagerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = searchParams.get("programId") || "";
  const [program, setProgram] = useState<{ id: string; code: string; title: string } | null>(null);
  const [programs, setPrograms] = useState<Array<{ id: string; code: string | null; title: string; status: string }>>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [programsError, setProgramsError] = useState("");
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [kind, setKind] = useState<Kind>("pre_test");
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("questions");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState<QuestionnaireMeta>(() => questionnaireMeta(null, "pre_test", ""));
  const [metaDirty, setMetaDirty] = useState(false);
  const [questionDraft, setQuestionDraft] = useState<QuestionDraft | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<Array<Record<string, unknown>>>([]);
  const [importMeta, setImportMeta] = useState({ filename: "", sourceType: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let activeRequest = true;
    void (async () => {
      try {
        const response = await fetch("/api/engagements", { headers: { Authorization: `Bearer ${await token()}` } });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success) throw new Error(body.error || "Daftar program tidak dapat dimuat.");
        if (activeRequest) setPrograms((body.engagements || []).filter((item: { status?: string }) => item.status !== "archived"));
      } catch (failure) {
        if (activeRequest) setProgramsError(failure instanceof Error ? failure.message : "Daftar program tidak dapat dimuat.");
      } finally {
        if (activeRequest) setProgramsLoading(false);
      }
    })();
    return () => { activeRequest = false; };
  }, []);

  const load = useCallback(async () => {
    if (!programId) {
      setProgram(null);
      setQuestionnaires([]);
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/program-questionnaires?programId=${encodeURIComponent(programId)}`, { headers: { Authorization: `Bearer ${await token()}` } });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) throw new Error(body.error || "Data test tidak dapat dimuat.");
      const loadedQuestionnaires = (body.questionnaires || []) as Questionnaire[];
      const loadedProgram = body.program as { id: string; code: string; title: string };
      setProgram(loadedProgram);
      setQuestionnaires(loadedQuestionnaires);
      setMeta(questionnaireMeta(loadedQuestionnaires.find((item) => item.kind === kind) || null, kind, loadedProgram?.title || ""));
      setMetaDirty(false);
      setQuestionDraft(null);
      setImportPreview([]);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Data test tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, [kind, programId]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  const active = useMemo(() => questionnaires.find((item) => item.kind === kind) || null, [questionnaires, kind]);
  const statistics = active?.statistics || EMPTY_STATISTICS;
  const responseCount = statistics.overall.submissionCount;
  const editingLocked = responseCount > 0;
  const totalPoints = active ? totalQuestionnairePoints(active.questions) : 0;

  const mutation = async (payload: Record<string, unknown>) => {
    const response = await fetch("/api/admin/program-questionnaires", {
      method: "POST",
      headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.success) throw new Error(body.error || "Perubahan belum dapat disimpan.");
    return body;
  };

  const changeMeta = (patch: Partial<QuestionnaireMeta>) => {
    setMeta((current) => ({ ...current, ...patch }));
    setMetaDirty(true);
  };

  const saveMeta = async () => {
    if (meta.title.trim().length < 3) {
      toast.error("Judul test minimal terdiri dari 3 karakter.");
      setWorkspaceTab("settings");
      return;
    }
    setSaving(true);
    try {
      await mutation({
        action: "save_questionnaire",
        id: active?.id,
        programId,
        kind,
        title: meta.title,
        description: meta.description,
        instructions: meta.instructions,
        passingScore: meta.passingScore === "" ? null : Number(meta.passingScore),
        allowRetake: meta.allowRetake,
        shuffleQuestions: meta.shuffleQuestions,
      });
      toast.success(`${kind === "pre_test" ? "Pre-test" : "Post-test"} disimpan.`);
      await load();
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : "Gagal menyimpan test.");
    } finally {
      setSaving(false);
    }
  };

  const saveQuestion = async () => {
    if (!active || !questionDraft) return;
    const validation = validateQuestionDraft(questionDraft);
    if (validation) return;
    setSaving(true);
    try {
      const position = questionDraft.id ? active.questions.find((item) => item.id === questionDraft.id)?.position || 1 : active.questions.length + 1;
      await mutation({ action: "save_question", questionnaireId: active.id, question: draftToQuestionPayload(questionDraft, position) });
      toast.success("Pertanyaan disimpan sebagai draf.");
      setQuestionDraft(null);
      await load();
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : "Pertanyaan gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const duplicateQuestion = async (question: ScoredProgramQuestion) => {
    if (!active || editingLocked) return;
    setSaving(true);
    try {
      await mutation({ action: "save_question", questionnaireId: active.id, question: storedQuestionToPayload(question, active.questions.length + 1) });
      toast.success("Salinan pertanyaan ditambahkan di bagian akhir.");
      await load();
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : "Pertanyaan tidak dapat diduplikasi.");
    } finally {
      setSaving(false);
    }
  };

  const reorderQuestion = async (questionId: string, direction: -1 | 1) => {
    if (!active || editingLocked) return;
    const reordered = moveQuestion(active.questions, questionId, direction);
    if (reordered === active.questions) return;
    setSaving(true);
    try {
      await mutation({ action: "replace_questions", questionnaireId: active.id, sourceFilename: null, sourceType: "manual_reorder", questions: reordered.map((question, index) => storedQuestionToPayload(question, index + 1)) });
      toast.success("Urutan pertanyaan diperbarui.");
      await load();
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : "Urutan pertanyaan belum dapat disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!window.confirm("Hapus pertanyaan ini? Tindakan ini tidak dapat dibatalkan.")) return;
    setSaving(true);
    try {
      await mutation({ action: "delete_question", questionId });
      toast.success("Pertanyaan dihapus.");
      await load();
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : "Pertanyaan tidak dapat dihapus.");
    } finally {
      setSaving(false);
    }
  };

  const importFile = async (file: File) => {
    setSaving(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/program-questionnaires/import", { method: "POST", headers: { Authorization: `Bearer ${await token()}` }, body: form });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) throw new Error(body.error || "Dokumen tidak dapat dibaca.");
      setImportPreview(body.questions || []);
      setImportMeta({ filename: body.filename, sourceType: body.sourceType });
      toast.success(`${body.questions.length} pertanyaan siap diperiksa.`);
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : "Impor gagal.");
    } finally {
      setSaving(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const applyImport = async () => {
    if (!active || editingLocked) return;
    if (!window.confirm("Impor akan mengganti seluruh daftar soal saat ini. Lanjutkan?")) return;
    setSaving(true);
    try {
      await mutation({ action: "replace_questions", questionnaireId: active.id, sourceFilename: importMeta.filename, sourceType: importMeta.sourceType, questions: importPreview });
      toast.success("Pertanyaan hasil impor disimpan sebagai draf.");
      setImportPreview([]);
      await load();
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : "Impor belum dapat disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (status: QuestionnaireStatus) => {
    if (!active) return;
    if (status === "published" && metaDirty) {
      toast.error("Simpan perubahan pengaturan sebelum mempublikasikan.");
      setWorkspaceTab("settings");
      return;
    }
    setSaving(true);
    try {
      await mutation({ action: "set_status", questionnaireId: active.id, status });
      toast.success(status === "published" ? "Test dipublikasikan untuk peserta." : status === "archived" ? "Penerimaan respons ditutup." : "Test dikembalikan menjadi draf.");
      await load();
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : "Status belum dapat diubah.");
    } finally {
      setSaving(false);
    }
  };

  const downloadResponses = () => {
    if (!active || !program || active.submissions.length === 0) return;
    const csvCell = (value: unknown) => {
      const text = Array.isArray(value) ? value.join(" | ") : value === null || value === undefined ? "" : String(value);
      return `"${text.replaceAll('"', '""')}"`;
    };
    const headers = ["submitted_at", "attempt", "participant_id", "profile_id", "score", "maximum_score", "percentage", ...active.questions.map((question, index) => `Q${index + 1}: ${question.prompt}`)];
    const rows = active.submissions.map((submission) => {
      const answerMap = new Map<string, unknown>();
      if (Array.isArray(submission.answers)) {
        for (const item of submission.answers) {
          if (item && typeof item === "object" && "questionId" in item && "value" in item) {
            const answer = item as { questionId: string; value: unknown };
            answerMap.set(answer.questionId, answer.value);
          }
        }
      }
      return [submission.submitted_at, submission.attempt_number, submission.participant_id, submission.profile_id, submission.score, submission.maximum_score, submission.percentage, ...active.questions.map((question) => answerMap.get(question.id))].map(csvCell).join(",");
    });
    const safeCode = (program.code || program.title || "program").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "");
    downloadBlob(new Blob([`\uFEFF${[headers.map(csvCell).join(","), ...rows].join("\r\n")}`], { type: "text/csv;charset=utf-8" }), `${safeCode}-${kind}-responses.csv`);
  };

  const confirmDiscard = () => !metaDirty || window.confirm("Perubahan pengaturan belum disimpan. Tetap berpindah?");
  const selectProgram = (nextProgramId: string) => {
    if (!confirmDiscard()) return;
    router.replace(nextProgramId ? `/admin/programs/tests?programId=${encodeURIComponent(nextProgramId)}` : "/admin/programs/tests", { scroll: false });
  };
  const selectKind = (nextKind: Kind) => {
    if (nextKind === kind || !confirmDiscard()) return;
    setKind(nextKind);
    setWorkspaceTab("questions");
  };

  const programPicker = (
    <section className="border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <label className="block min-w-0 flex-1 text-xs font-bold text-slate-700">
          Program yang dikelola
          <select value={programId} onChange={(event) => selectProgram(event.target.value)} disabled={programsLoading || Boolean(programsError) || programs.length === 0} className="mt-2 min-h-11 w-full border border-slate-300 bg-white px-3 text-sm font-semibold text-[#0B2C6B] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 lg:max-w-xl">
            <option value="">{programsLoading ? "Memuat program..." : programs.length === 0 ? "Belum ada program tersedia" : "Pilih program"}</option>
            {programs.map((item) => <option key={item.id} value={item.id}>{item.code ? `${item.code} · ` : ""}{item.title}</option>)}
          </select>
        </label>
        {program && <div className="min-w-0 lg:max-w-md lg:text-right"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600">{program.code || "Tanpa kode"}</p><p className="mt-1 truncate text-sm font-bold text-slate-900">{program.title}</p></div>}
      </div>
      {programsError && <p role="alert" className="mt-3 text-xs text-red-700">{programsError}</p>}
      {!programsLoading && !programsError && programs.length === 0 && <p className="mt-3 text-xs text-slate-500">Buat program aktif terlebih dahulu sebelum menyusun Pre-test atau Post-test.</p>}
    </section>
  );

  if (!programId) return <div className="mx-auto max-w-[1500px] space-y-6">{programPicker}<section className="border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><ListChecks className="mx-auto h-8 w-8 text-blue-900" /><h2 className="mt-4 text-base font-bold text-[#0B2C6B]">Pilih program untuk mulai</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Pertanyaan, pengaturan publikasi, dan statistik selalu dikelola per program agar hasil peserta tidak tercampur.</p></section></div>;
  if (loading) return <div className="mx-auto max-w-[1500px] space-y-6">{programPicker}<div className="flex min-h-[20rem] items-center justify-center gap-3 text-sm font-semibold text-blue-900"><Loader2 className="h-5 w-5 animate-spin" /> Memuat editor test...</div></div>;
  if (error || !program) return <div className="mx-auto max-w-[1500px] space-y-6">{programPicker}<div className="border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error || "Program tidak ditemukan."}</div></div>;

  const tabs: Array<{ key: WorkspaceTab; label: string; icon: typeof ListChecks; count?: number }> = [
    { key: "questions", label: "Pertanyaan", icon: ListChecks, count: active?.questions.length || 0 },
    { key: "responses", label: "Respons", icon: BarChart3, count: responseCount },
    { key: "settings", label: "Pengaturan", icon: Settings2 },
  ];

  return (
    <div className="mx-auto max-w-[1500px]">
      {programPicker}

      <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Link href={`/admin/engagements/manage?id=${program.id}`} className="inline-flex min-h-10 items-center gap-2 text-xs font-bold text-blue-900"><ArrowLeft className="h-4 w-4" /> Kembali ke program</Link>
        <div className="inline-flex self-start border border-slate-200 bg-white p-1">
          {(["pre_test", "post_test"] as Kind[]).map((item) => <button key={item} type="button" onClick={() => selectKind(item)} className={`min-h-10 px-5 text-xs font-bold transition-colors ${kind === item ? "bg-blue-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>{item === "pre_test" ? "Pre-test" : "Post-test"}</button>)}
        </div>
      </div>

      <section className="mt-4 border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${active?.status === "published" ? "bg-emerald-100 text-emerald-800" : active?.status === "archived" ? "bg-slate-200 text-slate-700" : "bg-amber-100 text-amber-800"}`}>{active ? statusLabel(active.status) : "Belum dibuat"}</span>{metaDirty && <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700 ring-1 ring-amber-300">Perubahan belum disimpan</span>}</div>
            <h2 className="mt-2 truncate text-xl font-semibold text-[#0B2C6B]">{meta.title}</h2>
            <p className="mt-1 text-xs text-slate-500">{active ? `Versi ${active.version} · ${active.questions.length} pertanyaan · ${totalPoints} total poin` : "Simpan pengaturan dasar untuk mulai menambahkan pertanyaan."}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setPreviewOpen(true)} disabled={!active || active.questions.length === 0} className="inline-flex min-h-11 items-center gap-2 border border-slate-300 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><Eye className="h-4 w-4" /> Pratinjau peserta</button>
            {metaDirty && <button type="button" onClick={() => void saveMeta()} disabled={saving} className="inline-flex min-h-11 items-center gap-2 border border-blue-200 px-4 text-xs font-bold text-blue-900 hover:bg-blue-50 disabled:opacity-50"><Save className="h-4 w-4" /> Simpan</button>}
            {active?.status === "published" ? <button type="button" onClick={() => void setStatus("archived")} disabled={saving} className="min-h-11 border border-slate-300 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Tutup respons</button> : active?.status === "archived" ? <button type="button" onClick={() => void setStatus("draft")} disabled={saving} className="min-h-11 border border-amber-300 px-4 text-xs font-bold text-amber-800 hover:bg-amber-50 disabled:opacity-50">Buka sebagai draf</button> : <button type="button" onClick={() => void setStatus("published")} disabled={!active || active.questions.length === 0 || saving} className="inline-flex min-h-11 items-center gap-2 bg-blue-900 px-4 text-xs font-bold text-white hover:bg-blue-950 disabled:cursor-not-allowed disabled:bg-slate-300"><Send className="h-4 w-4" /> Publikasikan</button>}
          </div>
        </div>

        <div className="flex overflow-x-auto px-3 pt-2 sm:px-5" role="tablist" aria-label="Area pengelolaan test">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = workspaceTab === tab.key;
            return <button key={tab.key} type="button" role="tab" aria-selected={selected} onClick={() => setWorkspaceTab(tab.key)} className={`inline-flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-xs font-bold transition-colors ${selected ? "border-blue-900 text-blue-900" : "border-transparent text-slate-500 hover:text-slate-900"}`}><Icon className="h-4 w-4" /> {tab.label}{tab.count !== undefined && <span className={`min-w-5 px-1.5 py-0.5 text-center text-[10px] ${selected ? "bg-blue-100 text-blue-900" : "bg-slate-100 text-slate-500"}`}>{tab.count}</span>}</button>;
          })}
        </div>
      </section>

      {workspaceTab === "questions" && (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-600">Form builder</p><h3 className="mt-1 text-lg font-bold text-slate-950">Susun pertanyaan</h3><p className="mt-1 text-xs leading-5 text-slate-500">Gunakan satu konsep per pertanyaan. Atur kunci dan poin hanya jika jawaban perlu dinilai otomatis.</p></div><button type="button" onClick={() => setQuestionDraft(createEmptyQuestionDraft())} disabled={!active || editingLocked || saving} className="inline-flex min-h-11 items-center gap-2 bg-blue-900 px-4 text-xs font-bold text-white hover:bg-blue-950 disabled:cursor-not-allowed disabled:bg-slate-300"><Plus className="h-4 w-4" /> Tambah pertanyaan</button></div>

            {!active && <div className="mt-6 border border-dashed border-slate-300 p-8 text-center"><p className="text-sm font-bold text-slate-800">Form belum dibuat.</p><p className="mt-2 text-xs leading-5 text-slate-500">Buka tab Pengaturan, lengkapi judul, lalu simpan sebelum menambah pertanyaan.</p><button type="button" onClick={() => setWorkspaceTab("settings")} className="mt-4 min-h-10 border border-blue-200 px-4 text-xs font-bold text-blue-900">Buka pengaturan</button></div>}
            {editingLocked && <div className="mt-5 border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900"><strong>Struktur dikunci.</strong> Test sudah memiliki {responseCount} respons. Pertanyaan tidak dapat diubah, diurutkan, atau dihapus agar hasil lama tetap dapat diaudit.</div>}
            {active && active.questions.length === 0 && <div className="mt-6 border border-dashed border-slate-300 p-10 text-center"><ListChecks className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-4 text-sm font-bold text-slate-800">Belum ada pertanyaan</p><p className="mt-2 text-xs text-slate-500">Tambahkan secara manual atau impor dari dokumen yang sudah disiapkan.</p></div>}

            <ol className="mt-5 space-y-3">
              {active?.questions.map((question, index) => (
                <li key={question.id} className="border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-blue-50 text-xs font-bold text-blue-900">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700">{questionTypeLabel(question.question_type)}</span>{question.required && <span className="bg-red-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-700">Wajib</span>}{question.correct_answer !== null && question.correct_answer !== undefined && <span className="bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">Dinilai · {question.points} poin</span>}</div>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{question.prompt}</p>
                      {question.help_text && <p className="mt-1 text-xs leading-5 text-slate-500">{question.help_text}</p>}
                      {question.options && question.options.length > 0 && <p className="mt-3 line-clamp-2 text-xs text-slate-500">{question.options.join(" · ")}</p>}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-end gap-1 border-t border-slate-100 pt-3">
                    <button type="button" onClick={() => void reorderQuestion(question.id, -1)} disabled={editingLocked || saving || index === 0} aria-label="Naikkan pertanyaan" title="Naikkan" className="grid h-10 w-10 place-items-center text-slate-500 hover:bg-slate-100 disabled:opacity-25"><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" onClick={() => void reorderQuestion(question.id, 1)} disabled={editingLocked || saving || index === active.questions.length - 1} aria-label="Turunkan pertanyaan" title="Turunkan" className="grid h-10 w-10 place-items-center text-slate-500 hover:bg-slate-100 disabled:opacity-25"><ArrowDown className="h-4 w-4" /></button>
                    <button type="button" onClick={() => void duplicateQuestion(question)} disabled={editingLocked || saving} aria-label="Duplikasi pertanyaan" title="Duplikasi" className="grid h-10 w-10 place-items-center text-slate-500 hover:bg-slate-100 disabled:opacity-25"><Copy className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setQuestionDraft(questionToDraft(question))} disabled={editingLocked || saving} aria-label="Edit pertanyaan" title="Edit" className="grid h-10 w-10 place-items-center text-blue-900 hover:bg-blue-50 disabled:opacity-25"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => void deleteQuestion(question.id)} disabled={editingLocked || saving} aria-label="Hapus pertanyaan" title="Hapus" className="grid h-10 w-10 place-items-center text-red-600 hover:bg-red-50 disabled:opacity-25"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <aside className="space-y-5">
            <section className="border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><FileUp className="mt-0.5 h-5 w-5 text-amber-600" /><div><h3 className="font-bold text-slate-950">Impor dari dokumen</h3><p className="mt-1 text-xs leading-5 text-slate-500">DOCX/TXT memakai nomor dan A/B/C. CSV memakai kolom question, type, options, correct_answer, points. JSON juga didukung.</p></div></div><input ref={fileRef} type="file" accept=".docx,.txt,.csv,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file); }} className="mt-4 block w-full text-xs file:mr-3 file:min-h-10 file:border-0 file:bg-blue-50 file:px-4 file:font-bold file:text-blue-900" disabled={!active || editingLocked || saving} />{importPreview.length > 0 && <div className="mt-4 border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-bold text-amber-900">{importPreview.length} pertanyaan dari {importMeta.filename}</p><p className="mt-1 text-xs leading-5 text-amber-800">Periksa sampel berikut. Menggunakan hasil impor akan mengganti seluruh soal saat ini.</p><div className="mt-3 max-h-48 space-y-2 overflow-y-auto">{importPreview.slice(0, 10).map((question, index) => <p key={index} className="bg-white px-3 py-2 text-xs text-slate-700">{index + 1}. {String(question.prompt || "")}</p>)}</div><div className="mt-3 flex gap-2"><button type="button" onClick={() => setImportPreview([])} className="min-h-10 px-3 text-xs font-bold text-slate-600">Batal</button><button type="button" onClick={() => void applyImport()} disabled={saving} className="inline-flex min-h-10 items-center gap-2 bg-amber-500 px-3 text-xs font-bold text-slate-950"><Check className="h-4 w-4" /> Gunakan hasil impor</button></div></div>}</section>
            <section className="border border-slate-200 bg-slate-50 p-5"><h3 className="text-sm font-bold text-slate-900">Checklist kualitas</h3><ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600"><li>• Gunakan bahasa yang singkat dan netral.</li><li>• Hindari dua pertanyaan dalam satu kalimat.</li><li>• Pastikan semua pilihan tidak tumpang tindih.</li><li>• Gunakan preview desktop dan mobile sebelum publish.</li></ul></section>
          </aside>
        </div>
      )}

      {workspaceTab === "responses" && (
        <section className="mt-5 border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-600">Analitik</p><h3 className="mt-1 text-lg font-bold text-slate-950">Respons peserta</h3><p className="mt-1 text-xs text-slate-500">Statistik berasal dari jawaban tersimpan dan tidak memasukkan interaksi dalam mode pratinjau.</p></div><button type="button" onClick={downloadResponses} disabled={!active || responseCount === 0} className="inline-flex min-h-11 items-center gap-2 border border-slate-300 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><Download className="h-4 w-4" /> Unduh CSV</button></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><div className="bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Respons</p><p className="mt-2 text-2xl font-bold text-slate-950">{responseCount}</p></div><div className="bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Rata-rata</p><p className="mt-2 text-2xl font-bold text-slate-950">{statistics.overall.averagePercentage === null ? "—" : `${statistics.overall.averagePercentage}%`}</p></div><div className="bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Tertinggi</p><p className="mt-2 text-2xl font-bold text-emerald-700">{statistics.overall.maximumPercentage === null ? "—" : `${statistics.overall.maximumPercentage}%`}</p></div><div className="bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Terendah</p><p className="mt-2 text-2xl font-bold text-amber-700">{statistics.overall.minimumPercentage === null ? "—" : `${statistics.overall.minimumPercentage}%`}</p></div></div>
          {responseCount === 0 ? <div className="mt-6 border border-dashed border-slate-300 px-6 py-12 text-center"><BarChart3 className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-4 text-sm font-bold text-slate-800">Belum ada respons</p><p className="mt-2 text-xs text-slate-500">Publikasikan test dan bagikan akses program kepada peserta.</p></div> : <div className="mt-6 grid gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]"><section className="border border-slate-200 p-4"><h4 className="text-sm font-bold text-slate-900">Distribusi skor</h4><div className="mt-4 space-y-3">{statistics.overall.distribution.map((item) => <div key={item.label}><div className="flex justify-between text-xs text-slate-600"><span>{item.label}%</span><strong>{item.count}</strong></div><div className="mt-1.5 h-2 bg-slate-100"><div className="h-full bg-blue-900" style={{ width: `${responseCount ? Math.min(100, (item.count / responseCount) * 100) : 0}%` }} /></div></div>)}</div></section><section className="space-y-3">{statistics.perQuestion.map((item, index) => <article key={item.questionId} className="border border-slate-200 p-4"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Pertanyaan {index + 1}</p><h4 className="mt-1 text-sm font-semibold leading-6 text-slate-900">{item.prompt}</h4></div><span className="shrink-0 bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{item.responseRatePercent}% terjawab</span></div>{item.numericSummary && <p className="mt-3 text-xs text-slate-600">Rata-rata <strong>{item.numericSummary.average}</strong> · Minimum {item.numericSummary.minimum} · Maksimum {item.numericSummary.maximum}</p>}{item.optionCounts.length > 0 && <div className="mt-4 space-y-2">{item.optionCounts.map((option) => <div key={option.label}><div className="flex justify-between gap-3 text-xs text-slate-600"><span className="truncate">{option.label}</span><strong>{option.count}</strong></div><div className="mt-1 h-1.5 bg-slate-100"><div className="h-full bg-amber-500" style={{ width: `${item.responseCount ? Math.min(100, (option.count / item.responseCount) * 100) : 0}%` }} /></div></div>)}</div>}</article>)}</section></div>}
        </section>
      )}

      {workspaceTab === "settings" && (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-600">Identitas form</p><h3 className="mt-1 text-lg font-bold text-slate-950">Judul dan petunjuk peserta</h3></div>
            <div className="mt-5 grid gap-4"><label className="text-xs font-bold text-slate-700">Judul<input value={meta.title} maxLength={300} onChange={(event) => changeMeta({ title: event.target.value })} className="mt-2 min-h-11 w-full border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-700" /></label><label className="text-xs font-bold text-slate-700">Deskripsi <span className="font-normal text-slate-400">(opsional)</span><textarea rows={3} value={meta.description} maxLength={4000} onChange={(event) => changeMeta({ description: event.target.value })} className="mt-2 w-full border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-blue-700" /></label><label className="text-xs font-bold text-slate-700">Petunjuk peserta <span className="font-normal text-slate-400">(opsional)</span><textarea rows={3} value={meta.instructions} maxLength={4000} onChange={(event) => changeMeta({ instructions: event.target.value })} className="mt-2 w-full border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-blue-700" /></label></div>
            <div className="mt-6 border-t border-slate-200 pt-6"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-600">Perilaku dan penilaian</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-slate-700">Skor lulus (%) <span className="font-normal text-slate-400">(opsional)</span><input type="number" min="0" max="100" value={meta.passingScore} onChange={(event) => changeMeta({ passingScore: event.target.value })} placeholder="Contoh: 70" className="mt-2 min-h-11 w-full border border-slate-300 px-3 text-sm font-normal" /></label><div className="space-y-3"><label className="flex min-h-11 items-center gap-3 border border-slate-200 px-4 text-xs font-bold"><input type="checkbox" checked={meta.allowRetake} onChange={(event) => changeMeta({ allowRetake: event.target.checked })} /> Izinkan peserta mengulang</label><label className="flex min-h-11 items-center gap-3 border border-slate-200 px-4 text-xs font-bold"><input type="checkbox" checked={meta.shuffleQuestions} onChange={(event) => changeMeta({ shuffleQuestions: event.target.checked })} /> Acak urutan pertanyaan</label></div></div></div>
            <button type="button" disabled={saving || !metaDirty && Boolean(active)} onClick={() => void saveMeta()} className="mt-6 inline-flex min-h-11 items-center gap-2 bg-blue-900 px-5 text-sm font-bold text-white hover:bg-blue-950 disabled:cursor-not-allowed disabled:bg-slate-300">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {active ? "Simpan pengaturan" : "Buat form"}</button>
          </section>
          <aside className="space-y-5"><section className="border border-slate-200 bg-white p-5"><h3 className="text-sm font-bold text-slate-900">Kesiapan publikasi</h3><ul className="mt-4 space-y-3 text-xs"><li className={`flex gap-2 ${meta.title.trim().length >= 3 ? "text-emerald-700" : "text-slate-500"}`}><Check className="h-4 w-4 shrink-0" /> Judul form tersedia</li><li className={`flex gap-2 ${(active?.questions.length || 0) > 0 ? "text-emerald-700" : "text-slate-500"}`}><Check className="h-4 w-4 shrink-0" /> Minimal satu pertanyaan</li><li className={`flex gap-2 ${!metaDirty ? "text-emerald-700" : "text-amber-700"}`}><Check className="h-4 w-4 shrink-0" /> Tidak ada perubahan tertunda</li><li className={`flex gap-2 ${active && active.questions.length > 0 ? "text-emerald-700" : "text-slate-500"}`}><Eye className="h-4 w-4 shrink-0" /> Preview tersedia</li></ul></section><section className="border border-blue-200 bg-blue-50 p-5 text-xs leading-5 text-blue-900"><strong>Catatan audit:</strong> setelah respons pertama masuk, struktur pertanyaan dikunci. Pengaturan judul dan perilaku form masih dapat disesuaikan tanpa mengubah jawaban historis.</section></aside>
        </div>
      )}

      {questionDraft && <QuestionEditorDialog draft={questionDraft} saving={saving} onChange={setQuestionDraft} onClose={() => setQuestionDraft(null)} onSave={() => void saveQuestion()} />}
      {previewOpen && active && <QuestionnairePreviewDialog kind={kind} meta={meta} questions={active.questions} status={active.status} onClose={() => setPreviewOpen(false)} />}
    </div>
  );
}

export default function AdminProgramTestsPage() {
  return (
    <AdminAuthGate>
      <AdminShell eyebrow="Pengukuran Pembelajaran" title="Pre-test & Post-test" description="Bangun form pembelajaran, tinjau pengalaman peserta, publikasikan, dan analisis respons dari satu editor.">
        <Suspense fallback={<div className="flex min-h-[24rem] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-blue-900" /></div>}>
          <TestManagerContent />
        </Suspense>
      </AdminShell>
    </AdminAuthGate>
  );
}
