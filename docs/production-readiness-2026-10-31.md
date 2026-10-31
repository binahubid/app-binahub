# Pekerjaan kesiapan operasional BinaHub

Disetujui pemilik pada 31 Oktober 2026 setelah review lintas app, API, website,
AMS dan otomasi. Ini daftar implementasi, bukan pernyataan produksi sudah siap.
Setiap bagian membedakan kode, tes sintetis, deployment dan bukti produksi.

## Batas tetap

- Tidak mengubah instrumen/rubrik CEO, izin peserta, hasil historis atau harga
  yang sudah disahkan. Bobot tampilan 50:50 tetap sementara.
- Pembayaran, produk RM publik, LE/WBR dan laporan grup PETA tetap tertutup
  sampai keputusan produk/komersial yang diperlukan tersedia.
- Tidak mengirim email nyata, memakai kuota AI, mengaktifkan outreach, menerapkan
  SQL atau melakukan restore/cleanup produksi tanpa koordinasi khusus.
- Program nyata PFA2026 dan seluruh relasinya tidak disentuh.
- Tidak menganggap push/build sebagai bukti deployment atau email diterima.

## Urutan kerja dan bukti penyelesaian

| ID | Pekerjaan | Status awal | Bukti selesai yang diperlukan |
| --- | --- | --- | --- |
| R01 | Patch dependensi API dan AMS | API dipatch/diuji lokal; AMS berikutnya | Lockfile diperbarui, audit dependensi dan regresi lulus; versi produksi diverifikasi terpisah |
| R02 | Satu jalur deployment website, CI yang benar | Selesai lokal; deployment belum diverifikasi | Workflow non-destruktif, quality script tersedia, build Next sesuai konfigurasi Hostinger |
| R03 | Scheduler dan pemulihan seluruh antrean | Pro + Cron disetujui; aktivasi menunggu migrasi ke workspace BinaHub | Kontrak pemanggilan terautentikasi, retry terbatas, bukti heartbeat; migrasi dan Pro aktif pada tujuan diverifikasi |
| R04 | AI SPIN gagal → retry/needs-review, bukan selesai kosong | Kode dan regresi lokal selesai di API0.46.3; produksi belum diverifikasi | Jawaban/snapshot tetap, retry tidak menggandakan email; tes outage dan pulih |
| R05 | Minimisasi data AI lintas jalur | Berikutnya | Kontak tidak dikirim tanpa kebutuhan; tes prompt dengan data sintetis |
| R06 | Kesiapan layanan dan alarm | Berikutnya | Pisahkan liveness/readiness; antrean terlambat/worker mati terlihat, kanal alarm disetujui |
| R07 | Pagination/pencarian server, prioritas tugas admin | PETA selesai lokal; daftar lain menyusul | Data lama dapat ditemukan; total berasal dari server; tampilan mobile dan izin tetap benar |
| R08 | Meeting → draf proposal yang ditinjau | Berikutnya | Revisi meeting terpisah dari hasil klien; isi/harga dari sumber yang disahkan; tidak otomatis mengirim |
| R09 | PDF/catatan pendamping PETA individu | Direncanakan | Snapshot dan izin diperiksa server; PDF tidak membuka hasil peserta lain; grup tetap off |
| R10 | Integrasi AMS, handoff, evaluasi dan pesanan ulang | Direncanakan | Bukti identitas/program, revoke/retry idempoten, pesanan ulang tidak disimpulkan dari label |
| R11 | Backup/restore dan baseline migrasi | Menunggu validasi operator | Pemulihan terisolasi DB + Storage + kunci; satu pemilik migrasi; tidak replay SQL lama |
| R12 | Produk berbayar individu | Menunggu CEO/gateway | Aturan/report/entitlement dan pembayaran sandbox lolos sebelum checkout aktif |

## Keputusan yang belum tersedia

Waktu migrasi ke workspace Vercel BinaHub dan aktivasi Pro/scheduler (arah Pro + Cron
sudah disetujui; akun tujuan belum dibuat); kanal/penerima alarm; aturan SJT RM per kompetensi dan
interpretasinya; keputusan akhir bobot, masa akses/retake/refund berbayar;
instrumen LE/WBR; ketentuan pajak/biaya tambahan/custom; format proposal custom
final; otorisasi/format PDF PETA dan kebijakan kelompok; standar layanan dan
indikator hasil program. Katalog SPIN31 dan izin penggunaan AI tidak ditanyakan ulang.

## Catatan pelaksanaan

Tambahkan hasil aktual per batch di bawah; jangan mengubah “menunggu” menjadi
“selesai” hanya karena kode tersedia. Rencana 22 Oktober tetap riwayat sumber,
bukan daftar status runtime terkini.

### Scheduler: kondisi yang dikonfirmasi pemilik

- n8n berada di laptop/komputer lokal, bukan server yang selalu aktif.
- API masih memakai paket Vercel Hobby. Jangan menambahkan jadwal per menit pada
  konfigurasi deployment aktif: paket tersebut menolak jadwal lebih dari harian.
- Keputusan pemilik: Pro + Vercel Cron disetujui setelah migrasi dari akun pribadi
  ke akun/workspace Vercel BinaHub. Akun tujuan belum dibuat; tidak melakukan
  upgrade akun pribadi, migrasi, pembelian atau aktivasi worker baru sekarang.
  n8n lokal tetap untuk uji. Pekerjaan kode dan regresi yang tidak bergantung pada
  migrasi tetap dapat dilanjutkan.
- Alternatif jika kelak memerlukan orkestrasi visual lintas layanan: n8n pada
  server selalu aktif, dengan pemilik operasi, backup dan monitoring yang jelas.
  Scheduler eksternal tidak mengubah batas penggunaan komersial paket Hobby.
- Jadwal retensi PETA tetap bulanan. Pekerjaan pemulihan antrean perlu jadwal
  berbeda; jangan menyamaratakan seluruh worker menjadi sebulan sekali.
- Detail dan urutan aktivasi: [rencana scheduler](worker-scheduler-plan.md).

### Batch 1: dependency API dan jalur build website

- API 0.46.2: Next/config ESLint 16.4.3, Zod 4.6.7, Vitest 4.1.12,
  Vite lini 8.1.6. Jimp yang tidak digunakan beserta plugin turunannya dihapus.
  Brace expansion dipatch per lini kompatibilitas, bukan override mayor global.
- Audit npm API penuh: dari 50 menjadi 16 peringatan moderat development;
  audit runtime (`--omit=dev`) menghasilkan 0 advisori pada 31 Oktober.
  Sisa development terkait [minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249)
  dan konsumen lint-nya. Belum ditutup: perlu migrasi kompatibel, bukan audit fix
  force atau penggantian API mayor yang membuat lint gagal.
- Regresi API sintetis: 807 lulus, 2 tes visual dilewati; tes live dan sumber
  privat tidak dijalankan. TypeScript lulus; lint lulus dengan satu peringatan
  `ProposalPDF` tidak dipakai yang sudah ada, tanpa perubahan template laporan.
- Build API Webpack juga berhasil dari snapshot source dan helper skrip, tanpa
  file .env dan dengan kredensial dummy Supabase/Resend. Perintah build produksi
  kini memakai bundler yang sama dengan verifikasi ini.
- Website 0.2.46: hapus dua workflow lama dan ganti satu quality workflow
  Node22/read-only. Tidak ada lagi upload out/ atau pembersihan direktori FTP.
  Integrasi Git Hostinger tetap jalur deployment; tidak mengubah izin akun.
- Website: quality (lint/types), handoff program, dua kontrak CI dan build
  berhasil; audit runtime 0 advisori. Tool development masih perlu batch lanjutan.
- CI API baru memakai tes sintetis dan dummy credential untuk build, bukan
  secret produksi. Kedua CI membangkitkan tipe Next sebelum pemeriksaan pada
  checkout baru. Branch protection/status check live belum diverifikasi.
- Ini pemeriksaan dependency dan regresi lokal, bukan hasil pentest Strix atau
  bukti tidak ada celah lain. AMS, retry SPIN dan worker belum dinyatakan selesai.

### Batch 2: retry SPIN, riwayat PETA dan status program

- API0.46.3: kegagalan provider/schema SPIN menunggu retry, bukan langsung menjadi
  laporan konsultasi generik yang dikirim seolah analisis berhasil. Tetap memakai
  backoff/limit percobaan SQL71 dan pemulihan admin SQL73; tidak mengaktifkan
  scheduler. Respons AI valid yang memang hanya mendukung konsultasi tetap sah.
- Regresi SPIN menguji outage, pemulihan, batas percobaan, respons tidak valid,
  dan satu pengiriman idempoten setelah pulih; bukan pengiriman email nyata.
- App0.50.1 + SQL78: daftar PETA aktif hanya modul/status relevan; program selesai
  pindah ke Riwayat program tanpa penghapusan atau perubahan izin/retensi.
  Pagination20 baris, pencarian/filter dan total server mengganti batas100 global.
- Regresi SQL memakai125 pengisian sintetis, menguji pencarian data lama,
  kepemilikan, grant backend-only serta hasil final identik sebelum/sesudah
  program selesai. Penghapusan program dengan workspace PETA ditolak sebelum
  tim kosong dihapus. Tidak menyentuh program nyata PFA2026.
- Status manual kini dipertahankan; aturan tanggal tetap berjalan pada program
  otomatis. Perbaiki label badge PETA/pre-test/post-test yang sebelumnya jatuh
  ke fallback T-BOS. Instruksi PETA menegaskan dua pernyataan yang berbeda.
- Pemilik melaporkan SQL78 berhasil dijalankan. Tidak ada env baru; build/push,
  verifikasi produksi dan status worker tetap dicatat terpisah.
- Uji app:394 unit/komponen lulus;14 skenario browser desktop/mobile lulus.
  Tinjauan visual mempertahankan tata letak operasional BinaHub; detector0 temuan.
  Lint mengabaikan artefak build lokal, bukan source. API:827 tes lulus/2 visual
  skip, dengan dua worker seperti CI dan mengecualikan tes live/private. Putaran
  paralel tanpa batas sempat kehabisan memori lokal; pengulangan terbatas lulus.
  Build produksi app/API dan pemeriksaan tipe lulus; lint API menyisakan satu
  warning ProposalPDF lama. Pemeriksaan ini bukan pentest Strix atau jaminan
  bebas kerentanan; deployment produksi belum diverifikasi.
- AMS yang sudah disiapkan, minimisasi prompt lintas fitur, alarm, PDF PETA dan
  pekerjaan lain tetap dilanjutkan per urutan, tidak dinyatakan selesai di batch ini.
