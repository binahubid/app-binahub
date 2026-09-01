"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { ClientAuthGate } from "@/components/client-auth-gate";
import { supabase } from "@/lib/supabase";

type Question = {
  id: string;
  position: number;
  question_type: string;
  prompt: string;
  help_text: string | null;
  required: boolean;
  options: string[] | null;
  scale_min: number | null;
  scale_max: number | null;
};

type Questionnaire = {
  id: string;
  kind: "pre_test" | "post_test";
  title: string;
  description: string;
  instructions: string;
  passingScore: number | null;
  allowRetake: boolean;
  questions: Question[];
};

function TestContent() {
  const searchParams = useSearchParams();
  const kind = searchParams.get("kind") === "post_test" ? "post_test" : "pre_test";
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submissions, setSubmissions] = useState<Array<{ percentage: number | null; submitted_at: string; attempt_number: number }>>([]);
  const [canSubmit, setCanSubmit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sesi program tidak tersedia.");
      const response = await fetch(`/api/client/program-questionnaires?kind=${kind}`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) throw new Error(body.error || "Test tidak dapat dimuat.");
      setQuestionnaire(body.questionnaire);
      setSubmissions(body.submissions || []);
      setCanSubmit(Boolean(body.canSubmit));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Test tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const answeredCount = useMemo(() => Object.values(answers).filter((value) => value !== "" && value !== null && value !== undefined && (!Array.isArray(value) || value.length > 0)).length, [answers]);

  const submit = async () => {
    if (!questionnaire) return;
    const missing = questionnaire.questions.find((question) => question.required && (answers[question.id] === undefined || answers[question.id] === "" || (Array.isArray(answers[question.id]) && (answers[question.id] as unknown[]).length === 0)));
    if (missing) {
      document.getElementById(`question-${missing.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.error("Lengkapi seluruh pertanyaan wajib.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sesi program tidak tersedia.");
      const response = await fetch("/api/client/program-questionnaires", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ questionnaireId: questionnaire.id, answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })) }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) throw new Error(body.error || "Jawaban belum dapat disimpan.");
      toast.success("Jawaban berhasil disimpan.");
      setAnswers({});
      await load();
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : "Jawaban belum dapat disimpan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="flex min-h-screen items-center justify-center gap-3 bg-slate-50 text-sm font-semibold text-blue-900"><Loader2 className="h-5 w-5 animate-spin" /> Memuat {kind === "pre_test" ? "pre-test" : "post-test"}...</main>;
  if (error || !questionnaire) return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5"><div className="w-full max-w-md border border-red-200 bg-white p-6 text-center text-sm text-red-700"><p>{error || "Test tidak tersedia."}</p><Link href="/client/program" className="mt-5 inline-flex min-h-10 items-center gap-2 bg-blue-900 px-4 font-bold text-white"><ArrowLeft className="h-4 w-4" /> Kembali ke program</Link></div></main>;

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 py-7 sm:px-8">
          <Link href="/client/program" className="inline-flex min-h-10 items-center gap-2 text-xs font-bold text-blue-900"><ArrowLeft className="h-4 w-4" /> Program saya</Link>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">{kind === "pre_test" ? "Pengukuran awal" : "Pengukuran akhir"}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{questionnaire.title}</h1>
          {questionnaire.description && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{questionnaire.description}</p>}
          <div className="mt-5 flex items-center gap-3 text-xs text-slate-500"><span>{answeredCount}/{questionnaire.questions.length} terjawab</span><span aria-hidden="true">•</span><span>{questionnaire.allowRetake ? "Dapat diulang" : "Satu kali pengiriman"}</span></div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-5 px-5 py-7 sm:px-8">
        {submissions.length > 0 && <section className="border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /><div><h2 className="font-bold text-emerald-950">Jawaban terakhir tersimpan</h2><p className="mt-1 text-xs leading-5 text-emerald-800">Percobaan ke-{submissions[0].attempt_number} pada {new Date(submissions[0].submitted_at).toLocaleString("id-ID")}{submissions[0].percentage !== null ? ` • Skor ${submissions[0].percentage}%` : ""}.</p></div></div></section>}
        {questionnaire.instructions && <section className="border-l-4 border-amber-400 bg-white px-5 py-4 text-sm leading-6 text-slate-600"><strong className="text-slate-900">Petunjuk:</strong> {questionnaire.instructions}</section>}

        {questionnaire.questions.map((question, index) => (
          <fieldset id={`question-${question.id}`} key={question.id} className="border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <legend className="sr-only">Pertanyaan {index + 1}</legend>
            <div className="flex items-start gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center bg-blue-900 text-xs font-bold text-white">{index + 1}</span><div className="min-w-0 flex-1"><label className="font-semibold leading-6 text-slate-950">{question.prompt}{question.required && <span className="ml-1 text-red-500" aria-label="wajib">*</span>}</label>{question.help_text && <p className="mt-1 text-xs leading-5 text-slate-500">{question.help_text}</p>}</div></div>
            <div className="mt-5 pl-0 sm:pl-12">
              {question.question_type === "single_choice" || question.question_type === "yes_no" ? <div className="grid gap-2">{(question.question_type === "yes_no" ? ["Ya", "Tidak"] : question.options || []).map((option) => <label key={option} className={`flex min-h-12 cursor-pointer items-center gap-3 border px-4 text-sm ${answers[question.id] === option ? "border-blue-900 bg-blue-50 font-semibold text-blue-950" : "border-slate-200 hover:border-blue-300"}`}><input type="radio" name={question.id} value={option} checked={answers[question.id] === option} onChange={() => setAnswers((current) => ({ ...current, [question.id]: option }))} />{option}</label>)}</div>
              : question.question_type === "multiple_choice" ? <div className="grid gap-2">{(question.options || []).map((option) => { const selected = Array.isArray(answers[question.id]) ? answers[question.id] as string[] : []; return <label key={option} className={`flex min-h-12 cursor-pointer items-center gap-3 border px-4 text-sm ${selected.includes(option) ? "border-blue-900 bg-blue-50 font-semibold text-blue-950" : "border-slate-200 hover:border-blue-300"}`}><input type="checkbox" checked={selected.includes(option)} onChange={() => setAnswers((current) => ({ ...current, [question.id]: selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option] }))} />{option}</label>; })}</div>
              : question.question_type === "scale" ? <div className="flex flex-wrap gap-2">{Array.from({ length: (question.scale_max || 5) - (question.scale_min || 1) + 1 }, (_, offset) => (question.scale_min || 1) + offset).map((value) => <button type="button" key={value} onClick={() => setAnswers((current) => ({ ...current, [question.id]: value }))} className={`h-12 min-w-12 border text-sm font-bold ${answers[question.id] === value ? "border-blue-900 bg-blue-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"}`}>{value}</button>)}</div>
              : question.question_type === "long_text" ? <textarea rows={5} value={String(answers[question.id] || "")} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} className="w-full border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" />
              : <input type={question.question_type === "number" ? "number" : "text"} value={String(answers[question.id] || "")} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: question.question_type === "number" ? Number(event.target.value) : event.target.value }))} className="min-h-12 w-full border border-slate-300 px-4 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" />}
            </div>
          </fieldset>
        ))}

        <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center"><Link href="/client/program" className="inline-flex min-h-11 items-center justify-center px-4 text-sm font-bold text-slate-600">Simpan nanti</Link><button type="button" disabled={!canSubmit || saving} onClick={() => void submit()} className="inline-flex min-h-12 items-center justify-center gap-2 bg-blue-900 px-6 text-sm font-bold text-white hover:bg-blue-950 disabled:cursor-not-allowed disabled:bg-slate-300">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {!canSubmit ? "Sudah dikirim" : "Kirim jawaban"}</button></div>
      </div>
    </main>
  );
}

export default function ClientProgramTestPage() {
  return <ClientAuthGate><Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-5 w-5 animate-spin text-blue-900" /></main>}><TestContent /></Suspense></ClientAuthGate>;
}
