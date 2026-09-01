"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Check, FileUp, Loader2, Pencil, Plus, Save, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/lib/supabase";

type Kind = "pre_test" | "post_test";
type QuestionType = "single_choice" | "multiple_choice" | "yes_no" | "scale" | "short_text" | "long_text" | "number";
type Question = {
  id: string;
  position: number;
  question_type: QuestionType;
  prompt: string;
  help_text: string | null;
  required: boolean;
  options: string[] | null;
  correct_answer: unknown;
  points: number;
  scale_min: number | null;
  scale_max: number | null;
  scale_labels: Record<string, string> | null;
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
  status: "draft" | "published" | "archived";
  questions: Question[];
  statistics: {
    submissionCount: number;
    averagePercentage: number | null;
    highestPercentage: number | null;
    lowestPercentage: number | null;
    scoreDistribution: Array<{ label: string; count: number }>;
    questions: Array<{ questionId: string; prompt: string; responseCount: number; responseRatePercent: number; optionCounts?: Array<{ value: string; count: number }>; numeric?: { average: number; minimum: number; maximum: number } | null }>;
  };
};

const EMPTY_QUESTION = {
  id: "",
  questionType: "single_choice" as QuestionType,
  prompt: "",
  helpText: "",
  required: true,
  optionsText: "",
  correctAnswer: "",
  points: 1,
  scaleMin: 1,
  scaleMax: 5,
};

function questionnaireMeta(questionnaire: Questionnaire | null, kind: Kind, programTitle: string) {
  return questionnaire ? {
    title: questionnaire.title,
    description: questionnaire.description || "",
    instructions: questionnaire.instructions || "",
    passingScore: questionnaire.passing_score === null ? "" : String(questionnaire.passing_score),
    allowRetake: questionnaire.allow_retake,
    shuffleQuestions: questionnaire.shuffle_questions,
  } : {
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

function TestManagerContent() {
  const searchParams = useSearchParams();
  const programId = searchParams.get("programId") || "";
  const [program, setProgram] = useState<{ id: string; code: string; title: string } | null>(null);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [kind, setKind] = useState<Kind>("pre_test");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState({ title: "", description: "", instructions: "", passingScore: "", allowRetake: false, shuffleQuestions: false });
  const [questionForm, setQuestionForm] = useState(EMPTY_QUESTION);
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [importPreview, setImportPreview] = useState<Array<Record<string, unknown>>>([]);
  const [importMeta, setImportMeta] = useState({ filename: "", sourceType: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!programId) { setError("Program tidak dipilih."); setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/program-questionnaires?programId=${encodeURIComponent(programId)}`, { headers: { Authorization: `Bearer ${await token()}` } });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) throw new Error(body.error || "Data test tidak dapat dimuat.");
      const loadedQuestionnaires = body.questionnaires || [];
      setProgram(body.program);
      setQuestionnaires(loadedQuestionnaires);
      setMeta(questionnaireMeta(loadedQuestionnaires.find((item: Questionnaire) => item.kind === kind) || null, kind, body.program?.title || ""));
      setEditingQuestion(false);
      setQuestionForm(EMPTY_QUESTION);
      setImportPreview([]);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Data test tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, [kind, programId]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  const active = useMemo(() => questionnaires.find((item) => item.kind === kind) || null, [questionnaires, kind]);

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

  const saveMeta = async () => {
    setSaving(true);
    try {
      await mutation({
        action: "save_questionnaire", id: active?.id, programId, kind,
        title: meta.title, description: meta.description, instructions: meta.instructions,
        passingScore: meta.passingScore === "" ? null : Number(meta.passingScore),
        allowRetake: meta.allowRetake, shuffleQuestions: meta.shuffleQuestions,
      });
      toast.success(`${kind === "pre_test" ? "Pre-test" : "Post-test"} disimpan.`);
      await load();
    } catch (failure) { toast.error(failure instanceof Error ? failure.message : "Gagal menyimpan test."); }
    finally { setSaving(false); }
  };

  const openQuestion = (question?: Question) => {
    setQuestionForm(question ? {
      id: question.id,
      questionType: question.question_type,
      prompt: question.prompt,
      helpText: question.help_text || "",
      required: question.required,
      optionsText: (question.options || []).join("\n"),
      correctAnswer: typeof question.correct_answer === "string"
        ? question.correct_answer
        : Array.isArray(question.correct_answer)
          ? question.correct_answer.join("|")
          : question.correct_answer === null || question.correct_answer === undefined
            ? ""
            : String(question.correct_answer),
      points: Number(question.points || 1),
      scaleMin: question.scale_min ?? 1,
      scaleMax: question.scale_max ?? 5,
    } : { ...EMPTY_QUESTION });
    setEditingQuestion(true);
  };

  const saveQuestion = async () => {
    if (!active) { toast.error("Simpan detail test terlebih dahulu."); return; }
    setSaving(true);
    try {
      const options = questionForm.optionsText.split("\n").map((item) => item.trim()).filter(Boolean);
      await mutation({
        action: "save_question", questionnaireId: active.id,
        question: {
          ...(questionForm.id ? { id: questionForm.id } : {}),
          position: questionForm.id ? active.questions.find((item) => item.id === questionForm.id)?.position || 1 : active.questions.length + 1,
          questionType: questionForm.questionType, prompt: questionForm.prompt, helpText: questionForm.helpText,
          required: questionForm.required, options,
          correctAnswer: questionForm.correctAnswer
            ? questionForm.questionType === "multiple_choice"
              ? questionForm.correctAnswer.split("|").map((item) => item.trim()).filter(Boolean)
              : questionForm.correctAnswer
            : null,
          points: Number(questionForm.points),
          scaleMin: questionForm.questionType === "scale" ? Number(questionForm.scaleMin) : null,
          scaleMax: questionForm.questionType === "scale" ? Number(questionForm.scaleMax) : null,
          scaleLabels: {},
        },
      });
      toast.success("Pertanyaan disimpan.");
      setEditingQuestion(false);
      setQuestionForm(EMPTY_QUESTION);
      await load();
    } catch (failure) { toast.error(failure instanceof Error ? failure.message : "Pertanyaan gagal disimpan."); }
    finally { setSaving(false); }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!window.confirm("Hapus pertanyaan ini?")) return;
    try { await mutation({ action: "delete_question", questionId }); toast.success("Pertanyaan dihapus."); await load(); }
    catch (failure) { toast.error(failure instanceof Error ? failure.message : "Pertanyaan tidak dapat dihapus."); }
  };

  const importFile = async (file: File) => {
    setSaving(true);
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/admin/program-questionnaires/import", { method: "POST", headers: { Authorization: `Bearer ${await token()}` }, body: form });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) throw new Error(body.error || "Dokumen tidak dapat dibaca.");
      setImportPreview(body.questions || []);
      setImportMeta({ filename: body.filename, sourceType: body.sourceType });
      toast.success(`${body.questions.length} pertanyaan siap diperiksa.`);
    } catch (failure) { toast.error(failure instanceof Error ? failure.message : "Impor gagal."); }
    finally { setSaving(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const applyImport = async () => {
    if (!active) return;
    if (!window.confirm("Impor akan mengganti seluruh daftar soal saat ini. Lanjutkan?")) return;
    setSaving(true);
    try {
      await mutation({ action: "replace_questions", questionnaireId: active.id, sourceFilename: importMeta.filename, sourceType: importMeta.sourceType, questions: importPreview });
      toast.success("Pertanyaan hasil impor disimpan sebagai draf.");
      setImportPreview([]);
      await load();
    } catch (failure) { toast.error(failure instanceof Error ? failure.message : "Impor belum dapat disimpan."); }
    finally { setSaving(false); }
  };

  const setStatus = async (status: Questionnaire["status"]) => {
    if (!active) return;
    setSaving(true);
    try { await mutation({ action: "set_status", questionnaireId: active.id, status }); toast.success(`Status diubah menjadi ${status}.`); await load(); }
    catch (failure) { toast.error(failure instanceof Error ? failure.message : "Status belum dapat diubah."); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex min-h-[24rem] items-center justify-center gap-3 text-sm font-semibold text-blue-900"><Loader2 className="h-5 w-5 animate-spin" /> Memuat editor test...</div>;
  if (error || !program) return <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error || "Program tidak ditemukan."}</div>;

  const statistics = active?.statistics;
  return (
    <div className="mx-auto max-w-[1500px]">
      <Link href={`/admin/engagements/manage?id=${program.id}`} className="inline-flex min-h-10 items-center gap-2 text-xs font-bold text-blue-900"><ArrowLeft className="h-4 w-4" /> Kembali ke program</Link>
      <div className="mt-3 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">{program.code}</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Pre-test & Post-test</h2><p className="mt-2 text-sm text-slate-600">Susun pertanyaan khusus untuk {program.title}, publikasikan, lalu pantau kualitas hasilnya.</p></div><div className="inline-flex self-start border border-slate-200 bg-white p-1">{(["pre_test", "post_test"] as Kind[]).map((item) => <button key={item} type="button" onClick={() => setKind(item)} className={`min-h-10 px-5 text-xs font-bold ${kind === item ? "bg-blue-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>{item === "pre_test" ? "Pre-test" : "Post-test"}</button>)}</div></div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        <div className="space-y-6">
          <section className="border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-600">Konfigurasi</p><h3 className="mt-1 text-lg font-bold text-slate-950">Identitas dan aturan test</h3></div>{active && <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${active.status === "published" ? "bg-emerald-100 text-emerald-800" : active.status === "archived" ? "bg-slate-200 text-slate-600" : "bg-amber-100 text-amber-800"}`}>{active.status}</span>}</div>
            <div className="mt-5 grid gap-4"><label className="text-xs font-bold text-slate-700">Judul<input value={meta.title} onChange={(event) => setMeta((current) => ({ ...current, title: event.target.value }))} className="mt-2 min-h-11 w-full border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-700" /></label><label className="text-xs font-bold text-slate-700">Deskripsi<textarea rows={3} value={meta.description} onChange={(event) => setMeta((current) => ({ ...current, description: event.target.value }))} className="mt-2 w-full border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-blue-700" /></label><label className="text-xs font-bold text-slate-700">Petunjuk peserta<textarea rows={3} value={meta.instructions} onChange={(event) => setMeta((current) => ({ ...current, instructions: event.target.value }))} className="mt-2 w-full border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-blue-700" /></label></div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3"><label className="text-xs font-bold text-slate-700">Skor lulus (%)<input type="number" min="0" max="100" value={meta.passingScore} onChange={(event) => setMeta((current) => ({ ...current, passingScore: event.target.value }))} placeholder="Opsional" className="mt-2 min-h-11 w-full border border-slate-300 px-3 text-sm font-normal" /></label><label className="flex min-h-11 items-center gap-3 self-end border border-slate-200 px-3 text-xs font-bold"><input type="checkbox" checked={meta.allowRetake} onChange={(event) => setMeta((current) => ({ ...current, allowRetake: event.target.checked }))} /> Boleh mengulang</label><label className="flex min-h-11 items-center gap-3 self-end border border-slate-200 px-3 text-xs font-bold"><input type="checkbox" checked={meta.shuffleQuestions} onChange={(event) => setMeta((current) => ({ ...current, shuffleQuestions: event.target.checked }))} /> Acak soal</label></div>
            <div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={saving} onClick={() => void saveMeta()} className="inline-flex min-h-11 items-center gap-2 bg-blue-900 px-5 text-xs font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" /> Simpan konfigurasi</button>{active && active.status !== "published" && <button type="button" disabled={saving || active.questions.length === 0} onClick={() => void setStatus("published")} className="inline-flex min-h-11 items-center gap-2 border border-emerald-300 px-5 text-xs font-bold text-emerald-800 disabled:opacity-40"><Send className="h-4 w-4" /> Publikasikan</button>}{active?.status === "published" && <button type="button" disabled={saving} onClick={() => void setStatus("draft")} className="inline-flex min-h-11 items-center gap-2 border border-slate-300 px-5 text-xs font-bold text-slate-700">Kembalikan ke draf</button>}</div>
          </section>

          <section className="border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-600">Question builder</p><h3 className="mt-1 text-lg font-bold text-slate-950">{active?.questions.length || 0} pertanyaan</h3></div><button type="button" onClick={() => openQuestion()} disabled={!active} className="inline-flex min-h-10 items-center gap-2 border border-blue-200 px-4 text-xs font-bold text-blue-900 disabled:opacity-40"><Plus className="h-4 w-4" /> Tambah pertanyaan</button></div>
            {!active && <p className="mt-5 border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Simpan konfigurasi test terlebih dahulu.</p>}
            {active && active.questions.length === 0 && <p className="mt-5 border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Belum ada soal. Tambahkan manual atau impor dokumen.</p>}
            <ol className="mt-5 space-y-2">{active?.questions.map((question, index) => <li key={question.id} className="group flex items-start gap-3 border border-slate-200 p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center bg-slate-100 text-xs font-bold text-slate-700">{index + 1}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold leading-6 text-slate-900">{question.prompt}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{question.question_type.replaceAll("_", " ")} • {question.required ? "Wajib" : "Opsional"} • {question.points} poin</p></div><button type="button" onClick={() => openQuestion(question)} className="flex h-9 w-9 items-center justify-center text-blue-900 hover:bg-blue-50" aria-label="Edit pertanyaan"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => void deleteQuestion(question.id)} className="flex h-9 w-9 items-center justify-center text-red-600 hover:bg-red-50" aria-label="Hapus pertanyaan"><Trash2 className="h-4 w-4" /></button></li>)}</ol>
          </section>
        </div>

        <div className="space-y-6">
          <section className="border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start gap-3"><FileUp className="h-5 w-5 text-amber-600" /><div><h3 className="font-bold text-slate-950">Impor soal dari dokumen</h3><p className="mt-1 text-xs leading-5 text-slate-500">DOCX/TXT: gunakan nomor untuk soal dan A/B/C untuk pilihan. CSV: kolom question, type, options, correct_answer, points. JSON juga didukung.</p></div></div><input ref={fileRef} type="file" accept=".docx,.txt,.csv,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file); }} className="mt-4 block w-full text-xs file:mr-3 file:min-h-10 file:border-0 file:bg-blue-50 file:px-4 file:font-bold file:text-blue-900" disabled={!active || saving} />{importPreview.length > 0 && <div className="mt-4 border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-bold text-amber-900">{importPreview.length} pertanyaan dari {importMeta.filename}</p><p className="mt-1 text-xs text-amber-800">Periksa preview. Menyimpan akan mengganti seluruh soal yang belum memiliki respons.</p><div className="mt-3 max-h-48 space-y-2 overflow-y-auto">{importPreview.map((question, index) => <p key={index} className="bg-white px-3 py-2 text-xs text-slate-700">{index + 1}. {String(question.prompt || "")}</p>)}</div><button type="button" onClick={() => void applyImport()} disabled={saving} className="mt-3 inline-flex min-h-10 items-center gap-2 bg-amber-500 px-4 text-xs font-bold text-slate-950"><Check className="h-4 w-4" /> Gunakan hasil impor</button></div>}</section>

          <section className="border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start gap-3"><BarChart3 className="h-5 w-5 text-blue-900" /><div><h3 className="font-bold text-slate-950">Statistik respons</h3><p className="mt-1 text-xs text-slate-500">Diperbarui dari jawaban peserta yang tersimpan.</p></div></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Respons</p><p className="mt-2 text-2xl font-bold text-slate-950">{statistics?.submissionCount || 0}</p></div><div className="bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Rata-rata</p><p className="mt-2 text-2xl font-bold text-slate-950">{statistics?.averagePercentage === null || statistics?.averagePercentage === undefined ? "—" : `${statistics.averagePercentage}%`}</p></div><div className="bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Tertinggi</p><p className="mt-2 text-xl font-bold text-emerald-700">{statistics?.highestPercentage === null || statistics?.highestPercentage === undefined ? "—" : `${statistics.highestPercentage}%`}</p></div><div className="bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Terendah</p><p className="mt-2 text-xl font-bold text-amber-700">{statistics?.lowestPercentage === null || statistics?.lowestPercentage === undefined ? "—" : `${statistics.lowestPercentage}%`}</p></div></div><div className="mt-5 space-y-4">{statistics?.questions?.map((item, index) => <div key={item.questionId} className="border-t border-slate-200 pt-4"><div className="flex justify-between gap-3"><p className="text-xs font-semibold leading-5 text-slate-800">{index + 1}. {item.prompt}</p><span className="shrink-0 text-[10px] font-bold text-slate-500">{item.responseRatePercent}%</span></div>{item.optionCounts?.map((option) => <div key={option.value} className="mt-2"><div className="flex justify-between text-[10px] text-slate-500"><span>{option.value}</span><span>{option.count}</span></div><div className="mt-1 h-1.5 bg-slate-100"><div className="h-full bg-blue-900" style={{ width: `${item.responseCount ? Math.min(100, (option.count / item.responseCount) * 100) : 0}%` }} /></div></div>)}</div>)}</div></section>
        </div>
      </div>

      {editingQuestion && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-[1px] sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="Editor pertanyaan"><div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-600">Question builder</p><h3 className="mt-1 text-lg font-bold text-slate-950">{questionForm.id ? "Edit pertanyaan" : "Pertanyaan baru"}</h3></div><button type="button" onClick={() => setEditingQuestion(false)} className="flex h-10 w-10 items-center justify-center text-slate-500 hover:bg-slate-100" aria-label="Tutup"><X className="h-5 w-5" /></button></div><div className="mt-5 grid gap-4"><label className="text-xs font-bold text-slate-700">Jenis<select value={questionForm.questionType} onChange={(event) => setQuestionForm((current) => ({ ...current, questionType: event.target.value as QuestionType }))} className="mt-2 min-h-11 w-full border border-slate-300 px-3 text-sm font-normal">{["single_choice", "multiple_choice", "yes_no", "scale", "short_text", "long_text", "number"].map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label><label className="text-xs font-bold text-slate-700">Pertanyaan<textarea rows={3} value={questionForm.prompt} onChange={(event) => setQuestionForm((current) => ({ ...current, prompt: event.target.value }))} className="mt-2 w-full border border-slate-300 px-3 py-2 text-sm font-normal" /></label><label className="text-xs font-bold text-slate-700">Bantuan singkat<input value={questionForm.helpText} onChange={(event) => setQuestionForm((current) => ({ ...current, helpText: event.target.value }))} className="mt-2 min-h-11 w-full border border-slate-300 px-3 text-sm font-normal" /></label>{["single_choice", "multiple_choice"].includes(questionForm.questionType) && <label className="text-xs font-bold text-slate-700">Pilihan (satu per baris)<textarea rows={5} value={questionForm.optionsText} onChange={(event) => setQuestionForm((current) => ({ ...current, optionsText: event.target.value }))} className="mt-2 w-full border border-slate-300 px-3 py-2 font-mono text-sm font-normal" /></label>}<div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-slate-700">Kunci jawaban<input value={questionForm.correctAnswer} onChange={(event) => setQuestionForm((current) => ({ ...current, correctAnswer: event.target.value }))} placeholder={questionForm.questionType === "multiple_choice" ? "Pisahkan beberapa jawaban dengan |" : "Opsional"} className="mt-2 min-h-11 w-full border border-slate-300 px-3 text-sm font-normal" /></label><label className="text-xs font-bold text-slate-700">Poin<input type="number" min="0" value={questionForm.points} onChange={(event) => setQuestionForm((current) => ({ ...current, points: Number(event.target.value) }))} className="mt-2 min-h-11 w-full border border-slate-300 px-3 text-sm font-normal" /></label></div>{questionForm.questionType === "scale" && <div className="grid grid-cols-2 gap-4"><label className="text-xs font-bold text-slate-700">Skala minimum<input type="number" value={questionForm.scaleMin} onChange={(event) => setQuestionForm((current) => ({ ...current, scaleMin: Number(event.target.value) }))} className="mt-2 min-h-11 w-full border border-slate-300 px-3" /></label><label className="text-xs font-bold text-slate-700">Skala maksimum<input type="number" value={questionForm.scaleMax} onChange={(event) => setQuestionForm((current) => ({ ...current, scaleMax: Number(event.target.value) }))} className="mt-2 min-h-11 w-full border border-slate-300 px-3" /></label></div>}<label className="flex min-h-11 items-center gap-3 border border-slate-200 px-3 text-xs font-bold"><input type="checkbox" checked={questionForm.required} onChange={(event) => setQuestionForm((current) => ({ ...current, required: event.target.checked }))} /> Wajib dijawab</label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setEditingQuestion(false)} className="min-h-11 px-5 text-xs font-bold text-slate-600">Batal</button><button type="button" disabled={saving} onClick={() => void saveQuestion()} className="inline-flex min-h-11 items-center gap-2 bg-blue-900 px-5 text-xs font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" /> Simpan pertanyaan</button></div></div></div>}
    </div>
  );
}

export default function AdminProgramTestsPage() {
  return <AdminAuthGate><AppShell role="admin" eyebrow="Learning Measurement" title="Kelola Pre-test & Post-test"><Suspense fallback={<div className="flex min-h-[24rem] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-blue-900" /></div>}><TestManagerContent /></Suspense></AppShell></AdminAuthGate>;
}
