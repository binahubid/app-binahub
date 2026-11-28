"use client";

import { useEffect, useId, useState } from "react";
import { ArrowUpRight, Check, Link2 } from "lucide-react";
import { applyReferral, getReferral, referralBookingHref, type ReferralContext } from "@/lib/referral-client";

const copy = {
  id: {
    optional: "Punya kode referral?",
    code: "Kode referral",
    apply: "Gunakan kode",
    checking: "Memeriksa kode…",
    recorded: "Referral tercatat",
    share: "Izinkan Associate yang merujuk Anda melihat nama dan email untuk menghubungi Anda (opsional).",
    invalid: "Kode ini belum bisa digunakan. Periksa kembali atau lanjutkan pengisian.",
    unavailable: "Kode belum dapat diperiksa. Coba lagi atau lanjutkan pengisian.",
    meeting: "Jadwalkan konsultasi",
  },
  en: {
    optional: "Have a referral code?",
    code: "Referral code",
    apply: "Apply code",
    checking: "Checking code…",
    recorded: "Referral recorded",
    share: "Allow the associate who referred you to see your name and email and contact you (optional).",
    invalid: "This code is unavailable. Check the code or continue with the form.",
    unavailable: "We could not check the code. Try again or continue with the form.",
    meeting: "Schedule a consultation",
  },
};

export function ReferralField({ locale = "id", consentCode, onConsent, disabled, booking }: {
  locale?: "id" | "en";
  consentCode?: string;
  onConsent: (code: string | undefined) => void;
  disabled?: boolean;
  booking?: boolean;
}) {
  const t = copy[locale];
  const id = useId();
  const [context, setContext] = useState<ReferralContext | null>(null);
  const [bookingAvailable, setBookingAvailable] = useState(false);
  const [code, setCode] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"invalid" | "unavailable">();

  useEffect(() => {
    let alive = true;
    void getReferral().then(({ data }) => {
      if (!alive || !data) return;
      setContext(data.context);
      setBookingAvailable(data.bookingAvailable);
    });
    return () => { alive = false; };
  }, []);

  async function apply() {
    if (busy || disabled) return;
    setBusy(true);
    setError(undefined);
    const result = await applyReferral(code, "manual");
    if (result.data) {
      setContext(result.data.context);
      setBookingAvailable(result.data.bookingAvailable);
    } else {
      setError(result.error);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-700 sm:p-4">
      {context ? <>
        <div className="flex flex-wrap items-center gap-2 font-semibold text-[#0B2C6B]" role="status">
          <Check size={16} aria-hidden="true" /> {t.recorded}
          <span className="rounded bg-white px-2 py-0.5 font-mono text-xs">{context.code}</span>
        </div>
        <label className="flex items-start gap-2.5 leading-relaxed">
          <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#0B2C6B]" disabled={disabled}
            checked={consentCode === context.code} onChange={(e) => onConsent(e.target.checked ? context.code : undefined)} />
          <span>{t.share}</span>
        </label>
      </> : <>
        <button type="button" aria-expanded={open} aria-controls={id} disabled={disabled}
          className="inline-flex min-h-9 items-center gap-2 font-semibold text-[#0B2C6B] hover:underline"
          onClick={() => setOpen((value) => !value)}><Link2 size={16} aria-hidden="true" />{t.optional}</button>
        {open && <div id={id} className="space-y-2">
          <label htmlFor={id + "-code"} className="sr-only">{t.code}</label>
          <div className="flex flex-wrap gap-2">
            <input id={id + "-code"} type="text" maxLength={13} autoComplete="off" spellCheck={false}
              placeholder="BH-XXXXXXXXXX" value={code} disabled={disabled || busy} aria-invalid={error === "invalid"}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(undefined); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void apply(); } }}
              className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900" />
            <button type="button" onClick={() => { void apply(); }} disabled={!code.trim() || busy || disabled}
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 font-semibold text-[#0B2C6B] disabled:opacity-50">
              {busy ? t.checking : t.apply}
            </button>
          </div>
          {error && <p role="alert" className="text-red-800">{t[error]}</p>}
        </div>}
      </>}
      {booking && bookingAvailable && !disabled && <a href={referralBookingHref()}
        className="inline-flex min-h-9 items-center gap-1.5 font-semibold text-[#0B2C6B] hover:underline">
        {t.meeting}<ArrowUpRight size={15} aria-hidden="true" />
      </a>}
    </div>
  );
}
