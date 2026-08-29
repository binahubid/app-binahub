import { motion } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";
import { FormData } from "../_types";
import { useLocale } from "@/i18n/use-locale";

interface OpenQuestionsStepProps {
  formData: FormData;
  onChange: (data: Partial<FormData>) => void;
  onNext: (e: React.FormEvent) => void;
  onPrev: () => void;
  isSubmitting: boolean;
}

const COPY = {
  id: {
    challenge: "Apa tantangan terbesar tim Anda saat ini?",
    challengePlaceholder: "Tuliskan tantangan utama...",
    target: "Target utama (3-6 bulan)?",
    targetPlaceholder: "Tuliskan target strategis...",
    timeline: "Kapan inisiatif ini diharapkan mulai?",
    budget: "Status anggaran saat ini",
    sponsor: "Dukungan pengambil keputusan",
    nextStep: "Langkah berikutnya yang paling relevan",
    consequence: "Apa dampaknya jika kebutuhan ini tidak ditangani?",
    consequencePlaceholder: "Opsional, tuliskan dampak bisnis atau risiko yang paling terasa...",
    back: "Kembali",
    processing: "Memproses Data...",
    submit: "Lanjut ke Kontak",
  },
  en: {
    challenge: "What is your team's biggest challenge right now?",
    challengePlaceholder: "Write the main challenge...",
    target: "Main target (3-6 months)?",
    targetPlaceholder: "Write the strategic target...",
    timeline: "When is this initiative expected to start?",
    budget: "Current budget status",
    sponsor: "Decision-maker support",
    nextStep: "Most relevant next step",
    consequence: "What happens if this need is not addressed?",
    consequencePlaceholder: "Optional, describe the main business impact or risk...",
    back: "Back",
    processing: "Processing Data...",
    submit: "Continue to Contact",
  },
};

export function OpenQuestionsStep({
  formData,
  onChange,
  onNext,
  onPrev,
  isSubmitting,
}: OpenQuestionsStepProps) {
  const locale = useLocale();
  const copy = COPY[locale];
  const textareaClass =
    "w-full resize-none rounded-[12px] border border-black/10 bg-black/[0.02] px-5 py-4 text-base font-medium text-[#0B2C6B] placeholder:text-black/10 transition-all focus:border-[#0B2C6B] focus:bg-white focus:outline-none";
  const selectClass = "h-12 w-full rounded-[12px] border border-black/10 bg-white px-4 text-sm font-medium text-[#0B2C6B] outline-none focus:border-[#0B2C6B]";
  const choices = locale === "en" ? {
    timeline: [["unknown", "Not determined"], ["0_3", "Within 3 months"], ["3_6", "3-6 months"], ["6_12", "6-12 months"], ["12_plus", "More than 12 months"]],
    budget: [["unknown", "Not discussed"], ["discussion", "Under discussion"], ["range_known", "Budget range is known"], ["allocated", "Budget is allocated"]],
    sponsor: [["unknown", "Not confirmed"], ["champion", "Internal champion identified"], ["sponsor_confirmed", "Executive sponsor confirmed"], ["decision_maker", "I am the decision maker"]],
    nextStep: [["explore", "Explore the result first"], ["result_review", "Review the assessment result"], ["consultation", "Schedule a consultation"], ["proposal", "Discuss an indicative proposal"]],
  } : {
    timeline: [["unknown", "Belum ditentukan"], ["0_3", "Dalam 3 bulan"], ["3_6", "3-6 bulan"], ["6_12", "6-12 bulan"], ["12_plus", "Lebih dari 12 bulan"]],
    budget: [["unknown", "Belum dibahas"], ["discussion", "Sedang dibahas"], ["range_known", "Kisaran anggaran sudah diketahui"], ["allocated", "Anggaran sudah tersedia"]],
    sponsor: [["unknown", "Belum terkonfirmasi"], ["champion", "Sudah ada champion internal"], ["sponsor_confirmed", "Sponsor eksekutif sudah terkonfirmasi"], ["decision_maker", "Saya pengambil keputusan"]],
    nextStep: [["explore", "Pelajari hasil terlebih dahulu"], ["result_review", "Review hasil assessment"], ["consultation", "Jadwalkan konsultasi"], ["proposal", "Bahas proposal indikatif"]],
  };

  return (
    <motion.div
      key="open-questions"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full max-w-2xl px-4 py-12"
    >
      <form
        onSubmit={onNext}
        className="space-y-8 rounded-[16px] border border-black/[0.04] bg-white p-8 text-left shadow-[0_18px_54px_-44px_rgba(11,44,107,0.34)] md:p-12"
      >
        <div className="space-y-3">
          <label className="block text-[10px] font-medium text-[#0B2C6B]/60 uppercase tracking-widest px-1">
            {copy.challenge}
          </label>
          <textarea
            rows={4}
            value={formData.challenge}
            onChange={(e) => onChange({ challenge: e.target.value })}
            className={textareaClass}
            placeholder={copy.challengePlaceholder}
          />
        </div>

        <div className="space-y-3">
          <label className="block text-[10px] font-medium text-[#0B2C6B]/60 uppercase tracking-widest px-1">
            {copy.target}
          </label>
          <textarea
            rows={4}
            value={formData.target}
            onChange={(e) => onChange({ target: e.target.value })}
            className={textareaClass}
            placeholder={copy.targetPlaceholder}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {([
            ["timeline", copy.timeline, "timeline"],
            ["budgetStatus", copy.budget, "budget"],
            ["sponsorStatus", copy.sponsor, "sponsor"],
            ["nextStepIntent", copy.nextStep, "nextStep"],
          ] as const).map(([field, label, optionKey]) => (
            <label key={field} className="block space-y-2">
              <span className="block px-1 text-[10px] font-medium uppercase tracking-widest text-[#0B2C6B]/60">{label}</span>
              <select value={formData[field]} onChange={(event) => onChange({ [field]: event.target.value })} className={selectClass}>
                {choices[optionKey].map(([value, optionLabel]) => <option key={value} value={value}>{optionLabel}</option>)}
              </select>
            </label>
          ))}
        </div>

        <div className="space-y-3">
          <label className="block px-1 text-[10px] font-medium uppercase tracking-widest text-[#0B2C6B]/60">{copy.consequence}</label>
          <textarea rows={3} value={formData.businessConsequence} onChange={(e) => onChange({ businessConsequence: e.target.value })} className={textareaClass} placeholder={copy.consequencePlaceholder} />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-black/[0.05]">
          <button
            type="button"
            onClick={onPrev}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-[12px] border border-[#0B2C6B]/10 bg-white text-[11px] font-bold uppercase tracking-widest text-[#0B2C6B]/60 transition-all hover:bg-black/[0.03] hover:text-[#0B2C6B]"
          >
            <ArrowLeft size={16} /> {copy.back}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="group flex h-14 flex-[2] items-center justify-center gap-3 rounded-[12px] bg-[#0B2C6B] text-[11px] font-bold uppercase tracking-widest text-white shadow-lg shadow-[#0B2C6B]/10 transition-all hover:bg-black disabled:opacity-70"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-3">
                {copy.processing}{" "}
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </span>
            ) : (
              <span className="flex items-center gap-3">
                {copy.submit} <Send size={16} />
              </span>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
