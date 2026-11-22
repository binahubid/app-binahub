"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Download,
  FileText,
  Play,
  RefreshCw,
} from "lucide-react";
import {
  consultantDate,
  downloadConsultantFile,
  stageLabels,
  type Booking,
  type ConsultantList,
  type ConsultantMember,
  type Task,
} from "@/lib/consultant-client";
import { consultantMaterials, type ConsultantMaterial } from "@/lib/consultant-materials";
import { ConsultantPending, consultantDirectoryUrl, useConsultantData } from "./consultant-data";
import { consultantTranslator } from "@/lib/consultant-locale";
import s from "./consultant.module.css";
import tutorial from "./consultant-tutorials.module.css";
const translateIndonesian = consultantTranslator("id");
import { useConsultantLocale } from "@/components/consultant-language";

export function ConsultantHeading({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={s.heading}>
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children && <div className={s.actions}>{children}</div>}
    </header>
  );
}

export function OwnerFilter({
  value,
  onChange,
  members,
}: {
  value: string;
  onChange: (v: string) => void;
  members: ConsultantMember[];
}) {
  const { t } = useConsultantLocale();
  return (
    <label className={s.field}>
      {t("Penanggung jawab")}
      <select aria-label={t("Penanggung jawab")} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="all">{t("Semua")}</option>
        <option value="mine">{t("Tanggung jawab saya")}</option>
        <option value="unassigned">{t("Belum ditugaskan")}</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
            {m.active ? "" : t(" · nonaktif")}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Pager({
  page,
  total,
  pageSize,
  onChange,
  translate: t = translateIndonesian,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (v: number) => void;
  translate?: typeof translateIndonesian;
}) {
  if (total <= pageSize && page === 0) return null;
  return (
    <nav aria-label={t("Halaman hasil")} className={s.pager}>
      <button
        className={s.button}
        disabled={!page}
        onClick={() => onChange(page - 1)}
      >{t("Sebelumnya")}</button>
      <span>
        {total
          ? t("{0}–{1} dari {2}", [Math.min(page * pageSize + 1, total), Math.min((page + 1) * pageSize, total), total])
          : t("0 hasil")}
      </span>
      <button
        className={s.button}
        disabled={(page + 1) * pageSize >= total}
        onClick={() => onChange(page + 1)}
      >{t("Berikutnya")}</button>
    </nav>
  );
}

export function AgendaRows({ records }: { records: (Task | Booking)[] }) {
  const { t } = useConsultantLocale();
  if (!records.length)
    return <p className={s.empty}>{t("Belum ada agenda pada pilihan ini.")}</p>;
  return (
    <ul>
      {records.map((r) => {
        const lead = "due_at" in r ? r.lead_id : r.lead_id || r.leadId;
        const date = "due_at" in r ? r.due_at : r.start_time || r.startTime;
        return (
          <li key={r.id} className={s.row}>
            <div>
              <h3>
                {lead ? (
                  <Link href={`/konsultan/clients/${lead}`}>
                    {r.title || t("Konsultasi klien")}
                  </Link>
                ) : (
                  r.title
                )}
              </h3>
              <p className={s.muted}>
                {[r.company, r.assigneeName || "Belum ditugaskan"]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <time className={s.muted} dateTime={date}>
              {consultantDate(date)}
            </time>
          </li>
        );
      })}
    </ul>
  );
}

export function ConsultantOverview({ clients = false }: { clients?: boolean }) {
  const { t } = useConsultantLocale();
  const [owner, setOwner] = useState("all"),
    [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(0),
    [view, setView] = useState("all");
  const directoryUrl = owner === "all" && !query && page === 0 && view === "all"
    ? consultantDirectoryUrl
    : consultantDirectoryUrl + "?" + new URLSearchParams({ owner, search: query, page: String(page), view });
  const { data, error, reload } = useConsultantData<ConsultantList>(directoryUrl);
  return (
    <>
      <ConsultantHeading
        title={clients ? t("Klien & peluang") : t("Beranda konsultan")}
        description={
          clients
            ? t("Lihat tahap, jadwal, dan penanggung jawab setiap peluang konsultasi.")
            : t("Pantau pekerjaan dan agenda konsultasi seluruh tim.")
        }
      >
        <button type="button" className={s.button} onClick={reload}>
          <RefreshCw size={16} aria-hidden="true" />{t("Perbarui")}</button>
      </ConsultantHeading>
      <form
        className={s.filters}
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
          setQuery(search);
        }}
      >
        {clients && (
          <label className={`${s.field} ${s.search}`}>{t("Cari klien")}<input
              type="search"
              maxLength={150}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Nama, perusahaan, atau email")}
            />
          </label>
        )}
        <OwnerFilter
          value={owner}
          members={data?.members || []}
          onChange={(v) => {
            setOwner(v);
            setPage(0);
          }}
        />
        {clients && (
          <>
            <label className={s.field}>{t("Tahap")}<select
                value={view}
                onChange={(e) => {
                  setView(e.target.value);
                  setPage(0);
                }}
              >
                <option value="all">{t("Semua tahap")}</option>
                <option value="active">{t("Peluang terbuka")}</option>
                <option value="won">{t("Disepakati")}</option>
                <option value="lost">{t("Tidak dilanjutkan")}</option>
                <option value="handoff">{t("Serah terima")}</option>
              </select>
            </label>
            <button className={s.primary}>{t("Cari")}</button>
          </>
        )}
      </form>
      {error && (
        <p role="alert" className={s.error}>
          {t(error)}
        </p>
      )}
      {!error && !data && <ConsultantPending message="Memuat pekerjaan tim…" />}
      {data && (
        <>
          {!clients && (
            <div className={s.stats}>
              {(
                [
                  ["Peluang terbuka", data.summary.active],
                  ["Tugas lewat tenggat", data.summary.overdue],
                  ["Draf proposal", data.summary.proposals],
                  ["Serah terima", data.summary.handoffs],
                ] as const
              ).map(([label, count]) => (
                <div className={s.stat} key={label}>
                  <strong>{count}</strong>
                  <span>{t(label)}</span>
                </div>
              ))}
            </div>
          )}
          <div className={clients ? undefined : s.grid}>
            <section className={s.panel}>
              <h2>{clients ? t("Daftar peluang") : t("Peluang tim")}</h2>
              {data.records.length ? (
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>{t("Klien")}</th>
                      <th>{t("Tahap")}</th>
                      <th>{t("Penanggung jawab")}</th>
                      <th>{t("Akses")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(clients ? data.records : data.records.slice(0, 6)).map(
                      (r) => (
                        <tr key={r.id}>
                          <td>
                            <Link
                              className={s.textlink}
                              href={`/konsultan/clients/${r.id}`}
                            >
                              <strong>{r.company || r.name}</strong>
                            </Link>
                            <small>
                              {r.name}
                              {r.nextAction ? ` · ${r.nextAction}` : ""}
                            </small>
                          </td>
                          <td>
                            <span className={s.mobileLabel}>{t("Tahap")}</span>
                            {t(stageLabels[r.stage] || r.stage)}
                          </td>
                          <td>
                            <span className={s.mobileLabel}>{t("Penanggung jawab")}</span>
                            {r.assigneeName}
                          </td>
                          <td>
                            <span
                              className={`${s.badge} ${r.canEdit ? "" : s.readonly}`}
                            >
                              {r.canEdit ? t("Dapat dikelola") : t("Hanya baca")}
                            </span>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              ) : (
                <p className={s.empty}>{t("Belum ada peluang yang cocok.")}</p>
              )}
              {clients ? (
                <Pager
                  translate={t}
                  page={page}
                  pageSize={data.pageSize}
                  total={data.total}
                  onChange={setPage}
                />
              ) : (
                <Link className={s.textlink} href="/konsultan/clients">{t("Lihat semua peluang")}{" "}
                  <ArrowRight size={14} className="inline" />
                </Link>
              )}
            </section>
            {!clients && (
              <div>
                <section className={s.panel}>
                  <h2>{t("Tugas terdekat")}</h2>
                  <AgendaRows records={data.tasks.slice(0, 4)} />
                  <Link className={s.textlink} href="/konsultan/tasks">{t("Buka tugas & jadwal")}</Link>
                </section>
                <section className={s.panel}>
                  <h2>{t("Jadwal konsultasi")}</h2>
                  <AgendaRows records={data.bookings.slice(0, 4)} />
                </section>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

export function ConsultantAgenda() {
  const { t } = useConsultantLocale();
  const [owner, setOwner] = useState("all"),
    [kind, setKind] = useState("tasks"),
    [page, setPage] = useState(0);
  const directory = useConsultantData<ConsultantList>(consultantDirectoryUrl);
  const { data, error, reload } = useConsultantData<{
    records: (Task | Booking)[];
    total: number;
    pageSize: number;
  }>(
    "/api/konsultan/agenda?" +
      new URLSearchParams({ owner, kind, page: String(page) }),
  );
  return (
    <>
      <ConsultantHeading
        title={t("Tugas & jadwal")}
        description={t("Lihat agenda seluruh tim. Buka peluang untuk mengelola tugas yang menjadi tanggung jawab Anda.")}
      >
        <button className={s.button} onClick={reload}>
          <RefreshCw size={16} aria-hidden="true" />{t("Perbarui")}</button>
      </ConsultantHeading>
      <div className={s.filters}>
        <OwnerFilter
          value={owner}
          members={directory.data?.members || []}
          onChange={(v) => {
            setOwner(v);
            setPage(0);
          }}
        />
        <label className={s.field}>
          {t("Tampilkan")}
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              setPage(0);
            }}
          >
            <option value="tasks">{t("Tugas terbuka")}</option>
            <option value="bookings">{t("Jadwal konsultasi")}</option>
          </select>
        </label>
      </div>
      <section className={s.panel}>
        <h2>
          <CalendarDays size={18} className="mr-2 inline" aria-hidden="true" />
          {kind === "tasks" ? t("Tugas terbuka") : t("Jadwal konsultasi")}
        </h2>
        {error ? (
          <p role="alert" className={s.error}>
            {t(error)}
          </p>
        ) : data ? (
          <>
            <AgendaRows records={data.records} />
            <Pager
              translate={t}
              page={page}
              total={data.total}
              pageSize={data.pageSize}
              onChange={setPage}
            />
          </>
        ) : (
          <ConsultantPending message="Memuat agenda…" />
        )}
      </section>
    </>
  );
}

export function ConsultantMaterials() {
  const { t } = useConsultantLocale();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState("");
  async function download(material: ConsultantMaterial) {
    setBusy(material.slug);
    setError("");
    try {
      await downloadConsultantFile(
        `/api/konsultan/materials/${material.slug}`,
        material.filename,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dokumen belum tersedia.");
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <ConsultantHeading
        title={t("Materi konsultan")}
        description={t("Video panduan dan dokumen untuk mempersiapkan konsultasi.")}
      />
      <section className={`${s.panel} ${tutorial.entry}`} aria-labelledby="tutorial-entry-title">
        <div>
          <h2 id="tutorial-entry-title">{t("Video tutorial")}</h2>
          <p className={s.muted}>{t("Kenali fitur portal dan ikuti langkah kerja konsultan.")}</p>
        </div>
        <Link className={s.primary} href="/konsultan/materials/tutorial">
          <Play size={16} aria-hidden="true" /> {t("Lihat video")}</Link>
      </section>
      {error && (
        <p role="alert" className={s.error}>
          {t(error)}
        </p>
      )}
      <section className={`${s.panel} ${s.materialDocuments}`} aria-labelledby="materials-documents-title">
        <h2 id="materials-documents-title">{t("Dokumen")}</h2>
        {consultantMaterials.map((m) => (
          <article className={s.materialRow} key={m.slug}>
            <div className={s.materialCopy}>
              <FileText size={20} aria-hidden="true" />
              <div>
                <h3>{m.title}</h3>
                <p className={s.muted}>{t(m.description)}</p>
              </div>
            </div>
            <div className={s.materialActions}>
              <Link className={s.primary} href={`/konsultan/materials/${m.slug}`}
                aria-label={t("Baca {0} di web", [m.title])}>
                <BookOpen size={16} aria-hidden="true" /> {t("Baca di web")}</Link>
              <button
                type="button"
                className={s.button}
                aria-label={t("Unduh PDF {0}", [m.title])}
                disabled={!!busy}
                onClick={() => void download(m)}
              >
                <Download size={16} aria-hidden="true" />
                {busy === m.slug ? t("Memuat…") : t("Unduh PDF")}
              </button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
