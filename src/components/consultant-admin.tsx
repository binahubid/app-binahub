"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AdminShell } from "@/components/admin-shell";
import { ConfirmDialog } from "@/components/ui";
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
  "Akses konsultan",
  "Penugasan",
  "Serah terima",
  "Materi",
] as const;
const endpoint = "/api/admin/consultants";

export function ConsultantAdmin() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Akses konsultan");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [status, setStatus] = useState("");
  const [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(0);
  const [invite, setInvite] = useState<{
    email: string;
    full_name: string;
  } | null>(null);
  const [revoke, setRevoke] = useState<Member | null>(null);
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
  const available =
    data.data?.accounts.filter(
      (a) => !members.some((m) => m.user_id === a.id && m.active),
    ) || [];

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
  function grant(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form),
      userId = String(f.get("account") || "");
    void run(async () => {
      await consultantRequest(endpoint, {
        action: "member",
        userId,
        name: f.get("displayName"),
        active: true,
      });
      form.reset();
    }, "Akses portal diaktifkan.");
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
      description="Kelola akses konsultan, bagi tanggung jawab, dan pantau serah terima ke tim pelaksanaan."
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
      {tab === "Akses konsultan" && (
        <div className={s.grid}>
          <section className={s.panel}>
            <h2>Anggota tim</h2>
            {!data.data && !data.error ? (
              <p role="status">Memuat anggota…</p>
            ) : !members.length ? (
              <p className={s.empty}>Belum ada konsultan yang terdaftar.</p>
            ) : (
              members.map((m) => (
                <div key={m.user_id} className={s.row}>
                  <div>
                    <h3>{m.display_name}</h3>
                    <p className={s.muted}>
                      {m.email} · {m.active ? "Aktif" : "Nonaktif"}
                    </p>
                  </div>
                  {m.active ? (
                    <button
                      className={s.button}
                      disabled={busy}
                      onClick={() => setRevoke(m)}
                    >
                      Nonaktifkan
                    </button>
                  ) : (
                    <button
                      className={s.button}
                      disabled={busy}
                      onClick={() =>
                        void run(
                          () =>
                            consultantRequest(endpoint, {
                              action: "member",
                              userId: m.user_id,
                              name: m.display_name,
                              active: true,
                            }),
                          "Akses diaktifkan kembali.",
                        )
                      }
                    >
                      Aktifkan
                    </button>
                  )}
                </div>
              ))
            )}
          </section>
          <div>
            <section className={s.panel}>
              <h2>Undang konsultan baru</h2>
              <p className={s.muted}>
                Undangan akun akan dikirim ke alamat kerja konsultan.
              </p>
              <form
                className={s.form}
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  setInvite({
                    email: String(f.get("email")),
                    full_name: String(f.get("name")),
                  });
                }}
              >
                <label className={s.field}>
                  Nama konsultan
                  <input name="name" required maxLength={200} />
                </label>
                <label className={s.field}>
                  Email kerja
                  <input name="email" type="email" required maxLength={254} />
                </label>
                <button className={s.primary} disabled={busy}>
                  Tinjau undangan
                </button>
              </form>
            </section>
            <section className={s.panel}>
              <h2>Beri akses ke akun yang sudah ada</h2>
              <p className={s.muted}>
                Fasilitator dapat memakai akun yang sama untuk membuka ruang
                konsultan.
              </p>
              {available.length ? (
                <form className={s.form} onSubmit={grant}>
                  <label className={s.field}>
                    Pilih akun
                    <select name="account" defaultValue="" required>
                      <option value="" disabled>
                        Pilih akun BinaHub
                      </option>
                      {available.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.full_name || a.id} ·{" "}
                          {a.role === "facilitator"
                            ? "Fasilitator"
                            : a.role === "admin"
                              ? "Admin"
                              : "Konsultan"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={s.field}>
                    Nama yang tampil pada email
                    <input name="displayName" required maxLength={200} />
                  </label>
                  <button className={s.button} disabled={busy}>
                    Aktifkan akses
                  </button>
                </form>
              ) : (
                <p className={s.muted}>
                  Tidak ada akun yang dapat ditambahkan.
                </p>
              )}
            </section>
          </div>
        </div>
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
      <ConfirmDialog
        open={!!invite}
        onClose={() => setInvite(null)}
        onConfirm={async () => {
          if (!invite) return;
          const payload = invite;
          setInvite(null);
          await run(
            () =>
              consultantRequest("/api/users", {
                ...payload,
                role: "consultant",
              }),
            `Undangan dikirim ke ${payload.email}.`,
          );
        }}
        title="Kirim undangan akun?"
        description={
          invite
            ? `${invite.full_name} akan menerima email untuk mengaktifkan akun konsultan di ${invite.email}.`
            : ""
        }
        confirmLabel="Kirim undangan"
        variant="info"
      />
      <ConfirmDialog
        open={!!revoke}
        onClose={() => setRevoke(null)}
        onConfirm={async () => {
          if (!revoke) return;
          const member = revoke;
          setRevoke(null);
          await run(
            () =>
              consultantRequest(endpoint, {
                action: "member",
                userId: member.user_id,
                name: member.display_name,
                active: false,
              }),
            "Akses konsultan dinonaktifkan.",
          );
        }}
        title="Nonaktifkan akses konsultan?"
        description={
          revoke
            ? `Akses ${revoke.display_name} akan ditutup. Tinjau kembali penugasannya dan email yang masih terjadwal.`
            : ""
        }
        confirmLabel="Nonaktifkan"
        variant="warning"
      />
    </AdminShell>
  );
}
