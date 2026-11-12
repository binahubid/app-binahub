"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { apiFetch } from "@/lib/api-fetch";
import {
  consultantDate,
  consultantRequest,
  type ConsultantList,
} from "@/lib/consultant-client";
import { Pager, useConsultantData } from "./consultant-overview";
import s from "./consultant.module.css";

type Member = {
  user_id: string;
  display_name: string;
  email: string;
  active: boolean;
  ams_status?: string | null;
  agreement_accepted_at?: string | null;
};
type AdminData = {
  members: Member[];
  accounts: { id: string; full_name: string; role: string }[];
  bookings: {
    id: string;
    title: string;
    attendee_name: string;
    attendee_email: string;
    start_time: string;
  }[];
};
const tabs = [
  "Keanggotaan",
  "Penugasan",
  "Serah terima",
  "Materi",
] as const;
const endpoint = "/api/admin/consultants";

export function ConsultantAdmin() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Keanggotaan");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [status, setStatus] = useState("");
  const [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(0);
  const data = useConsultantData<AdminData>(endpoint);
  const leads = useConsultantData<ConsultantList>(
    "/api/konsultan?" +
      new URLSearchParams({
        search: query,
        page: String(page),
        view: tab === "Serah terima" ? "handoff" : "all",
      }),
  );
  const members = data.data?.members || [];
  async function run(action: () => Promise<unknown>, feedback: string) {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await action();
      data.reload();
      leads.reload();
      setStatus(feedback);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Perubahan belum tersimpan.");
    } finally {
      setBusy(false);
    }
  }
  function upload(e: FormEvent<HTMLFormElement>, slug: string) {
    e.preventDefault();
    const form = e.currentTarget,
      file = new FormData(form).get("pdf");
    if (!(file instanceof File) || !file.size || file.size > 4_000_000) {
      setError("Pilih PDF dengan ukuran maksimal 4 MB.");
      return;
    }
    void run(async () => {
      const response = await apiFetch(`/api/konsultan/materials/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || "Unggahan belum tersimpan.");
      }
      form.reset();
    }, "PDF tersedia di menu Materi konsultan.");
  }

  return (
    <AdminShell
      eyebrow="Akuisisi & Penjualan"
      title="Tim Konsultan"
      description="Bagi tanggung jawab klien, pantau pekerjaan konsultasi, dan lanjutkan serah terima ke tim pelaksanaan."
      actions={
        <Link href="/konsultan" className={s.primary}>
          Buka Portal Konsultan
        </Link>
      }
    >
      <nav aria-label="Pengelolaan tim konsultan" className={s.tabs}>
        {tabs.map((t) => (
          <button
            key={t}
            aria-current={tab === t ? "page" : undefined}
            type="button"
            onClick={() => {
              setTab(t);
              setPage(0);
              setQuery("");
              setSearch("");
              setError("");
              setStatus("");
            }}
          >
            {t}
          </button>
        ))}
      </nav>
      {(error || data.error || leads.error) && (
        <p className={s.error} role="alert">
          {error || data.error || leads.error}
        </p>
      )}
      {status && (
        <p className={s.success} role="status">
          {status}
        </p>
      )}
      {tab === "Keanggotaan" && (
        <section className={s.panel}>
          <div className={s.heading}>
            <div>
              <h2>Keanggotaan dari AMS</h2>
              <p className={s.muted}>Undangan, perjanjian, dan status keanggotaan dikelola di AMS. Penugasan klien tetap dikelola di halaman ini.</p>
            </div>
            <a href="https://ams.binahub.id/admin/consultant-team" target="_blank" rel="noopener noreferrer" className={s.button}>Kelola keanggotaan di AMS <ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
          {!data.data && !data.error ? <p role="status">Memuat anggota…</p> : !members.length ? (
            <p className={s.empty}>Belum ada keanggotaan yang terhubung. Undang associate dari Tim Konsultan di AMS.</p>
          ) : members.map((m) => (
            <div key={m.user_id} className={s.row}>
              <div><h3>{m.display_name}</h3><p className={s.muted}>{m.email}</p>
                {m.agreement_accepted_at && <p className={s.muted}>Persetujuan diterima {consultantDate(m.agreement_accepted_at)}</p>}
              </div>
              <span className={s.muted}>{!m.ams_status ? "Perlu keanggotaan AMS" : m.active ? "Aktif" : m.ams_status === "paused" ? "Dijeda" : m.ams_status === "ended" ? "Keanggotaan berakhir" : "Belum aktif"}</span>
            </div>
          ))}
        </section>
      )}
      {(tab === "Penugasan" || tab === "Serah terima") && (
        <section className={s.panel}>
          <h2>
            {tab === "Penugasan"
              ? "Peluang konsultasi"
              : "Serah terima yang tercatat"}
          </h2>
          <form
            className={s.filters}
            onSubmit={(e) => {
              e.preventDefault();
              setPage(0);
              setQuery(search);
            }}
          >
            <label className={`${s.field} ${s.search}`}>
              Cari klien
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                maxLength={150}
                placeholder="Nama atau perusahaan"
              />
            </label>
            <button className={s.button}>Cari</button>
          </form>
          {leads.data ? (
            <>
              {leads.data.records.length ? (
                leads.data.records.map((r) => (
                  <div key={r.id} className={s.row}>
                    <div>
                      <h3>{r.company || r.name}</h3>
                      <p className={s.muted}>
                        {r.assigneeName}
                        {r.handoff
                          ? ` · ${consultantDate(r.handoff.requestedAt)}`
                          : ""}
                      </p>
                      {r.handoff && <p>{r.handoff.note}</p>}
                    </div>
                    <Link
                      className={s.button}
                      href={`/konsultan/clients/${r.id}`}
                    >
                      {tab === "Serah terima"
                        ? "Lihat detail"
                        : "Kelola penugasan"}
                    </Link>
                  </div>
                ))
              ) : (
                <p className={s.empty}>Belum ada data pada pilihan ini.</p>
              )}
              <Pager
                page={page}
                pageSize={leads.data.pageSize}
                total={leads.data.total}
                onChange={setPage}
              />
            </>
          ) : (
            !leads.error && <p role="status">Memuat peluang…</p>
          )}
        </section>
      )}
      {tab === "Penugasan" && !!data.data?.bookings.length && (
        <section className={s.panel}>
          <h2>Booking yang belum terhubung</h2>
          <p className={s.muted}>
            Cari peluang yang sesuai pada daftar di atas, lalu hubungkan booking
            ke peluang tersebut.
          </p>
          {data.data.bookings.map((b) => (
            <form
              key={b.id}
              className={`${s.row} flex-wrap`}
              onSubmit={(e) => {
                e.preventDefault();
                const leadId = new FormData(e.currentTarget).get("leadId");
                void run(
                  () =>
                    consultantRequest(endpoint, {
                      action: "booking",
                      bookingId: b.id,
                      leadId,
                    }),
                  "Booking terhubung ke peluang.",
                );
              }}
            >
              <div>
                <h3>{b.title || "Konsultasi klien"}</h3>
                <p className={s.muted}>
                  {b.attendee_name} · {b.attendee_email} ·{" "}
                  {consultantDate(b.start_time)}
                </p>
              </div>
              <label className={s.field}>
                Peluang klien
                <select name="leadId" required defaultValue="">
                  <option value="" disabled>
                    Pilih peluang
                  </option>
                  {leads.data?.records.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.company || r.name} · {r.email}
                    </option>
                  ))}
                </select>
              </label>
              <button className={s.button} disabled={busy}>
                Hubungkan booking
              </button>
            </form>
          ))}
        </section>
      )}
      {tab === "Materi" && (
        <div className={s.grid}>
          {[
            { slug: "company-profile", title: "Company Profile BinaHub" },
            { slug: "product-knowledge", title: "Product Knowledge BinaHub" },
          ].map((m) => (
            <section key={m.slug} className={s.panel}>
              <h2>{m.title}</h2>
              <p className={s.muted}>
                Unggahan menggantikan PDF yang tersedia bagi konsultan.
              </p>
              <form className={s.form} onSubmit={(e) => upload(e, m.slug)}>
                <label className={s.field}>
                  Pilih PDF (maks. 4 MB)
                  <input
                    type="file"
                    name="pdf"
                    accept="application/pdf,.pdf"
                    required
                  />
                </label>
                <button className={s.primary} disabled={busy}>
                  Simpan PDF
                </button>
              </form>
            </section>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
