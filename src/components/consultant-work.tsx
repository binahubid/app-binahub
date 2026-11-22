"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { ConfirmDialog } from "@/components/ui";
import { SpinMeetingChecklist } from "@/app/admin/_components/spin-meeting-checklist";
import type { MeetingChecklist } from "@/app/admin/_lib/spin-meeting";
import {
  consultantDate,
  consultantMoney,
  consultantRequest,
  downloadConsultantFile,
  messageLabels,
  stageLabels,
  type ConsultantDetail,
  type ConsultantList,
  type Proposal,
} from "@/lib/consultant-client";
import {
  AgendaRows,
  ConsultantHeading,
  Pager,
} from "./consultant-overview";
import { ConsultantPending, consultantDirectoryUrl, useConsultantData } from "./consultant-data";
import { useConsultant } from "./consultant-shell";
import { ConsultantContext } from "./consultant-context";
import s from "./consultant.module.css";
import { useConsultantLocale } from "@/components/consultant-language";

const sections = [
  "Ringkasan",
  "Kebutuhan & meeting",
  "Proposal",
  "Tindak lanjut",
] as const;
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
  const [section, setSection] =
    useState<(typeof sections)[number]>("Ringkasan");
  const [history, setHistory] = useState(0),
    [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
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
  const work = useConsultantData<ConsultantDetail>(
    `${endpoint}?page=${history}`,
  );
  const directory = useConsultantData<ConsultantList>(consultantDirectoryUrl);
  const session = useConsultant();
  const assignees = useConsultantData<{ members: { id: string; name: string }[] }>(
    session.isAdmin ? "/api/admin/consultants?view=assignees" : null,
  );
  const eligibleMembers = assignees.data?.members ?? [];
  const [checklistKey, setChecklistKey] = useState(0);
  const [savedChecklist, setSavedChecklist] = useState<MeetingChecklist | null>(
    null,
  );
  const onSaved = useCallback(
    (result: MeetingChecklist) => setSavedChecklist(result),
    [],
  );
  const data = work.data;
  const version = Math.max(
    data?.record.version ?? 0,
    savedChecklist?.revision ?? 0,
  );

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
      if (refresh) work.reload();
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
  function move(next: (typeof sections)[number]) {
    if (next === section || busy || dirty) return;
    if (section === "Kebutuhan & meeting") work.reload();
    setSection(next);
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
  function reviewEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form);
    const kind = value(f, "kind"),
      proposalId = value(f, "proposalId") || null,
      subject = value(f, "subject"),
      body = value(f, "body"),
      when = value(f, "when");
    if (kind === "proposal" && !proposalId) {
      setError("Pilih revisi proposal yang akan dilampirkan.");
      return;
    }
    const key = JSON.stringify([
      kind,
      proposalId,
      subject,
      body,
      when,
      version,
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
      description: t("Tujuan {0}. Pengirim {1}. {2}{3}", [
        data?.record.email,
        data?.record.assigneeName,
        proposal ? t("Lampiran proposal revisi {0}.", [proposal.revision]) + " " : "",
        when ? t("Jadwal {0}.", [consultantDate(request.at)]) : t("Worker akan memprosesnya pada giliran berikutnya."),
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
            scheduledAt: request.at,
          });
          form.reset();
          messageRequest.current = null;
        }, "Email masuk antrean. Pantau statusnya di riwayat pengiriman.");
      },
    });
  }

  if (!data)
    return (
      <>
        <Link className={s.back} href="/konsultan/clients">
          <ArrowLeft size={16} />{t("Klien & peluang")}</Link>
        {work.error ? (
          <div className={s.error} role="alert">
            {t(work.error)}{" "}
            <button className={s.button} onClick={work.reload}>{t("Coba lagi")}</button>
          </div>
        ) : (
          <ConsultantPending message="Memuat peluang…" />
        )}
      </>
    );
  const r = data.record,
    canEdit = r.canEdit && (data.workspace !== null || session.isAdmin);
  const canOperate = canEdit && data.workspace !== null;
  const canSend =
    canOperate && !!r.assigneeId && !["won", "lost"].includes(r.stage);
  const programs = (directory.data?.catalog || []).filter(
    (program) =>
      program.code !== "SS-27" || data.proposalDefaults?.spiritualOptIn,
  );
  const readyProposals = data.proposals.filter(
    (p) => p.checklist_revision === data.workspace?.checklist_revision,
  );
  const handoff = r.handoff;

  return (
    <>
      <Link className={s.back} href="/konsultan/clients">
        <ArrowLeft size={16} aria-hidden="true" />{t("Klien & peluang")}</Link>
      <ConsultantHeading
        title={r.company || r.name}
        description={[r.name, r.assigneeName]
          .filter(Boolean)
          .join(" · ")}
      >
        <span className={`${s.badge} ${canOperate ? "" : s.readonly}`}>
          {canOperate ? t("Dapat dikelola") : t("Hanya baca")}
        </span>
        <button
          className={s.button}
          disabled={dirty || busy}
          onClick={work.reload}
        >{t("Perbarui")}</button>
      </ConsultantHeading>
      <ConsultantContext record={r} />
      {!canOperate && (
        <p className={s.notice}>
          {r.assigneeId
            ? t("Pekerjaan ini dikelola oleh {0}. Anda dapat membaca kebutuhan, proposal, tugas, dan riwayatnya.", [r.assigneeName])
            : t("Admin dapat menugaskan konsultan untuk mulai mengelola peluang ini.")}
        </p>
      )}
      <nav aria-label={t("Detail peluang")} className={s.tabs}>
        {sections.map((tab) => (
          <button
            key={tab}
            type="button"
            aria-current={section === tab ? "page" : undefined}
            disabled={section !== tab && (dirty || busy)}
            onClick={() => move(tab)}
          >
            {t(tab)}
          </button>
        ))}
      </nav>
      {error && (
        <p className={s.error} role="alert">
          {t(error)}
        </p>
      )}
      {message && (
        <p className={s.success} role="status">
          {t(message)}
        </p>
      )}
      {section === "Ringkasan" && (
        <>
          <div className={s.grid}>
            <section className={s.panel}>
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
                <div>
                  <dt className={s.muted}>{t("Langkah berikutnya")}</dt>
                  <dd>{r.nextAction || t("Belum dicatat")}</dd>
                </div>
              </dl>
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
            <section className={s.panel}>
              <h2>{t("Jadwal konsultasi")}</h2>
              <AgendaRows records={data.bookings} />
              {data.bookings.map((b) => {
                const url = b.meetingUrl;
                return url?.startsWith("https://") &&
                  ["confirmed", "rescheduled"].includes(b.status) ? (
                  <p key={b.id}>
                    <a
                      className={s.textlink}
                      href={url}
                      rel="noreferrer"
                      target="_blank"
                    >{t("Buka meeting ·")} {consultantDate(b.startTime)}
                    </a>
                  </p>
                ) : null;
              })}
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
            <section className={s.panel}>
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
          <section className={s.panel}>
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
            {canOperate &&
              readyProposals.some((p) => p.status === "sent") &&
              !handoff && (
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
                  <label className={s.field}>{t("Kesepakatan klien dan arahan pelaksanaan")}<textarea name="note" required maxLength={4000} rows={3} />
                  </label>
                  <button className={s.primary} disabled={busy}>{t("Tinjau serah terima")}</button>
                </form>
              )}
          </section>
        </>
      )}
      {section === "Kebutuhan & meeting" && (
        <section className={s.panel}>
          <h2>{t("Kebutuhan & meeting")}</h2>
          {canOperate &&
            data.sources.length > 0 &&
            !data.workspace?.source_id && (
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
        </section>
      )}
      {section === "Proposal" && (
        <>
          <section className={s.panel}>
            <h2>{t("Riwayat proposal")}</h2>
            {data.proposals.length ? (
              data.proposals.map((p) => (
                <details className={s.details} key={p.id}>
                  <summary>
                    {t("Revisi {0}", [p.revision])} ·{" "}
                    {t(p.status === "sent" ? "Terkirim" : "Draf")} ·{" "}
                    {consultantMoney(p.snapshot.total)}
                  </summary>
                  <p>
                    {consultantDate(p.created_at)} · {p.snapshot.days} {t("hari ·")}{" "}
                    {p.snapshot.participants} {t("peserta ·")} {p.snapshot.venue}
                    {p.snapshot.location && ` · ${p.snapshot.location}`}
                  </p>
                  <ul className={s.list}>
                    {p.snapshot.programs.map((program) => (
                      <li key={program.code}>
                        {program.name} · {consultantMoney(program.total)}
                      </li>
                    ))}
                  </ul>
                  <p>{p.snapshot.priceNote}</p>
                  <button
                    className={s.button}
                    disabled={busy}
                    onClick={() => download(p)}
                  >
                    <Download size={16} aria-hidden="true" />{t("Unduh PDF")}</button>
                </details>
              ))
            ) : (
              <p className={s.empty}>{t("Belum ada proposal untuk peluang ini.")}</p>
            )}
          </section>
          {canOperate && (
            <section className={s.panel}>
              <h2>{t("Susun proposal")}</h2>
              <p className={s.muted}>{t("Pilih program, durasi, jumlah peserta, dan lokasi. Ringkasan kebutuhan diambil dari checklist konsultasi.")}</p>
              {(savedChecklist?.status || r.checklistStatus) !== "completed" ? (
                <p className={s.notice}>{t("Selesaikan checklist kebutuhan terlebih dahulu.")}</p>
              ) : (
                <form
                  className={s.form}
                  onSubmit={(e) =>
                    submit(
                      e,
                      (f) =>
                        consultantRequest(`${endpoint}/proposals`, {
                          version,
                          programCodes: f.getAll("programs"),
                          days: Number(f.get("days")),
                          participants: Number(f.get("participants")),
                          venue: value(f, "venue"),
                          location: value(f, "location"),
                          scopeNote: value(f, "scope"),
                        }),
                      "Draf proposal tersimpan. Tinjau PDF sebelum mengirim.",
                    )
                  }
                >
                  <fieldset>
                    <legend className="mb-2 font-semibold">{t("Program yang dipilih")}</legend>
                    <div className={s.catalog}>
                      {programs.map((p) => (
                        <label key={p.code}>
                          <input
                            type="checkbox"
                            name="programs"
                            value={p.code}
                          />
                          <span>
                            <strong>{p.name}</strong>
                            <br />
                            <span className={s.muted}>
                              {p.code} ·{" "}
                              {p.dailyRateIdr
                                ? t("{0} / hari", [consultantMoney(p.dailyRateIdr)])
                                : t("Tarif dikonfirmasi")}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className={s.two}>
                    <label className={s.field}>{t("Durasi (hari)")}<input
                        name="days"
                        type="number"
                        min={1}
                        max={365}
                        defaultValue={data.proposalDefaults?.days}
                        required
                      />
                    </label>
                    <label className={s.field}>{t("Jumlah peserta")}<input
                        name="participants"
                        type="number"
                        min={1}
                        max={100000}
                        defaultValue={data.proposalDefaults?.participants}
                        required
                      />
                    </label>
                  </div>
                  <div className={s.two}>
                    <label className={s.field}>
                      Format
                      <select
                        name="venue"
                        defaultValue={data.proposalDefaults?.venue || ""}
                        required
                      >
                        <option value="" disabled>{t("Pilih format")}</option>
                        <option value="indoor">Indoor</option>
                        <option value="outdoor">Outdoor</option>
                        <option value="hybrid">Indoor & outdoor</option>
                        <option value="online">Online</option>
                      </select>
                    </label>
                    <label className={s.field}>{t("Lokasi")}<input
                        name="location"
                        maxLength={300}
                        defaultValue={data.proposalDefaults?.location}
                        placeholder={t("Kota atau tempat pelaksanaan")}
                      />
                    </label>
                  </div>
                  <label className={s.field}>{t("Ruang lingkup untuk klien")}<textarea name="scope" rows={3} maxLength={4000} />
                  </label>
                  <button
                    className={s.primary}
                    disabled={busy || !programs.length}
                  >{t("Buat draf proposal")}</button>
                </form>
              )}
            </section>
          )}
        </>
      )}
      {section === "Tindak lanjut" && (
        <>
          <section className={s.panel}>
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
            <section className={s.panel}>
              <h2>{t("Siapkan email")}</h2>
              <p className={s.muted}>{t("Kepada")} {r.email} {t("· Atas nama")} {r.assigneeName}
              </p>
              <form className={s.form} onSubmit={reviewEmail}>
                <div className={s.two}>
                  <label className={s.field}>{t("Jenis email")}<select name="kind">
                      <option value="follow_up">{t("Tindak lanjut")}</option>
                      <option value="proposal">{t("Pengiriman proposal")}</option>
                    </select>
                  </label>
                  <label className={s.field}>{t("Lampiran proposal")}<select name="proposalId">
                      <option value="">{t("Tanpa lampiran")}</option>
                      {readyProposals.map((p) => (
                        <option key={p.id} value={p.id}>
                          {t("Revisi {0}", [p.revision])} · {consultantDate(p.created_at)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className={s.field}>
                  {t("Subjek")}
                  <input name="subject" maxLength={180} required />
                </label>
                <label className={s.field}>{t("Isi pesan")}<textarea name="body" rows={6} maxLength={10000} required />
                </label>
                <label className={s.field}>{t("Jadwal kirim (waktu perangkat)")}<input name="when" type="datetime-local" />
                  <span className={s.muted}>{t("Kosongkan untuk diproses pada giliran worker berikutnya.")}</span>
                </label>
                <button className={s.primary} disabled={busy}>{t("Tinjau pengiriman")}</button>
              </form>
            </section>
          )}
          <section className={s.panel}>
            <h2>{t("Riwayat pengiriman")}</h2>
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
                  <p>{m.envelope.body}</p>
                  {m.status === "uncertain" && (
                    <p>{t("Periksa status pada penyedia email sebelum mengirim ulang.")}</p>
                  )}
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
          <section className={s.panel}>
            <h2>{t("Riwayat aktivitas")}</h2>
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
                <label className={s.field}>{t("Catat balasan klien")}<textarea name="note" required maxLength={4000} rows={3} />
                </label>
                <p className={s.muted}>{t("Tindak lanjut terjadwal dibatalkan agar tim dapat meninjau balasan ini terlebih dahulu.")}</p>
                <button className={s.button} disabled={busy}>{t("Simpan balasan")}</button>
              </form>
            )}
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
