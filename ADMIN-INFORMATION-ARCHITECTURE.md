# Arsitektur Informasi Aplikasi BinaHub

Dokumen ini menetapkan rute kanonis dan pola navigasi production setelah penyederhanaan Fase 16. Tujuannya adalah menghilangkan pilihan dashboard yang saling tumpang tindih dan membuat setiap peran selalu tiba di ruang kerja yang tepat.

## Prinsip journey

1. Login hanya menjadi pintu autentikasi, bukan pilihan dashboard.
2. `/home` hanya menyelesaikan role pengguna, lalu mengarahkan ke beranda role tersebut.
3. Satu pekerjaan memiliki satu URL kanonis yang dapat ditandai, dibagikan, dan dipulihkan setelah refresh.
4. Navigasi utama selalu mencerminkan URL aktif; halaman admin tidak lagi dikendalikan tab lokal di `/admin`.
5. Rute lama tetap diarahkan ke tujuan baru agar bookmark tidak rusak.
6. Evidence pengujian, status fase, dan prosedur developer tidak menjadi menu produk.
7. Area T-BOS tetap memakai shell dan pola navigasi yang sudah ada sampai audit khusus T-BOS dijadwalkan.

## Beranda per role

| Role | Beranda kanonis | Tujuan |
| --- | --- | --- |
| Administrator | `/admin/dashboard` | Ringkasan prioritas dan antrean operasional |
| Klien | `/client/program` | Program dan aktivitas klien |
| Fasilitator | `/fasilitator/tbos` | Ruang kerja observasi T-BOS saat ini |
| Peserta | `/peserta/dashboard` | Aktivitas peserta |

## Navigasi administrator

| Kelompok | Menu | URL kanonis |
| --- | --- | --- |
| Ringkasan | Dashboard | `/admin/dashboard` |
| Akuisisi & Penjualan | Kontrol Akuisisi | `/admin/acquisition` |
| Akuisisi & Penjualan | Pipeline Penjualan | `/admin/pipeline` |
| Akuisisi & Penjualan | Assessment | `/admin/assessments` |
| Akuisisi & Penjualan | Konsultasi | `/admin/meetings` |
| Akuisisi & Penjualan | Kontak & Lead | `/admin/contacts` |
| Akuisisi & Penjualan | Inquiry Masuk | `/admin/inquiries` |
| Klien & Delivery | Klien & Pelaksanaan | `/admin/clients` |
| Klien & Delivery | Kontrol Operasional | `/admin/operations` |
| Klien & Delivery | Pusat Otomasi | `/admin/automation` |
| Program & Produk | Program | `/admin/programs` |
| Program & Produk | Katalog Produk | `/admin/catalog` |
| Program & Produk | Pre-test & Post-test | `/admin/programs/tests` |
| Program & Produk | Evaluasi Program | `/admin/lep` |
| Program & Produk | T-BOS | `/admin/tbos` |
| Tata Kelola | Pengguna & Peran | `/admin/users` |
| Tata Kelola | Izin Akses | `/admin/rbac` |
| Tata Kelola | Pengaturan Bisnis | `/admin/settings` |

## Redirect kompatibilitas

| Rute lama | Tujuan |
| --- | --- |
| `/admin` | `/admin/dashboard` |
| `/admin/organizations` | `/admin/clients` |
| `/admin/engagements` | `/admin/programs` |
| `/admin/login` | `/login` |
| `/client/dashboard` | `/client/program` |
| `/facilitator` | `/fasilitator/tbos` |
| `/facilitator/dashboard` | `/fasilitator/tbos` |

## Perilaku shell admin

- Desktop memakai sidebar tetap dengan kelompok accordion, pencarian menu, penanda halaman aktif, dan area scroll mandiri.
- Mobile memakai drawer modal dengan focus trap, tombol Escape, pengembalian fokus, dan body scroll lock.
- Header menyediakan breadcrumb kontekstual, aksi halaman, bantuan, dan keluar sesi tanpa menggandakan judul konten.
- Loading, error, dan not-found mempunyai state khusus area admin.
- Style production diterapkan melalui scope `.admin-ui-v2`; halaman T-BOS tidak menerima override ini.

## Aturan pengembangan selanjutnya

- Tambahkan halaman admin baru ke `src/lib/admin-navigation.ts` dan buat route page yang nyata; jangan menambah tab baru ke `/admin`.
- Gunakan `AdminShell` untuk halaman administrator non-T-BOS.
- Gunakan `findAdminNavigation()` untuk breadcrumb dan active state agar tidak membuat peta menu kedua.
- Jangan menampilkan checklist deployment, smoke test, evidence UAT, atau status fase sebagai navigasi pengguna.
- Rute detail boleh berada di bawah rute kanonis dan harus memetakan active state ke menu induknya.
