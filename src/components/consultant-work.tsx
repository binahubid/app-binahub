"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Fragment, useCallback, useContext, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CalendarPlus, CircleAlert, CircleHelp, Download } from "lucide-react";
import { ConfirmDialog } from "@/components/ui";
import type { MeetingChecklist } from "@/app/admin/_lib/spin-meeting";
import {
  consultantDate,
  ConsultantRequestError,
  consultantMoney,
  consultantRequest,
  downloadConsultantFile,
  fetchConsultantFile,
  messageLabels,
  stageLabels,
  type ConsultantDetail,
  type ConsultantEmailIdentity,
  type ConsultantList,
  type Proposal,
  type ProposalSuggestions,
} from "@/lib/consultant-client";
import { consultantEmailDraft } from "@/lib/consultant-proposal-email";
import { ConsultantProposalComposer } from "./consultant-proposal-composer";
import {
  AgendaRows,
  ConsultantHeading,
  Pager,
} from "./consultant-overview";
import { ConsultantPending, ConsultantReads, consultantAgendaPath, consultantDetailUrl, consultantDirectoryUrl, useConsultantClock, useConsultantData } from "./consultant-data";
import { useConsultant } from "./consultant-shell";
import { ConsultantContext } from "./consultant-context";
import s from "./consultant.module.css";
import proposalLayout from "./consultant-proposal-composer.module.css";
import { useConsultantLocale } from "@/components/consultant-language";
import {
  agendaPath, canAttachProposal, readWorkDestination, safeWorkReturn,
  workAction, workSections, workTabAttention, workUrl, type WorkDestination, type WorkSection,
} from "@/lib/consultant-workflow";

const SpinMeetingChecklist = dynamic(
  () => import("@/app/admin/_components/spin-meeting-checklist").then((component) => component.SpinMeetingChecklist),
  { loading: () => <ConsultantPending message="Memuat checklist meeting…" /> },
);
const sections = Object.keys(workSections) as WorkSection[];
const events: Record<string, string> = {
  owner_assigned: "Penugasan diperbarui",
  booking_linked: "Jadwal dihubungkan",
  consultation_saved: "Checklist diperbarui",
  consultation_source_linked: "Jawaban klien dihubungkan",
  next_action_updated: "Tugas ditambahkan",
  consultant_task_completed: "Tugas selesai",
  consultation_activity: "Balasan klien dicatat",
  stage_changed: "Tahap diperbarui",
  consultant_message_cancelled: "Email dibatalkan",
  consultation_handoff: "Serah terima",
  consultant_replacement_requested: "Permintaan pengganti",
  consultant_proposal_created: "Draf proposal dibuat",
  consultant_message_queued: "Email dijadwalkan",
  consultant_message_accepted: "Email diterima penyedia",
};
const value = (f: FormData, key: string) => String(f.get(key) || "");
const iso = (date: string) => new Date(date).toISOString();

export function ConsultantWork({ id }: { id: string }) {
  const { locale, t } = useConsultantLocale();
  const params = useSearchParams();
  const destination = readWorkDestination(params);
  const { section, target } = destination;
  const returnTo = safeWorkReturn(params.get("from"));
  const backLabel = returnTo.startsWith(agendaPath) ? "Tugas & jadwal" : "Klien & peluang";
  const now = useConsultantClock();
  const focusedDestination = useRef<HTMLElement | null>(null);
  const [history, setHistory] = useState(0),
    [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const [chosenEmail, setChosenEmail] = useState<{ proposalId?: string; kind: string; attachmentId?: string }>();
  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    action: () => Promise<void>;
    label: string;
  } | null>(null);
  const lock = useRef(false),
    messageRequest = useRef<{ key: string; id: string; at: string } | null>(
      null,
    );
  const endpoint = `/api/konsultan/${id}`;
  const suggestions = useRef<{ key: string; promise: Promise<ProposalSuggestions> } | null>(null);
  const reads = useContext(ConsultantReads);
  const work = useConsultantData<ConsultantDetail>(
    consultantDetailUrl(id, history),
  );
  const directory = useConsultantData<ConsultantList>(section === "proposal" ? consultantDirectoryUrl : null);
  const session = useConsultant();
  const assignees = useConsultantData<{ members: { id: string; name: string }[] }>(
    session.isAdmin ? "/api/admin/consultants?view=assignees" : null,
  );
  const eligibleMembers = assignees.data?.members ?? [];
  const [checklistKey, setChecklistKey] = useState(0);
  const [savedChecklist, setSavedChecklist] = useState<MeetingChecklist | null>(
    null,
  );
  const invalidateWork = useCallback(() => reads?.invalidate((url) => url.startsWith(endpoint + "?")
    || url === consultantDirectoryUrl || url.startsWith(consultantDirectoryUrl + "?")
    || url.startsWith(consultantAgendaPath + "?")), [reads, endpoint]);
  const onSaved = useCallback(
    (result: MeetingChecklist) => {
      setSavedChecklist(result);
      invalidateWork();
    },
    [invalidateWork],
  );
  const data = work.data;
  const reloadWork = work.reload;
  const record = data?.record;
  const canSend = Boolean(record?.canEdit && data?.workspace && record.assigneeId
    && !record.handoff && !["won", "lost"].includes(record.stage));
  const emailIdentity = useConsultantData<ConsultantEmailIdentity>(
    canSend && section === "followup" ? `${endpoint}/messages?assignment=${record?.assignmentRevision ?? 0}` : null,
  );
  const loaded = !!data;
  const focusId = target === "review" && destination.proposalId ? "proposal-" + destination.proposalId
    : target ? "work-" + target : "";
  useEffect(() => {
    if (!loaded || !focusId) {
      focusedDestination.current = null;
      return;
    }
    const element = document.getElementById(focusId) || document.getElementById("work-" + target);
    if (!element || focusedDestination.current === element) return;
    if (element instanceof HTMLDetailsElement) element.open = true;
    element.focus({ preventScroll: true });
    element.scrollIntoView({ block: "start" });
    focusedDestination.current = element;
  }, [data, loaded, focusId, target]);
  const version = Math.max(
    data?.record.version ?? 0,
    savedChecklist?.revision ?? 0,
  );

  const suggest = useCallback((retry = false) => {
    const key = `${endpoint}:${data?.workspace?.checklist_revision}:${version}`;
    if (retry || suggestions.current?.key !== key) {
      const promise = consultantRequest<ProposalSuggestions>(
        `${endpoint}/proposals/suggestions`, { version }, "POST", AbortSignal.timeout(32_000),
      ).catch(error => {
        if (error instanceof ConsultantRequestError && error.code === "CONSULTANT_CONFLICT") reloadWork();
        throw error;
      });
      suggestions.current = { key, promise };
    }
    return suggestions.current!.promise;
  }, [endpoint, data?.workspace?.checklist_revision, version, reloadWork]);

  async function run(
    action: () => Promise<unknown>,
    success: string,
    refresh = true,
  ) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(success);
      if (refresh) {
        invalidateWork();
        work.reload();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Perubahan belum tersimpan.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const save = (action: string, payload: object) =>
    consultantRequest(endpoint, { action, version, ...payload }, "PATCH");
  function submit(
    e: FormEvent<HTMLFormElement>,
    action: (f: FormData) => Promise<unknown>,
    success: string,
  ) {
    e.preventDefault();
    const form = e.currentTarget,
      fields = new FormData(form);
    void run(async () => {
      await action(fields);
      form.reset();
    }, success);
  }
  function move(next: WorkDestination) {
    if (busy || dirty) return;
    if (section === "meeting" && next.section !== section && (savedChecklist?.revision ?? 0) > (data?.record.version ?? 0)) {
      work.reload();
    }
    const nextProposalId = next.proposalId ?? (section === "followup" && next.section === "followup" ? destination.proposalId : undefined);
    const sameSection = next.section === section && next.target === target && nextProposalId === destination.proposalId;
    if (sameSection && focusId) {
      const element = document.getElementById(focusId) || document.getElementById("work-" + target);
      element?.focus({ preventScroll: true });
      element?.scrollIntoView({ block: "start" });
      return;
    }
    window.history.replaceState(null, "", workUrl(id, { ...next, proposalId: nextProposalId }, returnTo));
    setError("");
    setMessage("");
  }
  function download(p: Proposal) {
    void run(
      () =>
        downloadConsultantFile(
          `${endpoint}/proposals/${p.id}/pdf`,
          `BinaHub-Proposal-r${p.revision}.pdf`,
        ),
      "PDF diunduh.",
      false,
    );
  }
  function viewRecommendation() {
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    void run(async () => {
      try {
        const response = await fetchConsultantFile(`${endpoint}/recommendation`);
        const url = URL.createObjectURL(await response.blob());
        if (tab && !tab.closed) tab.location.href = url;
        else {
          const link = document.createElement("a");
          link.href = url;
          link.download = "BinaHub-Rekomendasi-Awal.pdf";
          link.click();
        }
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } catch (error) {
        tab?.close();
        throw error;
      }
    }, "PDF rekomendasi siap dibaca.", false);
  }
  function applyClientAnswers(sourceId: string) {
    void run(async () => {
      await save("client_answers", { sourceId });
      setChecklistKey(key => key + 1);
    }, "Jawaban klien sudah dipakai untuk checklist.");
  }
  function reviewEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const identity = emailIdentity.data;
    if (!identity) return;
    const form = e.currentTarget,
      f = new FormData(form);
    const kind = value(f, "kind"),
      proposalId = value(f, "proposalId") || null,
      subject = value(f, "subject"),
      body = value(f, "body"),
      when = value(f, "when");
    if (kind === "proposal" && (!proposalId || !readyProposals.some((p) => p.id === proposalId))) {
      setError("Pilih revisi proposal yang sesuai dengan checklist terbaru.");
      return;
    }
    const key = JSON.stringify([
      kind,
      proposalId,
      subject,
      body,
      when,
      version,
      locale,
    ]);
    if (messageRequest.current?.key !== key)
      messageRequest.current = {
        key,
        id: crypto.randomUUID(),
        at: when ? iso(when) : new Date().toISOString(),
      };
    const request = messageRequest.current;
    const proposal = data?.proposals.find((p) => p.id === proposalId);
    setConfirm({
      title: when ? "Jadwalkan email ini?" : "Masukkan email ke antrean?",
      label: when ? "Jadwalkan email" : "Antrekan email",
      description: t("Kepada {0}. Dari {1}. Balasan masuk ke {2}. {3}{4}", [
        identity.to,
        identity.from,
        identity.replyTo,
        proposal ? t("Lampiran proposal revisi {0}.", [proposal.revision]) + " " : "",
        when ? t("Jadwal {0}.", [consultantDate(request.at, locale)]) : t("Email akan diproses pada antrean berikutnya."),
      ]),
      action: async () => {
        setConfirm(null);
        await run(async () => {
          await consultantRequest(`${endpoint}/messages`, {
            id: request.id,
            version,
            kind,
            proposalId,
            subject,
            body,
            locale,
            scheduledAt: request.at,
          });
          form.reset();
          messageRequest.current = null;
          window.history.replaceState(null, "", workUrl(id, { section: "followup", target: "delivery", proposalId: destination.proposalId }, returnTo));
        }, "Email masuk antrean. Pantau statusnya di riwayat pengiriman.");
      },
    });
  }

  if (!data)
    return (
      <>
        <Link className={s.back} href={returnTo}>
          <ArrowLeft size={16} aria-hidden="true" />{t(backLabel)}</Link>
        {work.error ? (
          <div className={s.error} role="alert">
            {t(work.error)}{" "}
            <button className={s.button} onClick={work.reload}>{t("Coba lagi")}</button>
          </div>
        ) : (
          <ConsultantPending message="Memuat peluang…" layout="page" />
        )}
      </>
    );
  const r = data.record,
    canEdit = r.canEdit && (data.workspace !== null || session.isAdmin);
  const canOperate = canEdit && data.workspace !== null;
  const checklistComplete = (savedChecklist && savedChecklist.revision >= r.version ? savedChecklist.status : r.checklistStatus) === "completed";
  const refreshingChecklist = (savedChecklist?.revision ?? 0) > r.version;
  const checklistRevision = refreshingChecklist ? undefined : data.workspace?.checklist_revision;
  const programs = (directory.data?.catalog || []).filter(
    (program) =>
      program.code !== "SS-27" || data.proposalDefaults?.spiritualOptIn,
  );
  const readyProposals = data.proposals.filter((p) => canAttachProposal(p, checklistRevision));
  const emailChoice = chosenEmail?.proposalId === destination.proposalId ? chosenEmail : undefined;
  const emailKind = emailChoice?.kind ?? (destination.proposalId ? "proposal" : "follow_up");
  const presetProposal = readyProposals.find((p) => p.id === (emailChoice?.attachmentId ?? destination.proposalId));
  const emailDraft = consultantEmailDraft(data, locale, presetProposal);
  const initial = data.initialRecommendation;
  const prior = data.proposals.find(proposal => proposal.checklist_revision === checklistRevision);
  const recommendation = initial ? (
    <section className={`${s.panel} ${s.recommendationCard}`} aria-labelledby="work-initial-title">
      <h2 id="work-initial-title">{t("Rekomendasi awal klien")}</h2>
      <p className={s.muted}>{t("Form dikirim klien {0}.", [consultantDate(initial.submittedAt, locale)])}</p>
      <p>{t(initial.sentAt ? "Rekomendasi diterima penyedia email {0}."
        : initial.delivery === "uncertain" ? "Status pengiriman rekomendasi perlu diperiksa."
        : initial.delivery === "failed" ? "Email rekomendasi gagal dikirim."
        : initial.delivery === "pending" || initial.delivery === "sending" ? "Email rekomendasi dalam antrean."
        : initial.ready ? "Laporan tersedia. Pengiriman belum tercatat."
        : "Laporan sedang disiapkan.", [consultantDate(initial.sentAt, locale)])}</p>
      {!!initial.programs.length && <ul className={s.list}>
        {initial.programs.map(program => <li key={program.code}>{program.name}</li>)}
      </ul>}
      <div className={s.actions}>
        {initial.ready && <button type="button" className={s.button} onClick={viewRecommendation} disabled={busy}>
          <Download size={16} aria-hidden="true" />{t("Buka PDF rekomendasi")}
        </button>}
        {canSend && initial.sentAt && <button type="button" className={s.primary} disabled={busy || dirty}
          onClick={() => {
            setChosenEmail(undefined);
            move({ section: "followup", target: "email" });
          }}>{t("Tindak lanjuti rekomendasi")}</button>}
        {canSend && initial.sentAt && !(section === "proposal" && target === "draft") && <button
          type="button" className={s.button} disabled={busy || dirty}
          onClick={() => move({ section: "proposal", target: "draft" })}>{t("Siapkan Proposal Pelaksanaan")}</button>}
      </div>
    </section>
  ) : data.recommendationUnavailable ? <p className={s.notice} role="status">{t("Rekomendasi awal belum dapat diperiksa. Coba lagi beberapa saat.")}</p> : null;
  const next = workAction(data, canOperate, session.isAdmin, checklistComplete, now, checklistRevision);
  const attention = workTabAttention(data, next, canOperate, session.isAdmin, checklistComplete, now, checklistRevision);
  const informational = (!canOperate && next.destination.target !== "assignment")
    || !!r.handoff || r.stage === "lost";
  const nextPriority = next.priority ?? (informational ? "neutral" : "default");
  const eligibleHandoff = canOperate && r.stage !== "lost" && readyProposals.some((p) => p.status === "sent");
  const handoff = r.handoff;

  return (
    <>
      <Link className={s.back} href={returnTo}>
        <ArrowLeft size={16} aria-hidden="true" />{t(backLabel)}</Link>
      <ConsultantHeading
        title={r.company || r.name}
        description={[r.name, r.assigneeName]
          .filter(Boolean)
          .join(" · ")}
      >
        <span className={`${s.badge} ${canOperate ? "" : s.readonly}`}>
          {t(canOperate ? "Dapat dikelola" : r.assigneeId ? "Hanya baca" : "Menunggu penugasan admin")}
        </span>
        <button
          className={s.button}
          disabled={dirty || busy}
          onClick={work.reload}
        >{t("Perbarui")}</button>
      </ConsultantHeading>
      <section className={s.nextStep} data-priority={nextPriority} aria-labelledby="work-next-title">
        <div>
          <p className={s.priorityLabel} id="work-next-title">
            {next.priority && <CircleAlert size={16} aria-hidden="true" />}
            {t("Langkah berikutnya")}
          </p>
          <h2>{t(next.status)}</h2>
          <p className={s.muted}>{t(next.description)}</p>
        </div>
        <div className={s.nextActions}>
          <button type="button" className={s.primary} disabled={dirty || busy} onClick={() => move(next.destination)}>
            {t(next.label)} <ArrowRight size={16} aria-hidden="true" />
          </button>
          {canSend && eligibleHandoff && <button type="button" className={s.button} disabled={dirty || busy}
            onClick={() => move({ section: "summary", target: "handoff" })}>{t("Klien sudah setuju?")}</button>}
        </div>
      </section>
      <ConsultantContext record={r} />
      {!canOperate && (
        <p className={s.notice}>
          {r.assigneeId
            ? t("Pekerjaan ini dikelola oleh {0}. Anda dapat membaca kebutuhan, proposal, tugas, dan riwayatnya.", [r.assigneeName])
            : t("Admin dapat menugaskan konsultan untuk mulai mengelola peluang ini.")}
        </p>
      )}
      <nav aria-label={t("Detail peluang")} className={s.workTabs}>
        {sections.map((tab) => {
          const badge = attention[tab];
          const descriptionId = badge ? `work-tab-attention-${tab}` : undefined;
          return (
            <Fragment key={tab}>
              <button
                type="button"
                aria-current={section === tab ? "page" : undefined}
                aria-describedby={descriptionId}
                disabled={section !== tab && (dirty || busy)}
                onClick={() => move(badge?.destination ?? { section: tab })}
              >
                <span>{t(workSections[tab])}</span>
                {badge && <span aria-hidden="true" className={s.tabAttention} data-urgent={badge.urgent || undefined} title={t(badge.reason)}>!</span>}
              </button>
              {badge && <span id={descriptionId} className="sr-only">{t(badge.reason)}</span>}
            </Fragment>
          );
        })}
      </nav>
      {dirty && <p className={s.muted} role="status">{t("Simpan perubahan checklist untuk berpindah bagian.")}</p>}
      {error && (
        <p className={s.error} role="alert">
          {t(error)}
        </p>
      )}
      {message && target !== "delivery" && target !== "review" && (
        <p className={s.success} role="status">
          {t(message)}
        </p>
      )}
      {section === "summary" && (
        <>
          {recommendation}
          <div className={s.grid}>
            <section className={s.panel} id="work-contact" tabIndex={-1}>
              <h2>{t("Kontak dan status")}</h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className={s.muted}>{t("Kontak")}</dt>
                  <dd>{r.name}</dd>
                </div>
                <div>
                  <dt className={s.muted}>Email</dt>
                  <dd className="break-all">{r.email || "—"}</dd>
                </div>
                <div>
                  <dt className={s.muted}>{t("Telepon")}</dt>
                  <dd>{r.phone || "—"}</dd>
                </div>
              </dl>
              {target === "contact" && canSend && r.email && (
                <button type="button" className={s.primary + " mt-4"} disabled={busy} onClick={() => move({ section: "followup", target: "email" })}>
                  {t("Siapkan email")} <ArrowRight size={16} aria-hidden="true" />
                </button>
              )}
              {canOperate && (
                <form
                  className={s.form}
                  onSubmit={(e) =>
                    submit(
                      e,
                      (f) =>
                        save("stage", {
                          stage: value(f, "stage"),
                          note: value(f, "note"),
                        }),
                      "Tahap peluang diperbarui.",
                    )
                  }
                >
                  <label className={s.field}>{t("Ubah tahap")}<select name="stage" defaultValue={r.stage} key={r.stage}>
                      {Object.entries(stageLabels).map(([v, label]) => (
                        <option key={v} value={v}>
                          {t(label)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={s.field}>{t("Catatan tahap")}<input
                      name="note"
                      maxLength={4000}
                      placeholder={t("Isi alasan jika peluang tidak dilanjutkan")}
                    />
                  </label>
                  <button className={s.button} disabled={busy}>{t("Simpan tahap")}</button>
                </form>
              )}
            </section>
            <section className={s.panel} id="work-schedule" tabIndex={-1}>
              <h2>{t("Jadwal konsultasi")}</h2>
              <AgendaRows records={data.bookings} now={now} details />
              {canSend && !handoff && data.bookingUrl && (
                <div className={s.bookingAction}>
                  <p>{t("Sepakati waktunya dengan klien. Pilih slot yang tersedia di Cal.com dan pakai email yang tercantum di Kontak dan status.")}</p>
                  <a className={s.button} href={data.bookingUrl} target="_blank" rel="noopener noreferrer"
                    aria-describedby="cal-booking-help">
                    <CalendarPlus size={17} aria-hidden="true" />{t("Jadwalkan di Cal.com")}
                  </a>
                  <p className={s.muted} id="cal-booking-help">{t("Cal.com terbuka di tab baru. Setelah booking, kembali dan pilih Perbarui untuk melihat jadwal.")}</p>
                </div>
              )}
              {canOperate && (
                <form
                  className={s.form}
                  onSubmit={(e) =>
                    submit(
                      e,
                      (f) => save("replacement", { note: value(f, "note") }),
                      "Permintaan pengganti tercatat untuk admin.",
                    )
                  }
                >
                  <label className={s.field}>{t("Butuh konsultan pengganti?")}<input
                      name="note"
                      required
                      maxLength={4000}
                      placeholder={t("Alasan dan jadwal terkait")}
                    />
                  </label>
                  <button className={s.button} disabled={busy}>{t("Minta pengganti")}</button>
                </form>
              )}
            </section>
          </div>
          {session.isAdmin && (
            <section className={s.panel} id="work-assignment" tabIndex={-1}>
              <h2>{t("Penugasan konsultan")}</h2>
              <p className={s.muted} id="consultant-assignment-help">{t("Pilih anggota tim konsultan yang sudah menyetujui perjanjian di AMS.")}</p>
              {assignees.error ? (
                <div className={s.actions}>
                  <p role="alert" className={s.error}>{t(assignees.error)}</p>
                  <button type="button" className={s.button} onClick={assignees.reload}>{t("Coba lagi")}</button>
                </div>
              ) : !assignees.data ? (
                <p role="status" className={s.muted}>{t("Memeriksa daftar akun AMS…")}</p>
              ) : !eligibleMembers.length ? (
                <p role="status" className={s.muted}>{t("Belum ada akun yang siap ditugaskan.")}{" "}
                  <a className={s.textlink} href="https://ams.binahub.id/admin/consultant-team" target="_blank" rel="noopener noreferrer">{t("Undang anggota di AMS")}</a>
                </p>
              ) : null}
              <form
                className={s.form}
                onSubmit={(e) =>
                  submit(
                    e,
                    (f) =>
                      consultantRequest("/api/admin/consultants", {
                        action: "assign",
                        leadId: id,
                        userId: value(f, "userId"),
                        version,
                        note: value(f, "note"),
                      }),
                    "Penanggung jawab diperbarui.",
                  )
                }
              >
                <div className={s.two}>
                  <label className={s.field}>{t("Penanggung jawab")}<select name="userId" required defaultValue="" disabled={!eligibleMembers.length || busy}
                      aria-describedby="consultant-assignment-help">
                      <option value="" disabled>{t("Pilih konsultan aktif")}</option>
                      {eligibleMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className={s.field}>{t("Catatan penugasan")}<input name="note" maxLength={4000} />
                  </label>
                </div>
                <button className={s.primary} disabled={busy || !eligibleMembers.length}>{t("Tetapkan konsultan")}</button>
              </form>
            </section>
          )}
          <section className={s.panel} id="work-handoff" tabIndex={-1}>
            <h2>{t("Serah terima ke admin")}</h2>
            {handoff ? (
              <>
                <p className={s.muted}>{consultantDate(handoff.requestedAt)}</p>
                <p className="mt-2 whitespace-pre-line">{handoff.note}</p>
                {session.isAdmin && (
                  <Link
                    className={s.textlink}
                    href={`/admin/clients?lead=${id}`}
                  >{t("Lanjutkan ke Klien & Pelaksanaan")}</Link>
                )}
              </>
            ) : (
              <p className={s.muted}>{t("Tersedia setelah proposal dikirim dan klien menyepakati program.")}</p>
            )}
            {eligibleHandoff && !handoff && (
                <form
                  className={s.form}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const note = value(new FormData(e.currentTarget), "note");
                    setConfirm({
                      title: "Serahkan program ke admin?",
                      description:
                        "Peluang akan ditandai disepakati. Email yang masih terjadwal pada peluang ini akan dibatalkan.",
                      label: "Serahkan ke admin",
                      action: async () => {
                        setConfirm(null);
                        await run(
                          () => save("handoff", { note }),
                          "Serah terima tercatat.",
                        );
                      },
                    });
                  }}
                >
                  <div className={s.field}>
                    <label htmlFor="handoff-note">{t("Kesepakatan klien dan arahan pelaksanaan")}</label>
                    <textarea id="handoff-note" name="note" required maxLength={4000} rows={4} aria-describedby="handoff-hint"
                      placeholder={t("Contoh: Klien menyetujui proposal revisi 2 untuk 32 peserta. Jadwal dan lokasi disepakati. Ibu Rina menjadi PIC. Admin perlu mengonfirmasi dokumen pemesanan.")} />
                    <span id="handoff-hint" className={s.muted}>{t("Catat revisi yang disetujui, ruang lingkup, jadwal, PIC klien, dan hal yang masih perlu dikonfirmasi admin.")}</span>
                  </div>
                  <button className={s.primary} disabled={busy}>{t("Tinjau serah terima")}</button>
                </form>
              )}
          </section>
        </>
      )}
      {section === "meeting" && (
        <>
        {recommendation}
        <section className={s.panel} id="work-checklist" tabIndex={-1}>
          <h2>{t("Kebutuhan & meeting")}</h2>
          <p className={s.muted}>{t("Tinjau jawaban sebelum meeting. Klarifikasi hanya bagian yang berubah atau masih diperlukan.")}</p>
          {canOperate && initial?.canUseAnswers && !checklistComplete && (
            <div className={s.flowNotice}>
              <p>{t("Jawaban klien sudah lengkap. Gunakan jawaban ini jika kebutuhan masih sesuai.")}</p>
              <button type="button" className={s.primary} disabled={busy || dirty} onClick={() => applyClientAnswers(initial.id)}>{t("Gunakan jawaban klien")}</button>
            </div>
          )}
          {!dirty && <Link className={s.inlineHelp} href="/konsultan/materials/tutorial?episode=S03">{t("Lihat panduan persiapan konsultasi")}</Link>}
          {canOperate &&
            data.sources.length > 0 &&
            !data.workspace?.source_id && !checklistComplete && !initial?.canUseAnswers && (
              <form
                className={s.form}
                onSubmit={(e) =>
                  submit(
                    e,
                    async (f) => {
                      await save("source", { sourceId: value(f, "sourceId") });
                      setChecklistKey((v) => v + 1);
                    },
                    "Jawaban awal klien terhubung.",
                  )
                }
              >
                <label className={s.field}>{t("Gunakan jawaban rekomendasi program")}<select required name="sourceId" defaultValue="">
                    <option value="" disabled>{t("Pilih pengisian klien")}</option>
                    {data.sources.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.company} · {consultantDate(x.submittedAt)}
                      </option>
                    ))}
                  </select>
                </label>
                <button className={s.button} disabled={busy || dirty}>{t("Hubungkan jawaban")}</button>
              </form>
            )}
          <SpinMeetingChecklist
            key={`${id}-${checklistKey}`}
            id={id}
            endpoint={`${endpoint}/meeting`}
            readOnly={!canOperate}
            locale={locale}
            translate={t}
            onSaved={onSaved}
            onDirty={setDirty}
          />
          {canOperate && checklistComplete && !dirty && !initial?.sentAt && (
            <div className={s.flowNotice}>
              <p>{t("Checklist siap dipakai untuk memilih program dan menyusun draf.")}</p>
              <button type="button" className={s.primary} disabled={busy}
                onClick={() => move({ section: "proposal", target: "draft" })}>{t("Susun Proposal Pelaksanaan")}</button>
            </div>
          )}
        </section>
        </>
      )}
      {section === "proposal" && (
        <>
          {recommendation}
          {canOperate && !checklistComplete && (
            <section className={s.panel} id="work-draft" tabIndex={-1}>
              <h2>{t("Susun Proposal Pelaksanaan")}</h2>
              <div className={s.flowNotice}>
                <p>{t(initial?.canUseAnswers
                  ? "Jawaban klien sudah lengkap. Gunakan jawaban ini jika kebutuhan masih sesuai."
                  : "Selesaikan checklist kebutuhan terlebih dahulu.")}</p>
                {initial?.canUseAnswers && <button type="button" className={s.primary} disabled={busy}
                  onClick={() => applyClientAnswers(initial.id)}>{t("Gunakan jawaban klien")}</button>}
                <button type="button" className={initial?.canUseAnswers ? s.button : s.primary} disabled={busy}
                  onClick={() => move({ section: "meeting", target: "checklist" })}>{t("Buka checklist kebutuhan")}</button>
              </div>
            </section>
          )}
          <section className={s.panel} id="work-review" tabIndex={-1}>
            <h2>{t("Riwayat Proposal Pelaksanaan")}</h2>
            {target === "review" && message && <p className={s.success} role="status">{t(message)}</p>}
            {data.proposals.length ? (
              data.proposals.map((p) => {
                const current = canAttachProposal(p, checklistRevision);
                return (
                <details className={s.details} key={p.id} id={"proposal-" + p.id} tabIndex={-1}>
                  <summary>{t("Revisi {0}", [p.revision])} · {t(p.status === "sent" ? "Terkirim" : current ? "Draf siap ditinjau" : "Draf · Perlu revisi")} · {p.snapshot.total === null ? t("Investasi perlu konfirmasi") : consultantMoney(p.snapshot.total)}</summary>
                  {!current && <p className={s.attentionText}>{t(refreshingChecklist ? "Memuat versi checklist terbaru…"
                    : p.priceRefresh ? "Buat draf baru agar estimasi mengikuti tarif katalog."
                    : "Revisi ini memakai checklist sebelumnya dan tidak dapat dijadikan lampiran baru.")}</p>}
                  <p>
                    {consultantDate(p.created_at)} · {p.snapshot.days} {t("hari ·")}{" "}
                    {p.snapshot.participants} {t("peserta ·")} {p.snapshot.venue}
                    {p.snapshot.location && ` · ${p.snapshot.location}`}
                  </p>
                  <ul className={s.list}>
                    {p.snapshot.programs.map((program) => (
                      <li key={program.code}>
                        {program.name} · {program.total === null ? t("Investasi perlu konfirmasi") : consultantMoney(program.total)}
                        {program.priceBasis && <div className={s.muted}>{program.priceBasis}</div>}
                      </li>
                    ))}
                  </ul>
                  {p.snapshot.total === null && p.snapshot.pricedSubtotal != null && <p>{t("Subtotal yang sudah terhitung: {0}", [consultantMoney(p.snapshot.pricedSubtotal)])}</p>}
                  <p>{p.snapshot.priceNote}</p>
                  <div className={s.actions}>
                    <button className={s.button} disabled={busy} onClick={() => download(p)}>
                      <Download size={16} aria-hidden="true" />{t("Unduh PDF")}
                    </button>
                    {canSend && current && p.status === "draft" && (
                      <button type="button" className={s.primary} disabled={busy}
                        onClick={() => {
                          setChosenEmail(undefined);
                          move({ section: "followup", target: "email", proposalId: p.id });
                        }}>{t("Siapkan pengiriman proposal")}</button>
                    )}
                    {canOperate && !current && !refreshingChecklist && (
                      <button type="button" className={s.button} disabled={busy}
                        onClick={() => move(checklistComplete ? { section: "proposal", target: "draft" } : { section: "meeting", target: "checklist" })}>
                        {t(checklistComplete ? "Buat revisi" : "Lengkapi checklist")}
                      </button>
                    )}
                  </div>
                </details>
                );
              })
            ) : (
              <p className={s.empty}>{t("Belum ada proposal untuk peluang ini.")}</p>
            )}
          </section>
          {canOperate && checklistComplete && (
            <section className={s.panel} id="work-draft" tabIndex={-1}>
              <div className={proposalLayout.heading}>
                <div>
                  <h2>{t("Susun Proposal Pelaksanaan")}</h2>
                  <p>{t("Tinjau program dan rincian pelaksanaan yang diambil dari checklist.")}</p>
                </div>
                <Link className={proposalLayout.guide} href="/konsultan/materials/tutorial?episode=S05">
                  <CircleHelp size={16} aria-hidden="true" />{t("Lihat panduan menyusun proposal")}
                </Link>
              </div>
              {refreshingChecklist ? <ConsultantPending message="Memuat versi checklist terbaru…" />
              : directory.error ? (
                <div className={s.error} role="alert">
                  <p>{t("Katalog program belum dapat dimuat.")}</p>
                  <button type="button" className={s.button} onClick={directory.reload}>{t("Coba lagi")}</button>
                </div>
              ) : !directory.data ? <ConsultantPending message="Memuat katalog program…" />
              : programs.length === 0 ? <p className={s.notice}>{t("Belum ada program yang tersedia untuk kebutuhan ini.")}</p>
              : (
                <ConsultantProposalComposer
                  key={`${checklistRevision}:${prior?.id ?? ""}`}
                  programs={programs}
                  defaults={data.proposalDefaults}
                  prior={prior?.snapshot}
                  autoStart={target === "draft" || !initial?.sentAt}
                  suggest={suggest}
                  busy={busy}
                  onOpenChecklist={() => move({ section: "meeting", target: "checklist" })}
                  onSubmit={(e) => submit(e, async (f) => {
                    const created = await consultantRequest<Proposal>(`${endpoint}/proposals`, {
                      version,
                      programCodes: f.getAll("programs"),
                      days: Number(f.get("days")),
                      participants: Number(f.get("participants")),
                      venue: value(f, "venue"),
                      location: value(f, "location"),
                      scopeNote: value(f, "scope"),
                      nextStep: value(f, "nextStep"),
                    });
                    window.history.replaceState(null, "", workUrl(id, { section: "proposal", target: "review", proposalId: created.id }, returnTo));
                  }, "Draf proposal tersimpan. Tinjau PDF sebelum mengirim.")}
                />
              )}
            </section>
          )}
        </>
      )}
      {section === "followup" && (
        <>
          <div className={s.followupLinks}>
            {canSend && <button type="button" className={s.button} disabled={busy}
              onClick={() => move({ section: "followup", target: "email", proposalId: destination.proposalId })}>{t("Siapkan email")}</button>}
            <button type="button" className={s.button} disabled={busy} onClick={() => move({ section: "followup", target: "delivery" })}>{t("Status email")}</button>
            <button type="button" className={s.button} disabled={busy} onClick={() => move({ section: "followup", target: "activity" })}>{t(canOperate ? "Catat balasan" : "Riwayat aktivitas")}</button>
          </div>
          <section className={s.panel} id="work-tasks" tabIndex={-1}>
            <h2>{t("Tugas")}</h2>
            {data.tasks.length ? (
              <ul>
                {data.tasks.map((task) => (
                  <li className={s.row} key={task.id}>
                    <div>
                      <h3>{task.title}</h3>
                      <p className={s.muted}>
                        {consultantDate(task.due_at)} ·{" "}
                        {task.status === "completed" ? t("Selesai") : t("Terbuka")}
                      </p>
                    </div>
                    {canOperate && task.status === "open" && (
                      <button
                        className={s.button}
                        disabled={busy}
                        onClick={() =>
                          void run(
                            () =>
                              save("complete_task", {
                                taskId: task.id,
                                revision: task.revision,
                              }),
                            "Tugas ditandai selesai.",
                          )
                        }
                      >{t("Tandai selesai")}</button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={s.muted}>{t("Belum ada tugas.")}</p>
            )}
            {canOperate && (
              <form
                className={s.form}
                onSubmit={(e) =>
                  submit(
                    e,
                    (f) =>
                      save("task", {
                        id: crypto.randomUUID(),
                        title: value(f, "title"),
                        dueAt: iso(value(f, "dueAt")),
                      }),
                    "Tugas ditambahkan.",
                  )
                }
              >
                <div className={s.two}>
                  <label className={s.field}>{t("Tugas baru")}<input name="title" required maxLength={240} />
                  </label>
                  <label className={s.field}>{t("Tenggat (waktu perangkat)")}<input name="dueAt" type="datetime-local" required />
                  </label>
                </div>
                <button className={s.button} disabled={busy}>{t("Tambah tugas")}</button>
              </form>
            )}
          </section>
          {canSend && (
            <section className={s.panel} id="work-email" tabIndex={-1}>
              <h2>{t("Siapkan email")}</h2>
              {emailIdentity.data ? (
                <dl className={s.emailAddresses}>
                  <div><dt>{t("Kepada")}</dt><dd>{emailIdentity.data.to}</dd></div>
                  <div><dt>{t("Dari")}</dt><dd>{emailIdentity.data.from}</dd></div>
                  <div><dt>{t("Balasan masuk ke")}</dt><dd>{emailIdentity.data.replyTo}</dd></div>
                </dl>
              ) : emailIdentity.error ? (
                <div className={s.error} role="alert">
                  <p>{t(emailIdentity.error)}</p>
                  <button type="button" className={s.button} onClick={emailIdentity.reload}>{t("Coba lagi")}</button>
                </div>
              ) : <ConsultantPending message="Memeriksa alamat pengiriman…" />}
              {!readyProposals.length && !initial?.sentAt && <div className={s.flowNotice}>
                <p>{t("Pengiriman proposal memerlukan draf dari checklist terbaru.")}</p>
                <button type="button" className={s.button} disabled={busy}
                  onClick={() => move(checklistComplete ? { section: "proposal", target: "draft" } : { section: "meeting", target: "checklist" })}>
                  {t(checklistComplete ? "Buka penyusunan proposal" : "Buka checklist kebutuhan")}</button>
              </div>}
              <form className={s.form} key={destination.proposalId || "email"} onSubmit={reviewEmail}>
                <div className={s.two}>
                  <label className={s.field}>{t("Jenis email")}<select name="kind" value={emailKind}
                    onChange={(e) => setChosenEmail({
                      proposalId: destination.proposalId, kind: e.target.value,
                      attachmentId: e.target.value === "follow_up" ? "" : presetProposal?.id ?? "",
                    })}>
                      <option value="follow_up">{t("Tindak lanjut")}</option>
                      <option value="proposal" disabled={!readyProposals.length}>{t("Pengiriman proposal")}</option>
                    </select>
                  </label>
                  <label className={s.field}>{t("Lampiran proposal")}<select name="proposalId" required={emailKind === "proposal"}
                      disabled={!readyProposals.length} value={presetProposal?.id || ""}
                      onChange={(e) => setChosenEmail({ proposalId: destination.proposalId, kind: emailKind, attachmentId: e.target.value })}>
                      <option value="">{t(emailKind === "proposal" ? "Pilih revisi proposal" : "Tanpa lampiran")}</option>
                      {readyProposals.map((p) => (
                        <option key={p.id} value={p.id}>
                          {t("Revisi {0}", [p.revision])} · {consultantDate(p.created_at)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <Fragment key={`${locale}:${emailKind}:${presetProposal?.id ?? "none"}`}>
                  <label className={s.field}>
                    {t("Subjek")}
                    <input name="subject" maxLength={180} defaultValue={emailDraft.subject} required />
                  </label>
                  <label className={s.field}>{t("Isi pesan")}
                    <textarea name="body" rows={7} maxLength={10000} defaultValue={emailDraft.body} required />
                    <span className={s.muted}>{t("Sapaan dan nama konsultan disertakan saat email dikirim.")}</span>
                  </label>
                </Fragment>
                <label className={s.field}>{t("Jadwal kirim (waktu perangkat)")}<input name="when" type="datetime-local" />
                  <span className={s.muted}>{t("Kosongkan jika email boleh diproses pada antrean berikutnya.")}</span>
                </label>
                <button className={s.primary} disabled={busy || !emailIdentity.data || (emailKind === "proposal" && !readyProposals.length)}>{t("Tinjau pengiriman")}</button>
              </form>
            </section>
          )}
          <section className={s.panel} id="work-delivery" tabIndex={-1}>
            <h2>{t("Riwayat pengiriman")}</h2>
            {target === "delivery" && message && <p className={s.success} role="status">{t(message)}</p>}
            {data.messages.length ? (
              data.messages.map((m) => (
                <details className={s.details} key={m.id}>
                  <summary>
                    {m.envelope.subject} · {t(messageLabels[m.status] || m.status)}
                  </summary>
                  <p>
                    {consultantDate(m.scheduled_at)} · {m.envelope.senderName} →{" "}
                    {m.envelope.to}
                  </p>
                  {m.envelope.replyTo && <p className={s.muted}>{t("Balasan masuk ke {0}", [m.envelope.replyTo])}</p>}
                  <p>{m.envelope.body}</p>
                  {m.status === "uncertain" && <p>{t("Minta admin memeriksa status pengiriman sebelum Anda mengirim ulang.")}</p>}
                  {m.status === "accepted" && <p>{t("Layanan email sudah menerima pesan. Status ini belum memastikan email masuk ke kotak masuk klien.")}</p>}
                  {m.status === "queued" && <p>{t("Email menunggu jadwal atau giliran proses.")}</p>}
                  {m.status === "failed" && <p>{t("Periksa penerima dan lampiran sebelum menyiapkan pengiriman baru.")}</p>}
                  {canOperate && m.status === "queued" && (
                    <button
                      className={s.button}
                      disabled={busy}
                      onClick={() =>
                        void run(
                          () => save("cancel_message", { messageId: m.id }),
                          "Pengiriman dibatalkan.",
                        )
                      }
                    >{t("Batalkan pengiriman")}</button>
                  )}
                </details>
              ))
            ) : (
              <p className={s.muted}>{t("Belum ada pengiriman.")}</p>
            )}
          </section>
          <section className={s.panel} id="work-activity" tabIndex={-1}>
            <h2>{t("Riwayat aktivitas")}</h2>
            {canSend && readyProposals.some(proposal => proposal.status === "sent") && (
              <p className={s.muted}>{t("Jika klien meminta perubahan, siapkan revisi proposal. Jika klien setuju, lanjutkan ke Serah terima. Jika masih menunggu kabar, jadwalkan tindak lanjut.")}</p>
            )}
            {canOperate && (
              <form
                className={s.form}
                onSubmit={(e) =>
                  submit(
                    e,
                    (f) => save("activity", { note: value(f, "note") }),
                    "Balasan tercatat. Tindak lanjut yang masih terjadwal dibatalkan.",
                  )
                }
              >
                <div className={s.field}>
                  <label htmlFor="reply-note">{t("Catat balasan klien")}</label>
                  <textarea id="reply-note" name="note" required maxLength={4000} rows={3} aria-describedby="reply-hint"
                    placeholder={t("Contoh: Ibu Rina meminta revisi menjadi 32 peserta. Kirim revisi pada Selasa. Keputusan menunggu persetujuan HR.")} />
                  <span id="reply-hint" className={s.muted}>{t("Ringkas keputusan, perubahan yang diminta, dan langkah berikutnya. Tindak lanjut email yang masih terjadwal akan dibatalkan.")}</span>
                </div>
                <button className={s.button} disabled={busy}>{t("Simpan balasan")}</button>
              </form>
            )}
            {!data.activities.length && <p className={s.compactEmpty}>{t("Belum ada aktivitas yang tercatat.")}</p>}
            <ol>
              {data.activities.map((a) => (
                <li className={s.event} key={a.id}>
                  <h3>{t(events[a.event_type] || "Aktivitas peluang")}</h3>
                  <time dateTime={a.created_at}>
                    {consultantDate(a.created_at)}
                    {directory.data?.members.find((m) => m.id === a.actor)?.name
                      ? ` · ${directory.data.members.find((m) => m.id === a.actor)?.name}`
                      : ""}
                  </time>
                  {a.note && <p>{a.note}</p>}
                </li>
              ))}
            </ol>
            <Pager
              translate={t}
              page={history}
              total={data.activityTotal}
              pageSize={30}
              onChange={setHistory}
            />
          </section>
        </>
      )}
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.action()}
        title={t(confirm?.title || "")}
        description={t(confirm?.description)}
        confirmLabel={t(confirm?.label)}
        cancelLabel={t("Batal")}
        variant="info"
      />
    </>
  );
}
