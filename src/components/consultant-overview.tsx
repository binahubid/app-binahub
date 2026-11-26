"use client";

import Link from "next/link";
import { useCallback, useContext, useEffect, useRef, useState, type ComponentProps } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  Download,
  FileText,
  ListTodo,
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
import { ConsultantDirectorySearch, ConsultantPending, ConsultantReads, agendaUrl, consultantDetailUrl, consultantDirectoryUrl, consultantMyDirectoryUrl, useConsultantClock, useConsultantData } from "./consultant-data";
import { agendaPath, appointmentEnded, appointmentTime, bookingLabel, clientListPath, isOpenOpportunity, meetingHref, readDirectoryView, readOwner, readPage, safeWorkReturn, workUrl } from "@/lib/consultant-workflow";
import { consultantTranslator } from "@/lib/consultant-locale";
import { useConsultantLocale } from "@/components/consultant-language";
import s from "./consultant.module.css";
import tutorial from "./consultant-tutorials.module.css";
const translateIndonesian = consultantTranslator("id");

function WorkLink({ leadId, warmOnMount, ...props }: ComponentProps<typeof Link> & { leadId?: string; warmOnMount?: boolean }) {
  const reads = useContext(ConsultantReads);
  const warm = useCallback(() => {
    if (leadId) void reads?.load(consultantDetailUrl(leadId)).catch(() => {});
  }, [leadId, reads]);
  useEffect(() => {
    if (!warmOnMount || !leadId) return;
    const timer = window.setTimeout(warm, 150);
    return () => window.clearTimeout(timer);
  }, [leadId, warm, warmOnMount]);
  return <Link {...props} onPointerEnter={warm} onPointerDown={warm} onFocus={warm} />;
}

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

export function AgendaRows({ records, returnTo, now, details = false }: {
  records: (Task | Booking)[];
  now: number;
  returnTo?: string;
  details?: boolean;
}) {
  const { t, locale } = useConsultantLocale();
  if (!records.length) return <p className={s.empty}>{t("Belum ada agenda pada pilihan ini.")}</p>;
  return (
    <ul className={s.agendaRows}>
      {records.map((record) => {
        const task = "due_at" in record;
        const lead = task ? record.lead_id : record.lead_id || record.leadId;
        const date = task ? record.due_at : appointmentTime(record);
        const label = task ? record.due_at && Date.parse(record.due_at) <= now
          ? "Lewat tenggat" : "Tugas terbuka" : bookingLabel(record.status);
        const title = record.title || t("Konsultasi klien");
        const href = lead && workUrl(lead, task ? { section: "followup", target: "tasks" }
          : { section: "summary", target: "schedule" }, returnTo);
        const ended = !task && appointmentEnded(record, now);
        const meeting = !task && !ended && details && meetingHref(record);
        return (
          <li key={record.id} className={s.row}>
            <div>
              <span className={label === "Lewat tenggat" || label === "Menunggu konfirmasi" ? s.attentionBadge : s.badge}>
                {t(label)}
              </span>
              <h3>{href && !details ? <WorkLink href={href} leadId={lead}>{title}</WorkLink> : title}</h3>
              {(!details || record.company) && (
                <p className={s.muted}>{[record.company, !details && (record.assigneeName || t("Belum ditugaskan"))].filter(Boolean).join(" · ")}</p>
              )}
            </div>
            <div className={s.agendaDate}>
              <time dateTime={date}>{t(consultantDate(date, locale))}</time>
              {meeting && <a className={s.button} href={meeting} target="_blank" rel="noreferrer">{t("Buka meeting")}</a>}
              {details && ended && !["cancelled", "completed", "no_show"].includes(record.status) && <p>{t("Waktu pertemuan sudah lewat.")}</p>}
              {details && !task && !ended && record.status === "requested" && <p>{t("Tunggu konfirmasi jadwal sebelum membuka meeting.")}</p>}
              {details && !task && !ended && ["confirmed", "rescheduled"].includes(record.status) && !meeting &&
                <p>{t("Tautan meeting belum tersedia. Periksa undangan kalender.")}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function ConsultantOverview() {
  const { t, locale } = useConsultantLocale();
  const personal = useConsultantData<ConsultantList>(consultantMyDirectoryUrl);
  const team = useConsultantData<ConsultantList>(consultantDirectoryUrl);
  const now = useConsultantClock();
  const own = personal.data;
  const task = own?.tasks.find((item) => item.status === "open");
  const upcoming = own?.bookings.find((item) => (item.leadId || item.lead_id) && ["confirmed", "rescheduled"].includes(item.status) &&
    Date.parse(item.endTime || item.end_time || "") >= now && Date.parse(appointmentTime(item) ?? "") <= now + 24 * 60 * 60 * 1000);
  const active = own?.records.find((record) => isOpenOpportunity(record));
  const meetingSoon = !!upcoming && Date.parse(appointmentTime(upcoming) ?? "") <= now + 15 * 60 * 1000;
  const urgentTask = own?.tasks.find((item) => item.status === "open" && Date.parse(item.due_at) <= now);
  const taskBeforeMeeting = task && (!upcoming || Date.parse(task.due_at) <= Date.parse(appointmentTime(upcoming) ?? ""));
  const priorityTask = meetingSoon ? undefined : urgentTask ?? (taskBeforeMeeting ? task : undefined);
  const dueSoon = !!priorityTask && Date.parse(priorityTask.due_at) <= now + 24 * 60 * 60 * 1000;
  const upcomingPriority = !!upcoming && !priorityTask;
  const priority = meetingSoon || !!(priorityTask && urgentTask) ? "urgent"
    : upcomingPriority || dueSoon ? "soon" : own && !priorityTask && !active ? "neutral" : "default";
  const reason = meetingSoon ? "Meeting segera dimulai" : priorityTask && urgentTask ? "Lewat tenggat"
    : dueSoon ? "Tenggat tugas dalam 24 jam" : upcomingPriority ? "Konsultasi dalam 24 jam" : "";
  const title = priorityTask?.title || upcoming?.title || active?.company || active?.name || t("Belum ada peluang aktif yang ditugaskan");
  const context = priorityTask ? priorityTask.company : upcoming ? t("Jadwal konsultasi") : active ? t(stageLabels[active.stage] || active.stage) : "";
  const date = priorityTask ? priorityTask.due_at : upcoming && appointmentTime(upcoming);
  const meetingLead = upcoming?.leadId || upcoming?.lead_id;
  const next = priorityTask ? { href: workUrl(priorityTask.lead_id, { section: "followup", target: "tasks" }, agendaPath), label: "Buka tugas" }
    : meetingLead ? { href: workUrl(meetingLead, meetingSoon ? { section: "summary", target: "schedule" } : { section: "meeting", target: "checklist" }, agendaPath + "?kind=bookings"), label: meetingSoon ? "Lihat jadwal meeting" : "Siapkan meeting" }
    : active ? { href: workUrl(active.id, undefined, clientListPath), label: "Lanjutkan peluang" }
    : { href: clientListPath + "?owner=all", label: "Lihat peluang tim" };

  return (
    <>
      <ConsultantHeading title={t("Beranda konsultan")} description={t("Mulai dari pekerjaan Anda dan pantau perkembangan tim.")}>
        <button type="button" className={s.button} onClick={() => { personal.reload(); team.reload(); }}>
          <RefreshCw size={16} aria-hidden="true" />{t("Perbarui")}
        </button>
      </ConsultantHeading>
      <div className={s.homeLead}>
        <section className={s.priorityPanel} data-priority={priority} aria-labelledby="consultant-priority-title">
          <p className={s.priorityLabel} id="consultant-priority-title"><ListTodo size={18} aria-hidden="true" />{t("Prioritas saya")}</p>
          {personal.error ? (
            <div role="alert"><p>{t(personal.error)}</p><button type="button" className={s.button} onClick={personal.reload}>{t("Coba lagi")}</button></div>
          ) : !own ? <ConsultantPending message="Memuat tugas dan jadwal Anda…" /> : (
            <>
              {reason && <span className={s.attentionBadge}><CircleAlert size={14} aria-hidden="true" />{t(reason)}</span>}
              <h2>{title}</h2>
              <p>{[context, date && consultantDate(date, locale)].filter(Boolean).join(" · ")
                || t("Peluang yang sudah ditugaskan akan muncul di sini.")}</p>
              <WorkLink className={s.priorityAction} href={next.href} leadId={priorityTask?.lead_id || meetingLead || active?.id} warmOnMount>
                {t(next.label)}<ArrowRight size={18} aria-hidden="true" />
              </WorkLink>
            </>
          )}
        </section>
        <section className={s.panel} data-home-agenda aria-labelledby="home-appointments-title">
          <div className={s.panelTitle}>
            <h2 id="home-appointments-title"><CalendarDays size={19} aria-hidden="true" />{t("Jadwal saya")}</h2>
            <Link className={s.sectionShortcut} href={agendaPath + "?kind=bookings"} aria-label={t("Lihat jadwal")} title={t("Lihat jadwal")}>
              <ChevronRight size={20} aria-hidden="true" />
            </Link>
          </div>
          {personal.error ? <p className={s.muted}>{t("Jadwal belum dapat dimuat.")}</p>
            : !own ? <ConsultantPending message="Memuat agenda…" />
            : own.bookings.length ? <AgendaRows records={own.bookings.slice(0, 2)} now={now} returnTo={agendaPath + "?kind=bookings"} />
            : <p className={s.compactEmpty}>{t("Belum ada jadwal konsultasi untuk Anda.")}</p>}
        </section>
      </div>
      <section className={s.teamOverview} aria-labelledby="team-overview-title">
        <div className={s.panelTitle}>
          <h2 id="team-overview-title">{t("Ringkasan tim")}</h2>
          <Link className={s.sectionShortcut} href={clientListPath + "?owner=all"} aria-label={t("Lihat semua peluang")} title={t("Lihat semua peluang")}>
            <ChevronRight size={20} aria-hidden="true" />
          </Link>
        </div>
        {team.error ? <p role="alert" className={s.error}>{t(team.error)} <button className={s.button} onClick={team.reload}>{t("Coba lagi")}</button></p>
          : !team.data ? <ConsultantPending message="Memuat pekerjaan tim…" /> : (
            <div className={s.stats}>
              <Link className={s.stat} href={clientListPath + "?owner=all&view=active"}><ChevronRight size={16} aria-hidden="true" /><strong>{team.data.summary.active}</strong><span>{t("Peluang terbuka")}</span></Link>
              <Link className={s.stat} href={agendaPath + "?owner=all#overdue"}><ChevronRight size={16} aria-hidden="true" /><strong>{team.data.summary.overdue}</strong><span>{t("Tugas lewat tenggat")}</span></Link>
              <div className={s.stat}><strong>{team.data.summary.proposals}</strong><span>{t("Draf proposal")}</span></div>
              <Link className={s.stat} href={clientListPath + "?owner=all&view=handoff"}><ChevronRight size={16} aria-hidden="true" /><strong>{team.data.summary.handoffs}</strong><span>{t("Serah terima")}</span></Link>
            </div>
          )}
      </section>
    </>
  );
}

export function ConsultantClients() {
  const { t } = useConsultantLocale();
  const params = useSearchParams();
  const owner = readOwner(params, "mine");
  const view = readDirectoryView(params);
  const page = readPage(params);
  const [query, setQuery] = useContext(ConsultantDirectorySearch);
  const searchInput = useRef<HTMLInputElement>(null);
  const filters = new URLSearchParams({ owner });
  if (query) filters.set("search", query);
  if (view !== "all") filters.set("view", view);
  if (page) filters.set("page", String(page));
  const url = owner === "all" && filters.size === 1 ? consultantDirectoryUrl : consultantDirectoryUrl + "?" + filters;
  const { data, error, reload } = useConsultantData<ConsultantList>(url);
  const membership = useConsultantData<ConsultantList>(consultantMyDirectoryUrl);
  const returnTo = safeWorkReturn(clientListPath + "?" + params.toString());

  function update(values: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    window.history.replaceState(null, "", next.size ? clientListPath + "?" + next : clientListPath);
  }

  function clearSearch() {
    setQuery("");
    if (searchInput.current) searchInput.current.value = "";
    update({ page: null });
  }

  return (
    <>
      <ConsultantHeading title={t("Klien & peluang")} description={t("Pilih klien untuk melihat tahap, penanggung jawab, dan langkah berikutnya.")}>
        <button type="button" className={s.button} onClick={reload}><RefreshCw size={16} aria-hidden="true" />{t("Perbarui")}</button>
      </ConsultantHeading>
      <div role="group" aria-label={t("Cakupan peluang")} className={s.switcher}>
        <button type="button" aria-pressed={owner === "mine"} onClick={() => update({ owner: null, page: null })}>{t("Tanggung jawab saya")}</button>
        <button type="button" aria-pressed={owner !== "mine"} onClick={() => update({ owner: "all", page: null })}>{t("Semua tim")}</button>
      </div>
      <form className={s.filters} onSubmit={(event) => {
        event.preventDefault();
        setQuery(searchInput.current?.value.trim() ?? "");
        update({ page: null });
      }}>
        <label className={s.field + " " + s.search}>{t("Cari klien")}
          <input ref={searchInput} type="search" maxLength={150} defaultValue={query} placeholder={t("Nama, perusahaan, atau email")} />
        </label>
        {owner !== "mine" && <OwnerFilter value={owner} members={data?.members || membership.data?.members || []} onChange={(value) => update({ owner: value === "mine" ? null : value, page: null })} />}
        <label className={s.field}>{t("Tahap")}
          <select value={view} onChange={(event) => update({ view: event.target.value === "all" ? null : event.target.value, page: null })}>
            <option value="all">{t("Semua tahap")}</option>
            <option value="active">{t("Peluang terbuka")}</option>
            <option value="won">{t("Disepakati")}</option>
            <option value="lost">{t("Tidak dilanjutkan")}</option>
            <option value="handoff">{t("Serah terima")}</option>
          </select>
        </label>
        <div className={s.actions}>
          <button className={s.button}>{t("Cari")}</button>
          {query && <button type="button" className={s.button} onClick={clearSearch}>{t("Hapus pencarian")}</button>}
        </div>
      </form>
      <section className={s.panel} aria-labelledby="client-directory-title">
        <h2 id="client-directory-title">{t("Daftar peluang")}</h2>
        {error ? <div className={s.error} role="alert"><p>{t(error)}</p><button className={s.button} onClick={reload}>{t("Coba lagi")}</button></div>
          : !data ? <ConsultantPending message="Memuat peluang…" layout="list" />
          : !data.records.length ? (
            <div className={s.empty}>
              <p>{t(owner === "mine" && !query && view === "all" ? "Belum ada peluang yang ditugaskan kepada Anda." : "Belum ada peluang yang cocok.")}</p>
              {query ? <button type="button" className={s.button} onClick={clearSearch}>{t("Hapus pencarian")}</button>
                : owner === "mine" ? <button type="button" className={s.button} onClick={() => update({ owner: "all", view: null, page: null })}>{t("Lihat peluang tim")}</button>
                : view !== "all" ? <button type="button" className={s.button} onClick={() => update({ view: null, page: null })}>{t("Lihat semua tahap")}</button>
                : owner !== "all" ? <button type="button" className={s.button} onClick={() => update({ owner: "all", page: null })}>{t("Lihat peluang tim")}</button>
                : null}
            </div>
          ) : (
            <table className={s.table + " " + s.clientTable} role="table" aria-labelledby="client-directory-title">
              <thead role="rowgroup"><tr role="row">
                <th scope="col" role="columnheader">{t("Klien")}</th>
                <th scope="col" role="columnheader">{t("Tahap")}</th>
                <th scope="col" role="columnheader">{t("Penanggung jawab")}</th>
                <th scope="col" role="columnheader">{t("Langkah berikutnya")}</th>
              </tr></thead>
              <tbody role="rowgroup">
                {data.records.map((record) => (
                  <tr key={record.id} role="row">
                    <td role="cell">
                      <WorkLink className={s.clientName} href={workUrl(record.id, undefined, returnTo)} leadId={record.id}>
                        <strong>{record.company || record.name}</strong><ChevronRight size={15} aria-hidden="true" />
                      </WorkLink>
                      <small>{record.company ? record.name : null}{record.company && record.origin ? " · " : null}{t(record.origin?.label || "")}</small>
                    </td>
                    <td role="cell"><span className={s.badge}>{t(stageLabels[record.stage] || record.stage)}</span></td>
                    <td role="cell"><span className={s.mobileLabel}>{t("Penanggung jawab")}</span>{t(record.assigneeName)}{!record.canEdit && record.assigneeId && <small>{t("Hanya baca")}</small>}</td>
                    <td role="cell"><span className={s.mobileLabel}>{t("Langkah berikutnya")}</span>{record.nextAction || <span className={s.muted}>{t("Belum dicatat")}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        {data && <Pager translate={t} page={page} pageSize={data.pageSize} total={data.total} onChange={(next) => update({ page: next ? String(next) : null })} />}
      </section>
    </>
  );
}

export function ConsultantAgenda() {
  const { t } = useConsultantLocale();
  const params = useSearchParams();
  const owner = readOwner(params, "mine");
  const kind = params.get("kind") === "bookings" ? "bookings" : "tasks";
  const page = readPage(params);
  const directory = useConsultantData<ConsultantList>(consultantMyDirectoryUrl);
  const { data, error, reload } = useConsultantData<{ records: (Task | Booking)[]; total: number; pageSize: number }>(
    agendaUrl(owner, kind, page),
  );
  const now = useConsultantClock();
  const rows = data?.records ?? [];
  const overdue = rows.filter((row) => "due_at" in row && Date.parse(row.due_at) <= now);
  const remaining = rows.filter((row) => !("due_at" in row) || Date.parse(row.due_at) > now);
  const returnTo = safeWorkReturn(agendaPath + "?" + params.toString());

  useEffect(() => {
    if (data && window.location.hash === "#overdue") {
      document.getElementById("overdue")?.scrollIntoView({ block: "start" });
    }
  }, [data]);

  function update(nextOwner = owner, nextKind = kind, nextPage = 0) {
    const next = new URLSearchParams();
    if (nextOwner !== "mine") next.set("owner", nextOwner);
    if (nextKind !== "tasks") next.set("kind", nextKind);
    if (nextPage) next.set("page", String(nextPage));
    window.history.replaceState(null, "", next.size ? agendaPath + "?" + next : agendaPath);
  }

  return (
    <>
      <ConsultantHeading title={t("Tugas & jadwal")} description={t("Periksa tenggat dan status pertemuan. Buka item untuk melanjutkan pekerjaan terkait.")}>
        <button type="button" className={s.button} onClick={reload}><RefreshCw size={16} aria-hidden="true" />{t("Perbarui")}</button>
      </ConsultantHeading>
      <div className={s.switcher} role="group" aria-label={t("Jenis agenda")}>
        <button type="button" aria-pressed={kind === "tasks"} onClick={() => update(owner, "tasks")}><ListTodo size={17} aria-hidden="true" />{t("Tugas")}</button>
        <button type="button" aria-pressed={kind === "bookings"} onClick={() => update(owner, "bookings")}><CalendarDays size={17} aria-hidden="true" />{t("Jadwal")}</button>
      </div>
      <div className={s.filters}>
        <OwnerFilter value={owner} members={directory.data?.members || []} onChange={(value) => update(value)} />
      </div>
      <section className={s.panel} id={kind === "tasks" ? "overdue" : undefined} aria-labelledby="agenda-list-title">
        <h2 id="agenda-list-title">{t(kind === "tasks" ? "Tugas terbuka" : "Jadwal konsultasi")}</h2>
        {error ? <div className={s.error} role="alert"><p>{t(error)}</p><button className={s.button} onClick={reload}>{t("Coba lagi")}</button></div>
          : !data ? <ConsultantPending message="Memuat agenda…" layout="list" />
          : !rows.length ? (
            <div className={s.empty}><p>{t(kind === "tasks" ? "Belum ada tugas terbuka pada pilihan ini." : "Belum ada jadwal konsultasi pada pilihan ini.")}</p>
              {owner !== "all" && <button className={s.button} onClick={() => update("all")}>{t("Lihat agenda tim")}</button>}
            </div>
          ) : (
            <>
              {kind === "tasks" && overdue.length > 0 && <>
                <h3 className={s.agendaGroupTitle}>{t("Lewat tenggat")}</h3>
                <AgendaRows records={overdue} now={now} returnTo={returnTo} />
              </>}
              {remaining.length > 0 && <>
                {kind === "tasks" && <h3 className={s.agendaGroupTitle}>{t("Tugas mendatang")}</h3>}
                <AgendaRows records={remaining} now={now} returnTo={returnTo} />
              </>}
            </>
          )}
        {data && <Pager translate={t} page={page} total={data.total} pageSize={data.pageSize} onChange={(next) => update(owner, kind, next)} />}
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
      <section className={s.guidePanel} aria-labelledby="materials-guide-title">
        <h2 id="materials-guide-title">{t("Panduan sesuai pekerjaan")}</h2>
        <div className={s.guideLinks}>
          {([
            ["S01", "Mulai menggunakan portal", "Buka akses dari AMS dan cek penugasan."],
            ["S03", "Persiapan meeting", "Pilih materi dan siapkan pembahasan dengan klien."],
            ["S05", "Menyusun proposal", "Buat draf dan periksa isi usulan sebelum dikirim."],
          ] as const).map(([episode, title, description]) => (
            <Link key={episode} href={"/konsultan/materials/tutorial?episode=" + episode}>
              <div><strong>{t(title)}</strong><span>{t(description)}</span></div>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          ))}
        </div>
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
