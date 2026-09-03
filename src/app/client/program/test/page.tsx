"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { ClientAuthGate } from "@/components/client-auth-gate";
import { ProgramQuestionnaireForm, type ProgramQuestionnaireQuestion } from "@/components/program-questionnaire-form";
import { supabase } from "@/lib/supabase";

type Questionnaire = {
  id: string;
  kind: "pre_test" | "post_test";
  title: string;
  description: string;
  instructions: string;
  passingScore: number | null;
  allowRetake: boolean;
  questions: ProgramQuestionnaireQuestion[];
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
  const [missingQuestionId, setMissingQuestionId] = useState("");

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
      setMissingQuestionId(missing.id);
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
      setMissingQuestionId("");
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

        <ProgramQuestionnaireForm
          questions={questionnaire.questions}
          answers={answers}
          missingQuestionId={missingQuestionId}
          onAnswer={(questionId, value) => {
            setAnswers((current) => ({ ...current, [questionId]: value }));
            if (missingQuestionId === questionId) setMissingQuestionId("");
          }}
        />

        <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center"><Link href="/client/program" className="inline-flex min-h-11 items-center justify-center px-4 text-sm font-bold text-slate-600">Simpan nanti</Link><button type="button" disabled={!canSubmit || saving} onClick={() => void submit()} className="inline-flex min-h-12 items-center justify-center gap-2 bg-blue-900 px-6 text-sm font-bold text-white hover:bg-blue-950 disabled:cursor-not-allowed disabled:bg-slate-300">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {!canSubmit ? "Sudah dikirim" : "Kirim jawaban"}</button></div>
      </div>
    </main>
  );
}

export default function ClientProgramTestPage() {
  return <ClientAuthGate><Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-5 w-5 animate-spin text-blue-900" /></main>}><TestContent /></Suspense></ClientAuthGate>;
}
