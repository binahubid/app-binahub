"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Download,
  FileText,
  RefreshCw,
} from "lucide-react";
import {
  consultantDate,
  consultantRequest,
  downloadConsultantFile,
  stageLabels,
  type Booking,
  type ConsultantList,
  type ConsultantMember,
  type Task,
} from "@/lib/consultant-client";
import { consultantMaterials } from "@/lib/consultant-materials";
import s from "./consultant.module.css";

export function useConsultantData<T>(url: string | null) {
  const [state, setState] = useState<{
    url: string;
    data?: T;
    error?: string;
  }>();
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    void consultantRequest<T>(url, undefined, "GET", controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ url, data });
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setState({
            url,
            error: e instanceof Error ? e.message : "Data belum tersedia.",
          });
      });
    return () => controller.abort();
  }, [url, revision]);
  return {
    ...(state?.url === url ? state : {}),
    reload: () => setRevision((v) => v + 1),
  };
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
  return (
    <label className={s.field}>
      Penanggung jawab
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="all">Semua</option>
        <option value="mine">Tanggung jawab saya</option>
        <option value="unassigned">Belum ditugaskan</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
            {m.active ? "" : " · nonaktif"}
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
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (v: number) => void;
}) {
  if (total <= pageSize && page === 0) return null;
  return (
    <nav aria-label="Halaman hasil" className={s.pager}>
      <button
        className={s.button}
        disabled={!page}
        onClick={() => onChange(page - 1)}
      >
        Sebelumnya
      </button>
      <span>
        {total
          ? `${Math.min(page * pageSize + 1, total)}–${Math.min((page + 1) * pageSize, total)} dari ${total}`
          : "0 hasil"}
      </span>
      <button
        className={s.button}
        disabled={(page + 1) * pageSize >= total}
        onClick={() => onChange(page + 1)}
      >
        Berikutnya
      </button>
    </nav>
  );
}

export function AgendaRows({ records }: { records: (Task | Booking)[] }) {
  if (!records.length)
    return <p className={s.empty}>Belum ada agenda pada pilihan ini.</p>;
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
                    {r.title || "Konsultasi klien"}
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
  const [owner, setOwner] = useState("all"),
    [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(0),
    [view, setView] = useState("all");
  const { data, error, reload } = useConsultantData<ConsultantList>(
    "/api/konsultan?" +
      new URLSearchParams({ owner, search: query, page: String(page), view }),
  );
  return (
    <>
      <ConsultantHeading
        title={clients ? "Klien & peluang" : "Beranda konsultan"}
        description={
          clients
            ? "Lihat tahap, jadwal, dan penanggung jawab setiap peluang konsultasi."
            : "Pantau pekerjaan dan agenda konsultasi seluruh tim."
        }
      >
        <button type="button" className={s.button} onClick={reload}>
          <RefreshCw size={16} aria-hidden="true" />
          Perbarui
        </button>
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
          <label className={`${s.field} ${s.search}`}>
            Cari klien
            <input
              type="search"
              maxLength={150}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nama, perusahaan, atau email"
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
            <label className={s.field}>
              Tahap
              <select
                value={view}
                onChange={(e) => {
                  setView(e.target.value);
                  setPage(0);
                }}
              >
                <option value="all">Semua tahap</option>
                <option value="active">Peluang terbuka</option>
                <option value="won">Disepakati</option>
                <option value="lost">Tidak dilanjutkan</option>
                <option value="handoff">Serah terima</option>
              </select>
            </label>
            <button className={s.primary}>Cari</button>
          </>
        )}
      </form>
      {error && (
        <p role="alert" className={s.error}>
          {error}
        </p>
      )}
      {!error && !data && <p role="status">Memuat pekerjaan tim…</p>}
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
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}
          <div className={clients ? undefined : s.grid}>
            <section className={s.panel}>
              <h2>{clients ? "Daftar peluang" : "Peluang tim"}</h2>
              {data.records.length ? (
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Klien</th>
                      <th>Tahap</th>
                      <th>Penanggung jawab</th>
                      <th>Akses</th>
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
                            <span className={s.mobileLabel}>Tahap</span>
                            {stageLabels[r.stage] || r.stage}
                          </td>
                          <td>
                            <span className={s.mobileLabel}>
                              Penanggung jawab
                            </span>
                            {r.assigneeName}
                          </td>
                          <td>
                            <span
                              className={`${s.badge} ${r.canEdit ? "" : s.readonly}`}
                            >
                              {r.canEdit ? "Dapat dikelola" : "Hanya baca"}
                            </span>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              ) : (
                <p className={s.empty}>Belum ada peluang yang cocok.</p>
              )}
              {clients ? (
                <Pager
                  page={page}
                  pageSize={data.pageSize}
                  total={data.total}
                  onChange={setPage}
                />
              ) : (
                <Link className={s.textlink} href="/konsultan/clients">
                  Lihat semua peluang{" "}
                  <ArrowRight size={14} className="inline" />
                </Link>
              )}
            </section>
            {!clients && (
              <div>
                <section className={s.panel}>
                  <h2>Tugas terdekat</h2>
                  <AgendaRows records={data.tasks.slice(0, 4)} />
                  <Link className={s.textlink} href="/konsultan/tasks">
                    Buka tugas & jadwal
                  </Link>
                </section>
                <section className={s.panel}>
                  <h2>Jadwal konsultasi</h2>
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
  const [owner, setOwner] = useState("all"),
    [kind, setKind] = useState("tasks"),
    [page, setPage] = useState(0);
  const directory = useConsultantData<ConsultantList>("/api/konsultan");
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
        title="Tugas & jadwal"
        description="Lihat agenda seluruh tim. Buka peluang untuk mengelola tugas yang menjadi tanggung jawab Anda."
      >
        <button className={s.button} onClick={reload}>
          <RefreshCw size={16} aria-hidden="true" />
          Perbarui
        </button>
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
          Tampilkan
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              setPage(0);
            }}
          >
            <option value="tasks">Tugas terbuka</option>
            <option value="bookings">Jadwal konsultasi</option>
          </select>
        </label>
      </div>
      <section className={s.panel}>
        <h2>
          <CalendarDays size={18} className="mr-2 inline" aria-hidden="true" />
          {kind === "tasks" ? "Tugas terbuka" : "Jadwal konsultasi"}
        </h2>
        {error ? (
          <p role="alert" className={s.error}>
            {error}
          </p>
        ) : data ? (
          <>
            <AgendaRows records={data.records} />
            <Pager
              page={page}
              total={data.total}
              pageSize={data.pageSize}
              onChange={setPage}
            />
          </>
        ) : (
          <p role="status">Memuat agenda…</p>
        )}
      </section>
    </>
  );
}

export function ConsultantMaterials() {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState("");
  async function download(slug: string) {
    setBusy(slug);
    setError("");
    try {
      await downloadConsultantFile(
        `/api/konsultan/materials/${slug}`,
        `BinaHub-${slug}.pdf`,
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
        title="Materi konsultan"
        description="Dokumen untuk mempersiapkan konsultasi dan menjelaskan produk BinaHub."
      />
      {error && (
        <p role="alert" className={s.error}>
          {error}
        </p>
      )}
      <section className={s.panel}>
        {consultantMaterials.map((m) => (
          <div className={s.row} key={m.slug}>
            <div>
              <h3>
                <FileText
                  size={16}
                  aria-hidden="true"
                  className="mr-2 inline"
                />
                {m.title}
              </h3>
              <p className={s.muted}>{m.description}</p>
            </div>
            <div className={s.actions}>
              <Link className={s.primary} href={`/konsultan/materials/${m.slug}`}
                aria-label={`Baca ${m.title} di web`}>
                <BookOpen size={16} aria-hidden="true" /> Baca di web
              </Link>
              <button
                type="button"
                className={s.button}
                aria-label={`Unduh PDF ${m.title}`}
                disabled={!!busy}
                onClick={() => void download(m.slug)}
              >
                <Download size={16} aria-hidden="true" />
                {busy === m.slug ? "Memuat…" : "Unduh PDF"}
              </button>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
