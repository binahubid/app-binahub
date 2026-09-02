# Audit UI/UX Production — Workspace Administrator

Tanggal: 2 September 2026  
Versi kandidat: `app-binahub v0.18.1`

## Tujuan

Audit Fase 16 memastikan administrator memiliki satu struktur navigasi berbasis URL, satu bahasa visual, dan satu pola interaksi. Pengguna tidak lagi harus memilih antara dashboard tab di `/admin` dan halaman terpisah di `/admin/*`.

## Keputusan arsitektur

- `/admin/dashboard` menjadi beranda kanonis; `/admin` hanya redirect kompatibilitas.
- Setiap area kerja utama memiliki URL sendiri dan dapat dipulihkan setelah refresh.
- Semua halaman administrator memakai `AdminShell` dan sumber navigasi di `src/lib/admin-navigation.ts`.
- `/home` hanya menyelesaikan role lalu mengarahkan pengguna ke beranda role; tidak ada hub kedua yang mengulang menu.
- Launch Control, UAT/Pilot Gate, Pilot Operations, Operational Assurance, dan Pilot Certification bukan menu produk. Evidence dan prosedurnya tetap berada di backend serta dokumen developer.
- T-BOS memakai shell global yang sama, sementara grafik, tabel, warna, dan workflow internalnya tidak didesain ulang.

Peta URL lengkap tersedia di `ADMIN-INFORMATION-ARCHITECTURE.md`.

## Cakupan halaman admin

| Area | Rute | Status kode |
| --- | --- | --- |
| Ringkasan | `/admin/dashboard` | Siap |
| Akuisisi | `/admin/acquisition` | Siap |
| Pipeline | `/admin/pipeline` | Siap |
| Assessment | `/admin/assessments` | Siap |
| Konsultasi | `/admin/meetings` | Siap |
| Kontak | `/admin/contacts` | Siap |
| Inquiry | `/admin/inquiries` | Siap |
| Klien & delivery | `/admin/clients` | Siap |
| Operasional | `/admin/operations` | Siap |
| Otomasi | `/admin/automation` | Siap |
| Program | `/admin/programs` dan detail `/admin/engagements/*` | Siap |
| Katalog | `/admin/catalog` | Siap |
| Pre-test/Post-test | `/admin/programs/tests` | Siap |
| Evaluasi program | `/admin/lep` | Siap |
| Pengguna | `/admin/users` | Siap |
| Izin akses | `/admin/rbac` | Siap |
| Pengaturan bisnis | `/admin/settings` | Siap |
| T-BOS | `/admin/tbos` | Shell terpadu; konten modul dipertahankan |

## Hasil visual dan interaksi

### Desktop

- Sidebar 288 px mempunyai kelompok accordion, pencarian menu, penanda halaman aktif, dan scroll independen.
- Header sticky hanya menampilkan breadcrumb dan aksi kontekstual; judul utama tidak digandakan.
- Lebar konten dibatasi 1680 px agar tabel dan board tetap lega pada layar besar.
- Bahasa visual memakai navy, slate, dan gold secara fungsional dengan border serta shadow halus.

### Mobile

- Sidebar berubah menjadi drawer modal yang dapat digulir.
- Drawer mengunci scroll latar, menahan fokus, dapat ditutup melalui Escape, dan mengembalikan fokus ke tombol pembuka.
- Konten tidak memiliki horizontal overflow pada viewport 390 × 844.
- Tombol utama dan kontrol navigasi memenuhi target sentuh minimum 44 px.

### Aksesibilitas dan state

- Skip link menuju konten utama tersedia.
- Focus indicator terlihat pada keyboard navigation.
- Loading, error, dan not-found memiliki state khusus administrator.
- `aria-current`, `aria-expanded`, `aria-controls`, dialog semantics, dan label kontrol digunakan pada navigasi.
- Preferensi reduced motion tetap dihormati secara global.

## Verifikasi

- ESLint: lulus.
- TypeScript: lulus.
- Vitest: 14 file, 60 tes lulus.
- Production build Next.js: lulus; 80 halaman statis dihasilkan.
- Browser desktop: tidak ada horizontal overflow.
- Browser mobile 390 × 844: tidak ada horizontal overflow.
- Drawer keyboard: focus trap, Escape, body scroll lock, dan focus return lulus.

## Acceptance setelah deployment

Pemeriksaan berikut memerlukan sesi administrator production dan belum boleh dianggap lulus hanya dari build lokal:

1. buka seluruh 18 menu admin dari sidebar dan pencarian;
2. refresh URL detail program/klien dan pastikan konteks tidak hilang;
3. jalankan satu create/edit/confirm/destructive flow per modul yang memiliki mutasi;
4. uji empty state dan error state menggunakan data production yang aman;
5. ulangi pemeriksaan pada desktop, tablet, dan mobile nyata;
6. pastikan T-BOS memakai navigasi global tanpa regresi pada grafik, tabel, filter, dan mutasi internalnya.

Status: **routing dan shell siap deploy; acceptance authenticated production masih harus dijalankan setelah deployment**.
