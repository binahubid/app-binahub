"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, ChevronDown, FileText, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { useConsultantLocale } from "./consultant-language";
import { ConsultantRequestError, consultantMoney, type ConsultantDetail, type Program, type Proposal, type ProposalSuggestions } from "@/lib/consultant-client";
import s from "./consultant.module.css";
import layout from "./consultant-proposal-composer.module.css";

type Props = {
  programs: Program[];
  defaults: ConsultantDetail["proposalDefaults"];
  prior?: Proposal["snapshot"];
  autoStart: boolean;
  busy: boolean;
  suggest: (retry?: boolean) => Promise<ProposalSuggestions>;
  onOpenChecklist: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function ConsultantProposalComposer({ programs, defaults, prior, autoStart, busy, suggest, onOpenChecklist, onSubmit }: Props) {
  const { locale, t } = useConsultantLocale();
  const [selected, setSelected] = useState(() => prior?.programs.map(program => program.code) ?? []);
  const [participants, setParticipants] = useState(prior?.participants ?? defaults?.participants ?? 0);
  const [matches, setMatches] = useState<ProposalSuggestions>();
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<ConsultantRequestError>();
  const [catalogQuery, setCatalogQuery] = useState("");
  const [components, setComponents] = useState(() =>
    (prior?.additionalComponents ?? []).map((component, id) => ({ ...component, id })));
  const nextComponentId = useRef(components.length);
  const started = useRef(false);
  const manualSelection = useRef(false);
  const matchLock = useRef(false);

  const match = useCallback(async (retry = false) => {
    if (matchLock.current) return;
    matchLock.current = true;
    started.current = true;
    setPending(true);
    setFailure(undefined);
    try {
      const result = await suggest(retry);
      setMatches(result);
      if (result.status === "suggested" && result.programs.length && !manualSelection.current) {
        setSelected(current => current.length ? current : [result.programs[0].code]);
      }
    } catch (error) {
      setFailure(error instanceof ConsultantRequestError
        ? error
        : new ConsultantRequestError("Pencocokan belum tersedia. Coba lagi atau pilih program di katalog."));
    } finally {
      matchLock.current = false;
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
  const featured = [...new Set([...(reasons.keys()), ...(prior?.programs.map(p => p.code) ?? [])])]
    .flatMap(code => programs.filter(program => program.code === code));
  const otherPrograms = programs.filter(program => !featured.includes(program));
  const query = catalogQuery.trim().toLocaleLowerCase();
  const visibleOthers = otherPrograms.filter(program => `${program.name} ${program.code}`.toLocaleLowerCase().includes(query));
  const option = (program: Program) => {
    const checked = selected.includes(program.code);
    const rate = program.dailyRateIdr !== null
      ? t("{0} per hari · {1}", [consultantMoney(program.dailyRateIdr), program.capacity])
      : `${program.pricingModel} · ${program.capacity}`;
    const reason = reasons.get(program.code);
    return (
      <label key={program.code} className={layout.choice} data-selected={checked}>
        <input type="checkbox" checked={checked}
          onChange={e => {
            manualSelection.current = true;
            const next = e.target.checked;
            setSelected(current => next ? [...current, program.code] : current.filter(code => code !== program.code));
          }} />
        <span>
          <strong>{program.name}</strong>
          <small>{rate}</small>
          {reason && <small className={layout.reason}>{reason}</small>}
        </span>
      </label>
    );
  };

  const matchStatus = failure?.message
    ?? (matches?.status === "unavailable" ? "Pencocokan belum tersedia. Coba lagi atau pilih program di katalog."
    : matches?.status === "none" ? "Belum ada program yang cukup cocok. Tinjau kebutuhan atau pilih dari katalog."
    : matches?.source === "catalog" ? "Opsi dari katalog berdasarkan checklist. Tinjau kesesuaiannya sebelum memilih."
    : matches?.source === "initial" && matches.programs.length ? "Usulan dari rekomendasi awal klien."
    : matches?.status === "review" ? "Opsi ini perlu ditinjau. Pilih program setelah memastikan kesesuaiannya."
    : matches?.status === "suggested" ? "Program yang sesuai dengan kebutuhan klien tersedia untuk ditinjau."
    : prior ? "Pilihan dan rincian diambil dari draf terakhir." : "");
  const needsChecklist = ["SPIN_ANSWERS_INVALID", "SPIN_INVALID_REQUEST", "CONSULTANT_CHECKLIST_REQUIRED"]
    .includes(failure?.code ?? "");
  const showBatches = participants > 30 && selectedPrograms.some(program => program.dailyRateIdr !== null);
  const scopeId = "proposal-scope-hint";

  return (
    <form className={layout.form} onSubmit={onSubmit}>
      {selectedPrograms.map(program => <input key={program.code} type="hidden" name="programs" value={program.code} />)}
      <div className={layout.columns}>
        <section className={layout.section} aria-labelledby="proposal-program-title">
          <div className={layout.sectionHeader}>
            <h3 id="proposal-program-title">{t("Program yang diusulkan")}</h3>
            <button type="button" className={s.button} disabled={busy || pending} onClick={() => void match(started.current)}>
              <RefreshCw size={15} aria-hidden="true" className={pending ? layout.spin : undefined} />
              {t(pending ? "Mencocokkan…" : "Cocokkan program")}
            </button>
          </div>
          <div role="status" className={layout.matchStatus} data-state={failure || matches?.status === "unavailable" ? "attention" : undefined}>
            {t(pending ? "Mencocokkan checklist dengan katalog…" : matchStatus)}
          </div>
          {needsChecklist && <button type="button" className={s.button} onClick={onOpenChecklist}>{t("Buka checklist kebutuhan")}</button>}
          <fieldset className={layout.options}>
            <legend className="sr-only">{t("Pilih program untuk proposal")}</legend>
            {featured.map(option)}
            {otherPrograms.length > 0 && <details className={layout.catalog}>
              <summary>{t(featured.length ? "Pilih program lain" : "Pilih dari katalog")}<ChevronDown size={16} aria-hidden="true" /></summary>
              <label className={layout.search}>
                <Search size={16} aria-hidden="true" />
                <span className="sr-only">{t("Cari program")}</span>
                <input type="search" value={catalogQuery} placeholder={t("Cari program")}
                  onChange={e => setCatalogQuery(e.target.value)} />
              </label>
              <div className={layout.catalogResults}>
                {visibleOthers.map(option)}
                {!visibleOthers.length && <p className={s.muted} role="status">{t("Tidak ada program yang sesuai dengan pencarian.")}</p>}
              </div>
            </details>}
          </fieldset>
        </section>

        <section className={layout.section} aria-labelledby="proposal-delivery-title">
          <div className={layout.sectionHeader}>
            <h3 id="proposal-delivery-title">{t("Rencana pelaksanaan")}</h3>
          </div>
          {(prior || defaults?.days || defaults?.participants) && <p className={layout.fieldIntro}>
            {t(prior ? "Periksa kembali rincian draf sebelum menyimpan revisi." : "Rincian dari checklist bisa disesuaikan di sini.")}
          </p>}
          <div className={layout.fields}>
            <label className={s.field}>{t("Hari per program")}
              <input name="days" type="number" min={0.5} max={365} step={0.5} defaultValue={prior?.days ?? defaults?.days} required />
            </label>
            <label className={s.field}>{t("Jumlah peserta")}
              <input name="participants" type="number" min={1} max={100000} defaultValue={prior?.participants ?? defaults?.participants}
                onChange={e => setParticipants(e.target.valueAsNumber)} required aria-describedby={showBatches ? "proposal-batch-note" : undefined} />
            </label>
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
          {showBatches && <p id="proposal-batch-note" className={layout.batchNote}>
            {t("Estimasi program bertarif harian memakai {0} batch, masing-masing maksimal 30 peserta.", [Math.ceil(participants / 30)])}
          </p>}
        </section>
      </div>
      <div className={layout.section} aria-labelledby="proposal-components-title">
        <div className={layout.sectionHeader}>
          <h3 id="proposal-components-title">{t("Komponen tambahan")}</h3>
          <button type="button" className={s.button} disabled={busy || components.length >= 6} onClick={() => {
            const id = nextComponentId.current++;
            setComponents(current => [...current, { id, name: "", amountIdr: null }]);
          }}>
            <Plus size={15} aria-hidden="true" />{t("Tambah komponen")}
          </button>
        </div>
        <p className={layout.fieldIntro}>{t("Opsional. Masukkan biaya di luar tarif program, seperti akomodasi atau sewa tempat yang diminta klien. Kosongkan nominal jika masih perlu dikonfirmasi.")}</p>
        {components.map((component, index) => (
          <div key={component.id} className={layout.componentRow}>
            <label className={s.field}>{t("Nama komponen {0}", [index + 1])}
              <input name="additionalComponent" maxLength={140} required defaultValue={component.name}
                placeholder={t("Contoh: Sewa ruang pelatihan")} />
            </label>
            <label className={s.field}>{t("Total komponen {0} (Rp)", [index + 1])}
              <input name="additionalAmount" type="number" min={0} max={1_000_000_000_000} step={1}
                defaultValue={component.amountIdr ?? undefined} placeholder={t("Perlu konfirmasi")} />
            </label>
            <button type="button" className={s.button} aria-label={t("Hapus komponen {0}", [index + 1])}
              onClick={() => setComponents(current => current.filter(item => item.id !== component.id))}>
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      <details className={layout.notes} open={Boolean(prior?.scopeNote)}>
        <summary>
          <FileText size={18} aria-hidden="true" />
          <span>{t("Catatan untuk proposal")} <small>{t("Opsional")}</small></span>
          <ChevronDown size={17} aria-hidden="true" />
        </summary>
        <div className={layout.noteFields}>
          <div className={s.field}>
            <label htmlFor="proposal-scope">{t("Ruang lingkup untuk klien")}</label>
            <textarea id="proposal-scope" name="scope" rows={3} maxLength={4000} defaultValue={prior?.scopeNote}
              aria-describedby={scopeId}
              placeholder={t("Contoh: Simulasi koordinasi lintas divisi dan refleksi terbimbing. Setiap tim menyusun satu rencana tindak lanjut.")} />
            <span id={scopeId} className={s.muted}>{t("Tulis penyesuaian kegiatan dan hasil yang disepakati. Teks ini masuk ke PDF proposal.")}</span>
          </div>
          <label className={s.field}>{t("Langkah berikutnya untuk klien")}
            <textarea name="nextStep" rows={3} maxLength={500} defaultValue={prior?.nextStep}
              placeholder={t("Contoh: Konfirmasi ruang lingkup sebelum memfinalkan jadwal.")} />
          </label>
        </div>
      </details>
      <div className={layout.footer}>
        <div>
          <p className={layout.selection} role="status">{selectedPrograms.length
            ? new Intl.ListFormat(locale === "en" ? "en" : "id").format(selectedPrograms.map(program => program.name))
            : t("Pilih minimal satu program.")}</p>
          {selectedPrograms.length > 0 && <p className={layout.fieldIntro}>{t("Tinjau isi PDF setelah draf dibuat.")}</p>}
        </div>
        <button className={s.primary} disabled={busy || selectedPrograms.length === 0}>
          {t("Buat draf proposal")}<ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
