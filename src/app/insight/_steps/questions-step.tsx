import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { DIMENSIONS, QUESTIONS } from "../questions";
import { LIKERT_OPTIONS } from "../_types";
import { useLocale } from "@/i18n/use-locale";
import { publicSiteTranslations } from "@/i18n/site-translations";

const DIMENSION_GUIDANCE: Record<string, string> = {
  Insights: "Bagaimana data, indikator, dan akar masalah digunakan untuk mengambil keputusan.",
  Lab: "Kecocokan kompetensi, kualitas komunikasi, dan kemampuan pemecahan masalah tim.",
  Coach: "Kualitas arahan, umpan balik, tanggung jawab, dan pola pikir berkembang.",
  Play: "Energi kerja, keterlibatan, rasa dihargai, dan koneksi antaranggota tim.",
  Academy: "Struktur pembelajaran, kurikulum, dan budaya belajar berkelanjutan.",
  Works: "Kejelasan KPI, dokumentasi proses, peran, dan ritme monitoring pekerjaan.",
  Impact: "Indikator keberhasilan, bukti dampak, dan visibilitas ROI program pengembangan.",
};

const DIMENSION_GUIDANCE_EN: Record<string, string> = {
  Insights: "How data, indicators, and root causes support management decisions.",
  Lab: "Competency fit, communication quality, and the team's problem-solving capability.",
  Coach: "Guidance quality, feedback, ownership, and a sustainable growth mindset.",
  Play: "Work energy, engagement, appreciation, and connection across the team.",
  Academy: "Learning structure, curriculum, and a culture of continuous development.",
  Works: "KPI clarity, process documentation, roles, and work monitoring rhythm.",
  Impact: "Success indicators, impact evidence, and ROI visibility for development programs.",
};

const LIKERT_LABELS_EN: Record<number, string> = {
  1: "Strongly Disagree",
  2: "Disagree",
  3: "Unsure",
  4: "Agree",
  5: "Strongly Agree",
};

interface QuestionsStepProps {
  step: number;
  answers: Record<number, number>;
  onAnswer: (qId: number, val: number) => void;
}

export function QuestionsStep({ step, answers, onAnswer }: QuestionsStepProps) {
  const locale = useLocale();
  const isEnglish = locale === "en";
  const pageIndex = step - 2;
  const pageQuestions = QUESTIONS.slice(pageIndex * 7, pageIndex * 7 + 7);
  const dimension = DIMENSIONS[pageIndex];
  const firstUnanswered = pageQuestions.findIndex((question) => !answers[question.id]);
  const [activeIndex, setActiveIndex] = useState(Math.max(firstUnanswered, 0));
  const activeQuestion = pageQuestions[activeIndex];
  const answeredCount = pageQuestions.filter((question) => answers[question.id]).length;
  const completion = Math.round((answeredCount / pageQuestions.length) * 100);

  const selectAnswer = (value: number) => {
    onAnswer(activeQuestion.id, value);
    if (activeIndex < pageQuestions.length - 1) {
      window.setTimeout(() => setActiveIndex((current) => Math.min(current + 1, pageQuestions.length - 1)), 180);
    }
  };

  return (
    <motion.div
      key={`page-${step}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full max-w-6xl px-4 py-6 md:px-8 md:py-10"
    >
      <div className="overflow-hidden rounded-[24px] border border-[#0B2C6B]/8 bg-white shadow-[0_30px_90px_-62px_rgba(11,44,107,0.5)]">
        <div className="grid lg:grid-cols-[310px_1fr]">
          <aside className="relative overflow-hidden bg-[#0B2C6B] p-7 text-white md:p-9 lg:min-h-[560px]">
            <div className="pointer-events-none absolute -right-20 -top-16 h-64 w-64 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-[#D9A441]/10 blur-3xl" />

            <div className="relative flex h-full flex-col">
              <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#D9A441]">
                {isEnglish ? `Dimension ${pageIndex + 1} of 7` : `Dimensi ${pageIndex + 1} dari 7`}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{dimension}</h2>
              <p className="mt-5 text-sm font-light leading-6 text-white/64">
                {isEnglish ? DIMENSION_GUIDANCE_EN[dimension] : DIMENSION_GUIDANCE[dimension]}
              </p>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.055] p-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/45">
                      {isEnglish ? "Dimension progress" : "Progres dimensi"}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">{answeredCount}<span className="text-sm font-normal text-white/38"> / 7</span></p>
                  </div>
                  <p className="text-sm font-semibold text-[#D9A441]">{completion}%</p>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-[#D9A441]"
                    animate={{ width: `${completion}%` }}
                    transition={{ duration: 0.35 }}
                  />
                </div>
              </div>

              <p className="mt-auto hidden pt-8 text-xs leading-5 text-white/44 lg:block">
                {isEnglish
                  ? "There are no right or wrong answers. Choose what best reflects everyday practice."
                  : "Tidak ada jawaban benar atau salah. Pilih yang paling mencerminkan praktik sehari-hari."}
              </p>
            </div>
          </aside>

          <section className="flex min-h-[540px] flex-col p-5 md:p-9 lg:p-11">
            <div className="flex flex-col items-start gap-4 border-b border-[#0B2C6B]/7 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D9A441]">
                  {isEnglish ? "Quick response" : "Respons cepat"}
                </p>
                <p className="mt-1 text-xs text-[#0B2C6B]/45">
                  {isEnglish ? "Select a number to continue automatically" : "Pilih angka untuk lanjut otomatis"}
                </p>
              </div>
              <div className="grid w-full grid-cols-7 gap-1.5 sm:flex sm:w-auto" aria-label={isEnglish ? "Question navigator" : "Navigasi pertanyaan"}>
                {pageQuestions.map((question, index) => {
                  const isActive = index === activeIndex;
                  const isAnswered = Boolean(answers[question.id]);
                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      aria-label={`${isEnglish ? "Question" : "Pertanyaan"} ${index + 1}${isAnswered ? `, ${isEnglish ? "answered" : "terjawab"}` : ""}`}
                      aria-current={isActive ? "step" : undefined}
                      className={`flex h-9 w-full min-w-0 items-center justify-center rounded-full text-[10px] font-bold transition-all sm:h-8 sm:w-8 ${
                        isActive
                          ? "bg-[#0B2C6B] text-white shadow-md"
                          : isAnswered
                            ? "bg-[#D9A441]/18 text-[#0B2C6B]"
                            : "bg-[#F2F5F8] text-[#0B2C6B]/35 hover:bg-[#0B2C6B]/8"
                      }`}
                    >
                      {isAnswered && !isActive ? <Check size={12} strokeWidth={2.5} /> : index + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-1 items-center py-7 md:py-9">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeQuestion.id}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.22 }}
                  className="w-full"
                >
                  <div className="mb-5 grid grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-3 sm:flex">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D9A441]/25 bg-[#D9A441]/8 text-xs font-bold text-[#0B2C6B]">
                      {activeIndex + 1}
                    </span>
                    <span className="h-px flex-1 bg-[#0B2C6B]/7" />
                    <span className="col-span-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[#0B2C6B]/48 sm:col-span-1 sm:text-[10px] sm:tracking-[0.18em]">
                      {isEnglish ? "of 7 statements" : "dari 7 pernyataan"}
                    </span>
                  </div>

                  <h3 className="min-h-[88px] break-words text-xl font-medium leading-relaxed text-[#0B2C6B] md:text-[27px] md:leading-[1.45]">
                    {isEnglish ? publicSiteTranslations[activeQuestion.text] || activeQuestion.text : activeQuestion.text}
                  </h3>

                  <div className="mt-7 grid grid-cols-5 gap-1.5 sm:gap-2 md:gap-3">
                    {LIKERT_OPTIONS.map((option) => {
                      const isSelected = answers[activeQuestion.id] === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => selectAnswer(option.value)}
                          aria-pressed={isSelected}
                          className={`group relative flex min-h-[92px] min-w-0 flex-col items-center justify-center rounded-xl border px-1 py-3 text-center transition-all duration-200 sm:rounded-2xl md:min-h-[118px] md:px-3 ${
                            isSelected
                              ? "-translate-y-1 border-[#0B2C6B] bg-[#0B2C6B] text-white shadow-[0_18px_42px_-24px_rgba(11,44,107,0.7)]"
                              : "border-[#0B2C6B]/7 bg-[#F7F9FB] text-[#0B2C6B] hover:-translate-y-1 hover:border-[#D9A441]/45 hover:bg-[#D9A441]/[0.055]"
                          }`}
                        >
                          <span className={`text-2xl font-semibold md:text-3xl ${isSelected ? "text-[#D9A441]" : "text-[#0B2C6B]"}`}>
                            {option.value}
                          </span>
                          <span className={`mt-2 text-[7px] font-bold uppercase leading-tight tracking-[0.08em] md:text-[9px] ${isSelected ? "text-white/72" : "text-[#0B2C6B]/45"}`}>
                            {isEnglish ? LIKERT_LABELS_EN[option.value] : option.label}
                          </span>
                          {isSelected && <Check className="absolute right-2.5 top-2.5 text-[#D9A441]" size={14} strokeWidth={2.5} />}
                        </button>
                      );
                    })}
                  </div>

                  {answers[activeQuestion.id] && activeIndex < pageQuestions.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setActiveIndex((current) => Math.min(current + 1, pageQuestions.length - 1))}
                      className="mt-5 ml-auto flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#0B2C6B]/48 transition-colors hover:text-[#0B2C6B]"
                    >
                      {isEnglish ? "Next statement" : "Pernyataan berikutnya"}
                      <ChevronRight size={14} />
                    </button>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <p className="text-center text-[11px] leading-5 text-[#0B2C6B]/40 lg:hidden">
              {isEnglish
                ? "There are no right or wrong answers. Choose what best reflects everyday practice."
                : "Tidak ada jawaban benar atau salah. Pilih yang paling mencerminkan praktik sehari-hari."}
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
