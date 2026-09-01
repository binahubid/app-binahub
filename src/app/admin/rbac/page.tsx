"use client";

import { ShieldCheck, ShieldX, User, Users, UserCog } from "lucide-react";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { ErrorBoundary } from "@/components/error-boundary";
import { AppShell } from "@/components/app-shell";

type Permission = {
  id: string;
  label: string;
  description: string;
  admin: boolean;
  facilitator: boolean;
  client: boolean;
};

const PERMISSIONS: Permission[] = [
  { id: "engagement:create", label: "Buat Program", description: "Membuat program baru", admin: true, facilitator: false, client: false },
  { id: "engagement:read", label: "Lihat Program", description: "Melihat daftar dan detail program", admin: true, facilitator: true, client: true },
  { id: "engagement:update", label: "Ubah Program", description: "Mengubah status dan data program", admin: true, facilitator: false, client: false },
  { id: "engagement:delete", label: "Hapus Program", description: "Menghapus program", admin: true, facilitator: false, client: false },
  { id: "evidence:create", label: "Buat Catatan", description: "Menambahkan catatan baru", admin: true, facilitator: true, client: true },
  { id: "evidence:read", label: "Lihat Catatan", description: "Melihat daftar catatan", admin: true, facilitator: true, client: true },
  { id: "evidence:update", label: "Ubah Catatan", description: "Mengubah kategori dan isi catatan", admin: true, facilitator: true, client: true },
  { id: "evidence:delete", label: "Hapus Catatan", description: "Menghapus catatan", admin: true, facilitator: false, client: false },
  { id: "action:create", label: "Buat Tindakan", description: "Menambahkan tindakan baru", admin: true, facilitator: true, client: true },
  { id: "action:read", label: "Lihat Tindakan", description: "Melihat daftar tindakan", admin: true, facilitator: true, client: true },
  { id: "action:update", label: "Ubah Tindakan", description: "Mengubah status, progres, dan prioritas tindakan", admin: true, facilitator: true, client: true },
  { id: "action:delete", label: "Hapus Tindakan", description: "Menghapus tindakan", admin: true, facilitator: false, client: false },
  { id: "participant:read", label: "Lihat Partisipan", description: "Melihat data partisipan", admin: true, facilitator: true, client: false },
  { id: "participant:update", label: "Kelola Partisipan", description: "Menambah/menghapus partisipan", admin: true, facilitator: false, client: false },
  { id: "facilitator:read", label: "Lihat Fasilitator", description: "Melihat daftar fasilitator", admin: true, facilitator: false, client: false },
  { id: "facilitator:assign", label: "Atur Fasilitator", description: "Menugaskan fasilitator ke program", admin: true, facilitator: false, client: false },
  { id: "report:create", label: "Buat Laporan", description: "Membuat laporan program", admin: true, facilitator: true, client: false },
  { id: "report:read", label: "Lihat Laporan", description: "Melihat laporan", admin: true, facilitator: true, client: true },
  { id: "admin:access", label: "Akses Administrasi", description: "Mengakses ruang kerja administrator", admin: true, facilitator: false, client: false },
  { id: "rbac:view", label: "Lihat Izin Akses", description: "Melihat matriks izin ini", admin: true, facilitator: false, client: false },
];

const ROLE_CONFIG = {
  admin: { label: "Administrator", icon: <UserCog size={14} />, tone: "text-indigo-600" },
  facilitator: { label: "Fasilitator", icon: <Users size={14} />, tone: "text-amber-600" },
  client: { label: "Klien", icon: <User size={14} />, tone: "text-emerald-600" },
};

function RoleHeader({ role }: { role: keyof typeof ROLE_CONFIG }) {
  const c = ROLE_CONFIG[role];
  return (
    <th className={`px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] ${c.tone}`}>
      <div className="flex items-center justify-center gap-1.5">{c.icon} {c.label}</div>
    </th>
  );
}

export default function RBACPage() {
  const adminCount = PERMISSIONS.filter((p) => p.admin).length;
  const facilitatorCount = PERMISSIONS.filter((p) => p.facilitator).length;
  const clientCount = PERMISSIONS.filter((p) => p.client).length;

  return (
    <AdminAuthGate>
      <ErrorBoundary>
        <AppShell role="admin" title="Matriks Izin" eyebrow="Manajemen Akses">
        <div className="text-[#0B2C6B]">
          <div className="mx-auto max-w-5xl">
          <p className="text-sm leading-6 text-[#4A4C54]/70">
            Ringkasan ini membantu administrator memastikan setiap peran hanya melihat dan mengelola area kerja yang sesuai tanggung jawabnya.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {(["admin", "facilitator", "client"] as const).map((role) => {
              const count = role === "admin" ? adminCount : role === "facilitator" ? facilitatorCount : clientCount;
              const c = ROLE_CONFIG[role];
              return (
                <section key={role} className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
                  <div className={`flex items-center gap-2 ${c.tone}`}>{c.icon}<p className="text-[10px] font-bold uppercase tracking-[0.16em]">Peran {c.label}</p></div>
                  <p className="mt-3 text-3xl font-semibold">{count}<span className="ml-1 text-base font-normal text-[#4A4C54]/50">izin</span></p>
                  <p className="mt-1 text-xs text-[#4A4C54]/60">{role === "admin" ? "Akses penuh ke seluruh sistem." : role === "facilitator" ? "Fokus pada observasi, penilaian, dan laporan." : "Akses terbatas pada data milik sendiri."}</p>
                </section>
              );
            })}
          </div>

          <div className="mt-8 overflow-x-auto rounded-xl border border-[#0B2C6B]/10 bg-white shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]" tabIndex={0} aria-label="Matriks izin akses; geser secara horizontal pada layar kecil">
            <table className="min-w-[760px] w-full text-sm">
              <caption className="sr-only">Daftar izin untuk peran Admin, Fasilitator, dan Klien</caption>
              <thead>
                <tr className="border-b border-[#0B2C6B]/10">
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[#4A4C54]/50">Izin</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[#4A4C54]/50">Deskripsi</th>
                  <RoleHeader role="admin" />
                  <RoleHeader role="facilitator" />
                  <RoleHeader role="client" />
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((perm) => (
                  <tr key={perm.id} className="border-b border-[#0B2C6B]/5 last:border-0 hover:bg-[#F5F7FA]/50">
                    <th scope="row" className="px-3 py-3 text-left text-xs font-semibold text-[#0B2C6B]">{perm.label}</th>
                    <td className="px-3 py-3 text-xs text-[#4A4C54]/70">{perm.description}</td>
                    <PermissionCell allowed={perm.admin} />
                    <PermissionCell allowed={perm.facilitator} />
                    <PermissionCell allowed={perm.client} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
      </AppShell>
      </ErrorBoundary>
    </AdminAuthGate>
  );
}

function PermissionCell({ allowed }: { allowed: boolean }) {
  return (
    <td className={`px-3 py-3 text-center ${allowed ? "text-emerald-600" : "text-red-400"}`}>
      <span className="sr-only">{allowed ? "Diizinkan" : "Tidak diizinkan"}</span>
      {allowed ? <ShieldCheck size={16} className="mx-auto" aria-hidden="true" /> : <ShieldX size={16} className="mx-auto" aria-hidden="true" />}
    </td>
  );
}
