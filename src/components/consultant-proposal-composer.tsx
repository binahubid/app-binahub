"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useConsultantLocale } from "./consultant-language";
import { ConsultantPending } from "./consultant-data";
import { consultantMoney, type ConsultantDetail, type Program, type Proposal, type ProposalSuggestions } from "@/lib/consultant-client";
import s from "./consultant.module.css";

type Props = {
  programs: Program[];
  defaults: ConsultantDetail["proposalDefaults"];
  prior?: Proposal["snapshot"];
  autoStart: boolean;
  busy: boolean;
  suggest: (retry?: boolean) => Promise<ProposalSuggestions>;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function ConsultantProposalComposer({ programs, defaults, prior, autoStart, busy, suggest, onSubmit }: Props) {
  const { t } = useConsultantLocale();
  const [selected, setSelected] = useState(() => prior?.programs.map(program => program.code) ?? []);
  const [participants, setParticipants] = useState(prior?.participants ?? defaults?.participants ?? 0);
  const [matches, setMatches] = useState<ProposalSuggestions>();
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState(false);
  const started = useRef(false);
  const match = useCallback(async (retry = false) => {
    started.current = true;
    setPending(true);
    setFailure(false);
    try {
      const result = await suggest(retry);
      setMatches(result);
      if (result.status === "suggested" && result.programs.length) {
        setSelected(current => current.length ? current : [result.programs[0].code]);
      }
    } catch {
      setFailure(true);
    } finally {
      setPending(false);
    }
  }, [suggest]);
  useEffect(() => {
    if (!autoStart || prior || started.current) return;
    const scheduled = window.setTimeout(() => void match(), 0);
    return () => window.clearTimeout(scheduled);
  }, [autoStart, match, prior]);

  const reasons = new Map(matches?.programs.map(({ code, reason }) => [code, reason]));
  const selectedPrograms = programs.filter(program => selected.includes(program.code));
  const featured = programs.filter(program => reasons.has(program.code) || prior?.programs.some(p => p.code === program.code));
  const otherPrograms = programs.filter(program => !featured.includes(program));
  const option = (program: Program) => (
    <label key={program.code} className={s.programChoice}>
      <input type="checkbox" name="programs" value={program.code} checked={selected.includes(program.code)}
        onChange={e => {
          const checked = e.target.checked;
          setSelected(current => checked ? [...current, program.code] : current.filter(code => code !== program.code));
        }} />
      <span>
        <strong>{program.name}</strong>
        <small>{program.dailyRateIdr !== null
          ? t("{0} per hari · {1}", [consultantMoney(program.dailyRateIdr), program.capacity])
          : `${program.pricingModel} · ${program.capacity}`}</small>
        {reasons.get(program.code) && <small>{reasons.get(program.code)}</small>}
      </span>
    </label>
  );
  const matchStatus = failure || matches?.status === "unavailable" ? "Pencocokan belum tersedia. Coba lagi atau pilih program di katalog."
    : matches?.status === "none" ? "Belum ada kecocokan yang cukup kuat. Tinjau kebutuhan dan pilih program di katalog."
    : matches?.status === "review" ? "Opsi ini perlu ditinjau. Pilih program setelah memastikan kesesuaiannya."
    : matches?.status === "suggested" ? "Program teratas sudah dipilih. Tinjau pilihan dan ubah bila diperlukan."
    : prior ? "Isian memakai draf terakhir. Tinjau rincian sebelum menyimpan revisi." : "";

  return (
    <form className={s.form} onSubmit={onSubmit}>
      <fieldset>
        <legend>{t("Program yang diusulkan")}</legend>
        {pending ? <ConsultantPending message="Mencocokkan checklist dengan katalog…" /> : (
          <>
            {matchStatus && <p className={s.muted} role="status">{t(matchStatus)}</p>}
            {matches?.source === "initial" && featured.length > 0 && <p className={s.muted}>{t("Mengacu pada rekomendasi awal klien.")}</p>}
            {(!matches || failure || matches.status === "unavailable") && <button type="button" className={s.button} disabled={busy}
              onClick={() => void match(failure || !!matches)}>{t(failure || matches ? "Coba cocokkan lagi" : "Cocokkan dari checklist")}</button>}
          </>
        )}
        {selectedPrograms.length > 0 && <p className={s.muted}>{t("Dipilih: {0}", [selectedPrograms.map(program => program.name).join(", ")])}</p>}
        <div className={s.catalog}>{featured.map(option)}</div>
        {otherPrograms.length > 0 && <details className={s.details} open={!featured.length && !pending}>
          <summary>{t(featured.length ? "Pilih program lain" : "Pilih dari katalog")}</summary>
          <div className={s.catalog}>{otherPrograms.map(option)}</div>
        </details>}
      </fieldset>
      <div className={s.two}>
        <label className={s.field}>{t("Durasi setiap program (hari)")}
          <input name="days" type="number" min={0.5} max={365} step={0.5} defaultValue={prior?.days ?? defaults?.days} required />
        </label>
        <label className={s.field}>{t("Jumlah peserta")}
          <input name="participants" type="number" min={1} max={100000} defaultValue={prior?.participants ?? defaults?.participants}
            onChange={e => setParticipants(e.target.valueAsNumber)} required />
          {participants > 30 && selectedPrograms.some(program => program.dailyRateIdr !== null) &&
            <span className={s.muted}>{t("Estimasi program bertarif harian memakai {0} batch, masing-masing maksimal 30 peserta.", [Math.ceil(participants / 30)])}</span>}
        </label>
      </div>
      <div className={s.two}>
        <label className={s.field}>{t("Format")}
          <select name="venue" defaultValue={prior?.venue || defaults?.venue || ""} required>
            <option value="" disabled>{t("Pilih format")}</option>
            <option value="indoor">Indoor</option>
            <option value="outdoor">Outdoor</option>
            <option value="hybrid">{t("Kombinasi")}</option>
            <option value="online">Online</option>
          </select>
        </label>
        <label className={s.field}>{t("Lokasi")}
          <input name="location" maxLength={300} defaultValue={prior?.location ?? defaults?.location}
            placeholder={t("Kota atau tempat pelaksanaan")} />
        </label>
      </div>
      <label className={s.field}>{t("Ruang lingkup untuk klien")}
        <textarea name="scope" rows={3} maxLength={4000} defaultValue={prior?.scopeNote}
          placeholder={t("Opsional. Catat penyesuaian yang disepakati bersama klien.")} />
      </label>
      <label className={s.field}>{t("Langkah berikutnya untuk klien")}
        <textarea name="nextStep" rows={2} maxLength={500} defaultValue={prior?.nextStep}
          placeholder={t("Opsional. Contoh: Konfirmasi ruang lingkup sebelum memfinalkan jadwal.")} />
      </label>
      <button className={s.primary} disabled={busy || pending || selectedPrograms.length === 0}>{t("Buat draf proposal")}</button>
    </form>
  );
}
