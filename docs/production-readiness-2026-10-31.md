# Pekerjaan kesiapan operasional BinaHub

Disetujui pemilik pada 31 Oktober 2026 setelah review lintas app, API, website,
AMS dan otomasi. Ini daftar implementasi, bukan pernyataan produksi sudah siap.
Setiap bagian membedakan kode, tes sintetis, deployment dan bukti produksi.

## Batas tetap

- Tidak mengubah instrumen/rubrik CEO, izin peserta, hasil historis atau harga
  yang sudah disahkan. Bobot tampilan 50:50 tetap sementara.
- Pembayaran, produk RM publik dan LE/WBR tetap tertutup sampai keputusan
  produk/komersial tersedia. PDF PETA individu/grup internal kini disetujui dan
  tersedia khusus admin; distribusi perusahaan/anonim tetap belum diaktifkan.
- Tidak mengirim email nyata, memakai kuota AI, mengaktifkan outreach, menerapkan
  SQL atau melakukan restore/cleanup produksi tanpa koordinasi khusus.
- Program nyata PFA2026 dan seluruh relasinya tidak disentuh.
- Tidak menganggap push/build sebagai bukti deployment atau email diterima.

## Urutan kerja dan bukti penyelesaian

| ID | Pekerjaan | Status awal | Bukti selesai yang diperlukan |
| --- | --- | --- | --- |
| R01 | Patch dependensi API dan AMS | Selesai kode/regresi: API0.47.3, AMS0.11.1/web0.10.2; produksi belum diverifikasi | Audit penuh/runtime0, lockfile dan build/regresi lulus; versi deployment perlu diverifikasi terpisah |
| R02 | Satu jalur deployment website, CI yang benar | Selesai lokal; deployment belum diverifikasi | Workflow non-destruktif, quality script tersedia, build Next sesuai konfigurasi Hostinger |
| R03 | Scheduler dan pemulihan seluruh antrean | API0.47.15/SQL89: operator mengonfirmasi Cron aktif dan HTTP200 diterima worker4November13:42WIB; hasil tiap laporan/email belum diverifikasi; AMS/outreach terpisah | Satu scheduler per pekerjaan dan bukti heartbeat/hasil; migrasi hosting terpisah, belum seluruh antrean diotomatisasi |
| R04 | AI SPIN gagal → retry/needs-review, bukan selesai kosong | Kode dan regresi lokal selesai di API0.46.3; produksi belum diverifikasi | Jawaban/snapshot tetap, retry tidak menggandakan email; tes outage dan pulih |
| R05 | Minimisasi data AI lintas jalur | Selesai kode/proyeksi aktif API0.47.4/AMS0.11.2; pengecualian dicatat, produksi belum diverifikasi | Kontak terstruktur/pola dibatasi; CV/impor profil bertujuan khusus tetap memiliki data identitas; bukan anonim penuh |
| R06 | Kesiapan layanan dan alarm | Monitoring laporan API/admin selesai kode; alarm eksternal, AMS DB/antrean dan aktivasi scheduler belum | Liveness/readiness terpisah;4 antrean laporan dan heartbeat tampil; cakupan/unknown jelas, kanal alarm tetap perlu keputusan |
| R07 | Pagination/pencarian server, prioritas tugas admin | PETA, rekomendasi, diagnosis tim/org, inquiry, Kontak & Leads, pipeline, prioritas CRM, konsultasi dan arsip kampanye selesai kode; pagination AMS masih ditinjau | Data lama dapat ditemukan; total berasal dari server; tampilan mobile dan izin tetap benar |
| R08 | Meeting → draf proposal yang ditinjau | Berikutnya | Revisi meeting terpisah dari hasil klien; isi/harga dari sumber yang disahkan; tidak otomatis mengirim |
| R09 | PDF/catatan pendamping PETA individu | PDF individu/grup internal khusus admin selesai; catatan pendamping belum | App0.51.1/API0.47.2/SQL80; izin dan retensi diperiksa server; tidak ada distribusi perusahaan/anonim |
| R10 | Integrasi AMS, handoff, evaluasi dan pesanan ulang | Direncanakan | Bukti identitas/program, revoke/retry idempoten, pesanan ulang tidak disimpulkan dari label |
| R11 | Backup/restore dan baseline migrasi | Menunggu validasi operator | Pemulihan terisolasi DB + Storage + kunci; satu pemilik migrasi; tidak replay SQL lama |
| R12 | Produk berbayar individu | Demo admin PE/RM app0.51.13/API0.47.17; pembayaran hanya simulasi; penjualan publik belum dibuka | Aturan/report/entitlement dan pembayaran sandbox lolos sebelum checkout aktif |

## Keputusan yang belum tersedia

Waktu migrasi ke workspace Vercel BinaHub dan aktivasi Pro (akun tujuan belum dibuat;
scheduler Supabase diaktifkan operator pada4November); kanal/penerima alarm; aturan SJT RM per kompetensi dan
interpretasinya; keputusan akhir bobot, masa akses/retake/refund berbayar;
instrumen LE/WBR; ketentuan pajak/biaya tambahan/custom; format proposal custom
final; kebijakan pembagian laporan PETA ke pihak luar; standar layanan dan
indikator hasil program. Katalog SPIN31 dan izin penggunaan AI tidak ditanyakan ulang.

## Catatan pelaksanaan

Tambahkan hasil aktual per batch di bawah; jangan mengubah “menunggu” menjadi
“selesai” hanya karena kode tersedia. Rencana 22 Oktober tetap riwayat sumber,
bukan daftar status runtime terkini.

### Scheduler: kondisi yang dikonfirmasi pemilik

- Pembaruan 4 November: pola Supabase Cron SLJ telah diperiksa dan sesuai untuk
  pemicu recovery BinaHub. Arah scheduler tidak lagi wajib menunggu Vercel Pro;
  migrasi hosting tetap terpisah. Catatan penundaan pada batch historis di bawah
  tidak boleh dibaca sebagai keputusan scheduler terbaru. Operator kemudian
  mengaktifkan Cron: status aktif/accepted_by_worker/HTTP200 dilaporkan pada
  4November13:42WIB. Tidak disimpulkan sebagai semua pekerjaan/email selesai.
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

### Batch 3: advisori minimatch pada app dan website

- App0.50.2 dan website0.2.47: seluruh jalur minimatch memakai paket registry
  resmi11.0.1 untuk CVE-2026-118764 / GHSA-g3hv-75wg-m249. Jalur yang ditemukan
  adalah tool lint development; dependency runtime aplikasi tidak berubah.
- Kompatibilitas callable plugin lama dijaga hanya pada proses lint, melalui
  facade atas matcher11. Tidak ada compiler regex lama, patch file node_modules,
  hook instalasi/build, penonaktifan rule atau penekanan advisori.
- Audit penuh dan runtime-only kedua repo menghasilkan0 advisori. npm ci,
  kontrak dependency, lint, build/TypeScript dan394 tes app lulus; kontrak
  handoff/workflow website juga lulus. CI kini memeriksa dependency development.
- Status16 peringatan development pada Batch1 adalah bukti historis API,
  bukan hasil audit terbaru app/website. Repo API/AMS tidak diubah pada batch ini.
- Tidak ada SQL/env, perubahan UI/skor, aktivasi scheduler atau data produksi.
  Verifikasi deployment Hostinger dan rescan tetap terpisah dari keberhasilan
  lokal/push. Detail: [patch minimatch](minimatch-security-patch-2026-10-31.md).

### Batch 4 - 2 November2026: tuntaskan R01 API/AMS

- API0.47.3 menutup16 peringatan development minimatch. Audit npm penuh dan
  runtime sama-sama0;859 regresi sintetis serta3 kontrak matcher lulus,2 tes
  visual existing dilewati. Lint/type/build lulus dengan satu warning lama
  ProposalPDF. Tidak mengubah logika runtime, hasil atau izin.
- AMS0.11.1/web0.10.2 menyelesaikan patch31Oktober yang masih belum dicommit,
  termasuk validasi Zod4 yang menjaga default CV dan record metadata file.
  Dependensi tooling tambahan ditambal; audit penuh/runtime9 menjadi0 advisori.
- 16 kontrak dependency/validasi/API, self-test fallback LapakVIP→OpenRouter,
  signed managed routing tanpa bypass, lint, tipe API dan build web/API lulus.
  Semua memakai data sintetis/mock, tidak memakai kuota AI atau data produksi.
- Versi pnpm proyek9.15.0 dipakai lewat Corepack; tidak mengganti pnpm global.
  Frozen lockfile lulus. CI baru mengaktifkan versi tepat, memeriksa advisori
  development dan menjalankan regresi/build tanpa secret produksi.
- Patch matcher memakai engine resmi, bukan menonaktifkan rule atau menekan
  advisori. FlatCompat Next15 memakai entry CommonJS yang didukung. Kontrak
  tooling Node dipisahkan dari penemuan tes Vitest API.
- Ini menutup pekerjaan kode R01, bukan bukti deployment. Tidak ada SQL/env,
  migrasi, email nyata, aktivasi scheduler atau perubahan program PFA2026.
  Tidak ada pentest Strix baru terhadap produksi; audit0 bukan klaim bebas celah.
- PDF PETA yang dikerjakan1November dicatat pada R09: individu dan grup internal
  khusus admin, hasil peserta tetap di layar. Catatan pendamping masih terpisah.
- Pekerjaan berikutnya R05: minimisasi data AI lintas jalur. R03 tetap menunggu
  migrasi Vercel BinaHub + Pro; R06 masih memerlukan keputusan kanal alarm.

### Batch 5 - 2 November2026: R05 batas data AI

- API0.47.4 memakai referensi identitas/kontak sementara per panggilan dan
  personalisasi lokal untuk diagnosis tim, proposal, korespondensi, lead,
  project/undangan dan chat. URL privat/pola kredensial dihapus, query/hash
  konteks chat tidak dikirim. Referensi rusak ditolak sebelum hasil diteruskan.
- Matching project dan AMS0.11.2 hanya memakai kualifikasi/ref sementara;
  nama/email/ID asli dipasang dari server. Evidence lead tidak menserialisasi
  record nested tak dikenal. Harga, skor deterministik dan alur kirim tetap.
- SPIN tetap proyeksi kebutuhan terkonfirmasi; wording PE tetap hanya anchor,
  tanpa identitas/konteks/jawaban/skor peserta. PETA tidak diubah.
- Pengecualian tercatat: parsing CV dan impor profil profesional masih dapat
  memerlukan identitas. Pola redaksi bukan DLP/anonymization: nama/alamat di teks
  bebas, format tersamarkan dan data dalam gambar tidak dijamin terhapus.
  Helper vision tidak ditemukan dipanggil pada source yang ditinjau; penggunaan
  baru perlu kontrak data sendiri. Kebijakan retensi provider belum diverifikasi.
- API:877 tes sintetis lulus/2 visual existing skip; AMS:4 tes privasi baru,
  16 kontrak dan self-test managed/fallback lulus. Tes memakai mock/loopback,
  bukan kuota AI, database produksi atau email nyata. Lint/types/build API dan
  build API/web AMS lulus; warning ProposalPDF lama tidak terkait patch ini.
- CI mencakup regresi baru. Tidak ada SQL/env baru, pembayaran aktif, perubahan
  izin/retensi atau aktivasi worker. R03 tetap menunggu migrasi Vercel + Pro.
- Scope teknis dan langkah verifikasi deployment ada pada dokumen
  `binahub-api/docs/ai-data-boundaries-2026-11-02.md` dan
  `binahub-platform/docs/AI-DATA-BOUNDARIES-2026-11-02.md`. Tidak ada pentest
  Strix baru; source/test/push bukan bukti deployment produksi telah memakai patch.
- Berikutnya R06: pisahkan bukti liveness/readiness dan visibilitas antrean;
  pengiriman alarm tetap menunggu kanal/penerima yang disetujui.

### Batch 6 - 2 November2026: monitoring laporan R06

- API0.47.5 / app0.51.2: liveness publik tidak mengklaim dependensi siap.
  Overview/readiness probe admin-only membaca4 antrean utama dan heartbeat terbaru,
  tanpa kontak, jawaban, ID peserta, hasil/PDF, pemanggilan AI atau pengiriman.
- SQL81 menambah ringkasan read-only dan satu baris aktivitas recovery terbaru;
  UUID run mencegah penyelesaian lama menimpa run baru. Pemilik melaporkan SQL81
  berhasil dijalankan. Belum ada inspeksi langsung data/runtime produksi.
- Catat pemanggilan endpoint recovery dan kegagalan parsial. Telemetry gagal
  tidak menghentikan recovery existing; overview tidak pernah memanggil worker.
  Proses gagal/uncertain tetap perlu rekonsiliasi, bukan otomatis dikirim ulang.
- Panel Operations existing mempertahankan identitas visual admin. Tabel desktop
  menjadi ringkasan per antrean di mobile; warning global dapat ditutup, dan
  perubahan bukti memunculkannya kembali. Bukti unavailable/stale tidak menjadi
  nol/hijau. Timeout, abort dan hasil terlambat diuji.
- AMS root0.11.3/web0.10.3 memperbaiki pembanding versi API0.10.1 yang usang dan
  mengoreksi klaim status publik menjadi pemeriksaan dasar. API AMS tetap0.11.2;
  database, antrean dan keberhasilan AI/email tidak dibuktikan halaman publik.
- Tidak ada env baru, aktivasi scheduler, outreach, email/WhatsApp alarm, perubahan
  instrumen/izin/retensi atau pemrosesan program PFA2026. Jadwal retensi PETA bulanan
  tetap terpisah; pemulihan rutin menunggu migrasi Vercel + Pro.
- Cakupan, semantik HEAD/GET, ambang dan langkah validasi deployment:
  `binahub-api/docs/service-health-2026-11-02.md`. Ini bukan pentest Strix.
- Bukti lokal:895 tes API lulus/2 visual existing skip,424 tes app lulus,
  3 kontrak status AMS dan10 pemeriksaan Chromium desktop/mobile lulus.
  Lint/types dan build API/app/web AMS lulus; satu warning ProposalPDF API lama
  tetap ada. Tidak ada tes provider berbayar atau login/pengisian produksi.
  Pemeriksaan visual mengikuti tampilan admin existing; detector0 temuan.
- R06 belum menutup monitoring resource hosting, DB/antrean AMS, workflow/event
  lain atau alarm eksternal. Infrastruktur/channel yang tertunda tidak menghalangi
  pekerjaan read-only/pagination R07 dan penyiapan proposal-review R08 berikutnya.

### Batch7 - 2 November2026: standar PDF lintas produk

- API0.47.6 dan AMS root0.11.4/web0.10.4 menyelaraskan PDF diagnosis organisasi,
  proposal, rekomendasi, T-BOS, kuesioner program dan CV dengan identitas cetak
  PETA: logo asli, font lokal, margin, hierarki, pemisahan halaman dan footer.
- PDF PETA tetap hanya untuk admin. Skor, laporan sumber, izin, katalog/harga
  dan arsip lampiran yang sudah dibekukan tidak diubah. Tidak ada SQL/env baru.
- Dua contoh baru memakai fixture sintetis: T-BOS3 tim/30 anggota dan diagnosis
  organisasi49 pertanyaan. Keduanya tidak memanggil AI/email atau data produksi.

### Batch8 - 2 November2026: R07 inbox kebutuhan program

- App0.51.3/API0.47.7 menutup cacat jalur cadangan inbox rekomendasi: sebelumnya
  pencarian hanya memfilter20 record yang sudah dimuat, meski total seluruh arsip.
  Kini filter kontak dijalankan server sebelum hitung total dan pilih halaman.
  Primary inbox meeting tetap RPC existing, mencakup checklist admin.
- Karakter khusus dicari sebagai teks literal, bukan pola regex atau ekspresi
  filter. Batas150 karakter/20 record, auth/rate limit, submitted-only dan DTO
  ringkas tetap. Tidak mengirim jawaban atau laporan dalam respons daftar.
- Jumlah/rentang/halaman jelas; pencarian kembali ke halaman pertama. Request lama
  dibatalkan/diabaikan, timeout20 detik dan retry tersedia. Catatan meeting tidak
  di-remount saat retry daftar. Halaman di luar rentang pulih setelah data berubah.
- Daftar dibatasi tinggi agar pagination dan detail tetap dekat pada desktop/mobile.
  Styling admin existing dipertahankan. Error tidak menampilkan hasil lama atau
  nol sehat. API lama yang belum mendukung pencarian arsip ditolak secara jelas.
- Deploy API sebelum app. Tidak ada SQL/env baru, scheduler, pengiriman,
  perubahan instrumen/skor/izin/retensi, atau pemrosesan program PFA2026.
- R07 belum mencakup seluruh daftar diagnosis, inquiry, CRM dan AMS; jangan
  menandai audit pagination lintas sistem selesai. R03 tetap ditunda sesuai
  permintaan pemilik sampai migrasi Vercel BinaHub + Pro.
- Bukti lokal:924 tes API lulus/2 visual existing skip; suite app434 lulus,
  lalu11 regresi inbox final lulus termasuk transport yang mengabaikan abort.
  Lint/types/build kedua repo serta18 pemeriksaan Chromium desktop/390/320px
  lulus. Detector tidak menemukan masalah; batas visual diperiksa dalam dua
  putaran. Ini bukan bukti runtime produksi atau pentest Strix.

### Batch9 - 2 November2026: R07 diagnosis tim/organisasi

- App0.51.4/API0.47.8: halaman utama diagnosis tidak lagi menunggu payload
  dashboard umum. Inbox server juga dipakai dari workspace penjualan dan entry
  admin lama. Daftar20 record; detail satu klien dibaca terpisah dan baru
  memuat jawaban/narasi/rekomendasi. Normalizer existing dipakai bersama.
- SQL82 melakukan pencarian literal, filter kategori/ukuran/skor/antrean dan
  pengurutan sebelum pagination. Hitungan kartu mengikuti semua filter kecuali
  pilihan antrean; opsi kategori/ukuran berasal dari seluruh arsip. Fungsi lain
  hanya mengirim49 hitungan agregat saat bagian pola jawaban dibuka.
- SQL82 tidak menulis jawaban/skor/laporan, tidak mengirim atau memproses antrean.
  Fungsi dibatasi service_role; API memeriksa admin, rate limit, input, no-store
  dan error aman. Pemilik melaporkan SQL82 berhasil dijalankan. Tidak ada env baru.
- Query/rentang/total jelas, perubahan dan penghapusan filter kembali halaman1,
  error berbeda dari kosong, timeout20detik, abort/late-response guard dan retry
  list/detail terpisah. Filter dipertahankan saat error; CSV menyebut cakupan
  halaman aktif. Di mobile daftar/detail bergantian, bukan ditumpuk.
- Proposal/PDF/email/follow-up tetap memakai aksi existing dengan konfirmasi.
  Refresh server30detik hanya saat proses terlihat dan tidak sedang meninjau
  konfirmasi/menyusun draf. Tidak ada kirim otomatis akibat membuka daftar/tab.
- Bukti lokal:956 tes API lulus/2 visual existing skip; suite app450 lulus,
  termasuk15 regresi inbox final.32 pemeriksaan Chromium pada1440/1024/
  390/320px lulus (API dimock, seluruh aksi mutasi diblokir), termasuk pencarian
  arsip, filter, konfirmasi, gagal/pulih/kosong. SQL diuji pada lebih1000 record
  sintetis dengan PostgreSQL in-memory. Lint/types dan build lulus; detector0.
- Ini bukan bukti runtime/izin/deployment produksi atau pentest Strix. R07 belum
  menutup inquiry/CRM/AMS dan prioritas lintas sistem. R03 scheduler tetap ditunda
  sampai migrasi Vercel BinaHub+Pro; tidak ada aktivitas program PFA2026.

### Batch 10 - 3 November 2026: R07 inbox Inquiry

- App 0.51.5/API 0.47.9 memisahkan halaman Inquiry dari dashboard yang dibatasi
  100 data. Pencarian literal mencakup nama/email/WhatsApp/pesan/sumber/status di
  seluruh arsip, sebelum filter dan pagination 20 baris. Ringkasan mengikuti
  filter; opsi sumber/status mencakup seluruh arsip. Entry penjualan/admin lama
  juga memakai reader baru, tetapi ringkasan prioritas CRM lain belum dirombak.
- SQL83 adalah fungsi baca service_role-only dan indeks urutan waktu/ID.
  Pemilik melaporkan berhasil dijalankan. Tidak ada env baru. Daftar mengirim
  pratinjau pesan maksimal 500 karakter, bukan catatan/draf/modul lengkap.
  Detail lengkap hanya dimuat untuk satu ID yang dibuka; admin/rate limit/input
  diperiksa server. Error tidak membuka diagnostik database atau menjadi nol.
- UI membedakan loading, kosong dan gagal; timeout 20 detik, stale/late-response
  guard, retry list/detail terpisah, reset halaman saat filter berubah, dan
  pemulihan halaman di luar rentang. Draft/catatan lokal tidak di-remount saat
  refresh/retry; penutupan dengan perubahan meminta konfirmasi. Perlindungan
  ini bukan penyimpanan draft permanen atau penguncian edit lintas admin.
- Konfirmasi kirim dan review manusia tetap wajib. Fokus drawer ditangguhkan
  selama dialog konfirmasi agar keyboard tidak ditangkap dua dialog. Indikator
  due menyamai status penghentian/jeda serta aturan 2/7/14 hari existing; bukan
  bukti worker aktif atau izin melewati kebijakan pengiriman.
- Bukti lokal: 986 tes API lulus/2 visual existing skip; suite app 463 lulus,
  disusul 22 regresi terarah final termasuk trim balasan. Lint/types dan build
  app/API lulus. SQL diuji dengan lebih 1.000 record sintetis;
  40 pemeriksaan Chromium pada 1440/1024/390/320px lulus memakai API mock dan
  seluruh mutasi diblokir. Detector tidak menemukan masalah. Bukti ini bukan
  runtime produksi, provider delivery, pentest Strix atau jaminan tanpa celah.
- Deploy API sebelum app. Tidak mengubah instrumen/skor/izin/retensi/harga,
  menjalankan AI/email/cleanup/SQL produksi, atau menyentuh PFA2026. Scheduler
  tetap ditunda sampai migrasi workspace Vercel BinaHub + Pro. R07 CRM/AMS dan
  R08 meeting → draf proposal masih menjadi pekerjaan berikutnya.

### Batch 11 - 3 November 2026: R07 Kontak & Leads

- App 0.51.6/API 0.47.10: halaman Kontak & Leads tidak menunggu dashboard umum
  atau subset 100 inquiry. Reader yang sama dipakai pada entry admin lama.
  SQL84 menyusun proyeksi baca gabungan dari lead, inquiry, coach dan karyawan,
  lalu mencari/filter/menghitung sebelum pagination 20 baris. Detail satu kontak
  dibaca terpisah; daftar tidak mengirim notes/message atau row sumber penuh.
- Identitas email dinormalisasi trim/case; telepon digit dipakai hanya jika
  email tidak tersedia, lalu fallback jenis+ID. Ini mempertahankan arah merge
  existing, bukan identity resolution transitive atau jaminan orang unik:
  shared mailbox tetap dapat tampil bersama. Tidak ada penggabungan permanen
  atau penghapusan sumber. Lead diutamakan; urutan/representatif timestamp+ID
  deterministik. UUID sama pada jenis berbeda tidak membuka atau menulis salah
  sumber. Konteks inquiry didahulukan untuk lead yang tergabung; notes lead
  tetap milik lead, tidak diisi dari notes sumber sekunder.
- Status ditampilkan dari data tersimpan, bukan kata 'proposal/client' dalam
  notes atau umur kontak. Penyimpanan notes tanpa perubahan status menghilangkan
  field status dari PATCH; nilai status eksplisit tetap divalidasi enum server.
  UI mencatat pilihan status eksplisit dan mereset penandanya sesudah sukses,
  sehingga refresh/perubahan status eksternal tidak otomatis dipulihkan ke nilai
  lama. Ini bukan concurrency lock untuk notes atau transisi pipeline baru.
- Loading, gagal dan kosong terpisah; timeout 20 detik, cancellation/late-response
  guard, retry list/detail, filter tetap dan halaman di luar rentang pulih.
  Notes lokal bertahan saat refresh gagal; tutup/reload memperingatkan perubahan
  belum tersimpan. Kontak referensi tetap baca-saja; hanya lead dapat diedit.
- Pemilik mengonfirmasi SQL84 berhasil. Fungsi baca service_role-only dan API
  admin/rate limit/validasi/no-store dipertahankan; tidak ada env baru. Tidak
  menjalankan AI/email/outreach, scheduler, cleanup atau mutasi program PFA2026;
  skor, instrumen, izin peserta dan retensi tidak berubah.
- Bukti lokal: 1.021 tes API lulus/2 visual existing skip; 479 tes app lulus,
  termasuk 17 tes kontak terarah. SQL in-memory diuji dengan lebih 1.000 data
  sintetis. 44 pemeriksaan Chromium 1440/1024/390/320px lulus dengan API mock,
  semua writes/jaringan eksternal diblokir; detector 0. Ini bukan bukti produksi,
  provider delivery, pentest Strix, atau pernyataan seluruh R07 selesai.
- Lint, pemeriksaan tipe dan build produksi app/API lulus. Putaran konfirmasi
  browser terakhir juga lulus; tidak ada pengiriman atau pengujian produksi.
- Deploy API dahulu, lalu app. Pipeline/prioritas CRM dan AMS masih berikutnya;
  scheduler tetap ditunda sampai migrasi workspace Vercel BinaHub + Pro.

### Batch 12 - 3 November 2026: R07 Pipeline penjualan

- App 0.51.7/API 0.47.11: entry utama pipeline terpisah dari dashboard umum;
  embedded dan entry admin lama memakai reader yang sama. SQL85 mencari/filter
  seluruh arsip sebelum pagination 20 baris, nilai/total per tahap dan sorting
  deterministik. Ringkasan atas mencakup semua peluang aktif setelah opsi data
  uji; total tahap mengikuti filter, bukan banyak kartu pada halaman ini.
- Aturan perhatian/overdue/owner kosong, hot, tenggat satu hari dan data uji
  existing dipertahankan. Tahap kosong legacy menjadi identified; tahap tak
  dikenal tetap pada Perlu ditinjau. Angka bukan konversi atau peringkat AI.
- Detail dibaca terpisah untuk satu UUID sebelum edit; riwayat perubahan peluang
  dipaginasi 20 aktivitas. Jumlah diagnosis/konsultasi/akun dihitung dengan ID
  relasi, bukan shared email. Riwayat tidak menyatakan seluruh perjalanan klien
  termuat; menu sumber tetap menjadi tempat membaca konteks lengkap.
- Filter dipertahankan saat gagal; loading/kosong/unavailable berbeda. Read punya
  timeout 20 detik dan cancellation/late-response guard, retry serta page clamp.
  Form edit tidak ditimpa saat paging riwayat atau refresh list. Tutup/reload dan
  navigasi workspace memperingatkan perubahan belum disimpan. Ini bukan draft
  permanen atau concurrency lock lintas admin. PATCH peluang tidak diubah.
- Fokus drawer tetap berada di dalamnya saat kontrol async dinonaktifkan dan
  kembali ke pemicu setelah tutup. Timer autofocus dibatalkan saat unmount.
  Prioritas CRM kini membuka peluang yang dipilih, tetapi perhitungan prioritas
  lintas inquiry/proposal masih memakai cakupan dashboard; belum selesai batch ini.
- Pemilik mengonfirmasi SQL85 berhasil. Fungsi read service_role-only, autentikasi,
  rate limit, parameter validation/no-store serta error aman diuji; tidak ada env
  baru. Tidak menjalankan SQL/AI/email/outreach/cleanup produksi, mengubah skor,
  instrumen/izin/retensi, atau menyentuh program PFA2026. Scheduler tetap pending.
- Bukti lokal: 1.055 tes API lulus/2 visual existing skip; suite app 494 lulus,
  disusul lima tes integrasi workspace penjualan lulus termasuk pemilihan ID dan
  perlindungan edit peluang yang belum tersimpan.
  SQL diuji pada >1.000 peluang sintetis; 48 pemeriksaan Chromium pada
  1440/1024/390/320px lulus dengan API mock dan semua writes/jaringan luar diblokir.
  Ini bukan bukti runtime produksi, provider delivery, pentest Strix atau seluruh
  R07 selesai. Build produksi, lint dan tipe app/API lulus; detector UI 0 temuan.
- Deploy API sebelum app. Batch berikutnya: prioritas CRM lintas sumber,
  kemudian sisa pagination/integrasi AMS sesuai daftar kesiapan.

### Batch 13 - 3 November 2026: R07 prioritas CRM lintas sumber

- App 0.51.8/API 0.47.12: entry utama Akuisisi & penjualan tidak menunggu
  dashboard umum. SQL86 memproyeksikan tugas dari seluruh inquiry, diagnosis
  tim/org/proposal dan peluang lewat tenggat sebelum search/filter/pagination
  20 tugas. Ringkasan seluruh arsip terpisah dari filter daftar; bukan jumlah
  orang unik, performa kampanye atau seluruh pekerjaan admin/discovery.
- Urutan proposal review/rekonsiliasi, balasan awal, hasil belum tercatat,
  peluang lewat tenggat lalu reminder dipertahankan. Satu tindakan utama per
  diagnosis; source-qualified ID dan tujuan detail mencegah tab/jenis ID salah.
  Pengiriman hasil yang belum tercatat tetap tugas periksa hasil, bukan reminder.
  Balasan berstatus sent tanpa timestamp diarahkan untuk diperiksa, bukan
  disimpulkan belum dikirim. Tidak ada perubahan status saat membaca.
- Reminder memakai 2/7/14 hari dari delivery awal (proposal satu reminder), jeda,
  closed/handled status, booking requested/confirmed/rescheduled, completed
  legacy, event/claim cap tiga pesan, klaim next channel/level dan suppression.
  Pencocokan ID relasi ditambah penghentian email nonkosong trim/case existing
  yang konservatif; shared mailbox dapat membuat task tidak ditawarkan. Ini
  tidak menggabungkan identitas atau mengubah policy sending. API tetap mengecek
  settings/jam kerja/template/approval/claim sebelum aksi nyata. Antrean bukan
  izin kirim, bukti worker aktif atau kepastian semua kegiatan telah selesai.
- Detail tetap reader inquiry/diagnosis/pipeline yang ada; draf inquiry dan
  form peluang/checklist meeting tetap dilindungi saat keluar. Tab konsultasi
  entry utama mengarahkan ke halaman sumber existing; arsip konsultasi di sana
  masih memakai cap dashboard dan perlu batch tersendiri. Entry legacy dengan
  payload booking tetap dapat menampilkannya inline. Tidak memuat semua data
  dashboard hanya untuk mengisi ringkasan prioritas.
- Loading/error/missing migration/empty dibedakan, tanpa stale action atau nol
  palsu; timeout 20 detik, cancellation/late-response guard, page reset/clamp,
  serta retry. SQL86/endpoint read-only service_role/admin/rate-limit/no-store.
  DTO tidak memuat form/answers/report narrative, reply body atau proposal draft.
- Bukti lokal: 1.083 tes API lulus/2 visual existing skip, 511 tes app lulus;
  SQL terisolasi dengan >1.000 data sintetis; 44 pemeriksaan Chromium pada
  1440/1024/390/320px lulus dengan API mock serta writes/jaringan luar diblokir.
  Detector UI 0 temuan; build produksi, lint dan tipe app/API lulus. Pemilik
  mengonfirmasi SQL86 berhasil dijalankan pada 3 November 2026.
  Ini bukan runtime produksi, delivery provider atau pentest Strix.
- Tidak menjalankan SQL produksi, AI/email/outreach/scheduler/cleanup, mengubah
  instrumen/skor/izin/retensi/harga, atau menyentuh PFA2026. Scheduler tetap
  ditunda sampai migrasi workspace Vercel BinaHub + Pro. Deploy API sebelum app
  setelah operator mengonfirmasi SQL86; tidak ada env baru.

### Batch 14 - 3 November 2026: R07 arsip konsultasi

- App 0.51.9/API 0.47.13: halaman utama Konsultasi tidak lagi menunggu dashboard
  umum yang membatasi 200 booking. Entry embedded/legacy memakai reader yang
  sama. SQL87 mencari/filter seluruh arsip sebelum pagination 20 jadwal dengan
  urutan stabil; ringkasan, jumlah tab, dan agenda terdekat mencakup seluruh
  arsip, tidak mengikuti filter pencarian. Detail dibaca terpisah dengan UUID.
- Hari ini dan tanggal/jam ditampilkan konsisten dalam WIB; zona waktu asal
  booking diberi label terpisah di detail. Agenda yang lewat tidak dianggap
  selesai tanpa status completed. Hari ini mencakup agenda lewat hari ini,
  tanpa pembatalan atau slot lama. Tidak terlaksana memuat cancelled/rejected/
  no_show. Semua dan Perlu ditinjau menjaga data tanpa waktu/status dikenal
  tetap dapat ditemukan. Waktu selesai sebelum mulai juga perlu ditinjau.
- Dalam satu provider/series, slot lama masuk Riwayat berdasarkan created_at
  (UUID sebagai tie-breaker), bukan updated_at yang berubah saat reschedule.
  Ini proyeksi read-only, bukan koreksi status atau sinkronisasi ke Cal.com.
  Tautan ruang hanya ditawarkan untuk slot mendatang yang tidak diganti dan
  URL HTTPS valid tanpa kredensial. Payload provider tidak dikirim; URL ruang,
  penyelenggara, dan alasan pembatalan hanya dimuat pada detail terpilih.
- Loading, error, missing migration, dan kosong dibedakan tanpa angka nol palsu
  atau tautan detail stale. Filter tetap saat gagal; debounce, reset/clamp page,
  timeout 20 detik, cancellation/late-response guard, dan retry detail terpisah.
  Semua reader admin-only, rate-limited, no-store dan fungsi SQL service-role-only.
- Bukti lokal: suite app 530 lulus, disusul 14 tes komponen konsultasi lulus
  termasuk dua regresi tambahan pemisahan error daftar/detail dan respons
  terlambat. Suite API 1.112 lulus/2 visual existing skip. SQL87 diuji pada
  >1.000 booking sintetis di PostgreSQL terisolasi, termasuk batas hari WIB,
  lineage, literal search, role denial dan tidak berubahnya sumber.
  40 pemeriksaan Chromium pada 1440/1024/390/320px lulus dengan API mock serta
  seluruh writes/jaringan luar diblokir. Dua batch desktop/mobile diinspeksi;
  detector terarah 0 temuan (percobaan awal berhenti karena opsi format salah).
  Lint, TypeScript dan build produksi app/API lulus. Ini bukan runtime produksi,
  pengujian sinkronisasi Cal.com/provider delivery atau pentest Strix.
- Pemilik mengonfirmasi SQL87 berhasil dijalankan pada 3 November 2026.
  Urutan rilis: push API sebelum app; push bukan bukti deployment produksi.
  Tidak ada env baru. Agen tidak menjalankan SQL produksi/AI/email/outreach/
  cleanup, mengubah instrumen/skor/izin/retensi, atau memutasi program PFA2026.
  Scheduler tetap pending migrasi Vercel + Pro.
- Batch berikutnya: arsip kampanye, lalu integrasi/arsip AMS sesuai R07/R10.

### Batch 15 - 3 November 2026: penyederhanaan operasional kampanye

- Pemilik memprioritaskan kemudahan admin inbound/outbound, bukan menambah
  newsletter atau pengiriman promosi ke kontak lama. App 0.51.10 menyederhanakan
  alur yang sudah ada. Warna, font, kontrol dan pola admin dipertahankan sesuai
  mode Operate Impeccable; ini bukan penggantian identitas visual BinaHub.
- Outbound menjadi empat langkah nyata: Penerima, Email, Tinjau, Hasil. Hanya
  langkah aktif yang ditampilkan; pilihan tetap saat kembali atau mengganti
  bahasa. Fokus/navigasi mengantar ke langkah berikutnya. Persetujuan daftar,
  pemeriksaan penerima, template yang disahkan, email uji opsional, dan dialog
  konfirmasi terakhir tetap berlaku. Mengganti langkah tidak mengirim email.
- Asal daftar outbound baru dapat disiapkan di dalam modal pembuatan kampanye.
  Kunci sumber dibuat otomatis, tetapi dasar penggunaan, retensi, pemilik/legal,
  pemberitahuan privasi, catatan dan persetujuan tetap diisi admin berwenang.
  Tidak memilih lawful basis, mengasumsikan consent, atau menetapkan masa simpan
  untuk pengguna. Sumber yang disetujui dapat dipakai admin berikutnya melalui
  API existing; ini tidak mengubah RBAC atau mengesahkan semua alamat email.
- Inbound memisahkan daftar kampanye dari pembacaan respons. Form ringkas memakai
  aksi campaign existing untuk sumber inbound yang sudah siap; penanggung jawab
  ditawarkan dari sesi admin dan dapat diperiksa. Kode/UTM dibuat otomatis,
  tujuan dibatasi ke landing rekomendasi yang sudah memiliki pelacakan dan
  diagnosis tim/org. Tidak menebak tautan kampanye lama atau menawarkan tautan
  dari sumber yang belum disetujui/aktif. Tautan disalin untuk dibagikan di luar
  sistem, bukan mengirim email/memasang iklan. Tujuan katalog langsung tidak
  ditawarkan karena bukti pelacakan pada app belum setara jalur tersebut.
- Data/sumber/status kampanye, riset prospek, uji tautan dan kontrol antrean tetap
  tersedia melalui pengaturan lanjutan. Ringkasan CRM tidak mendominasi layar
  kampanye. Rincian kunjungan inbound menggunakan pengungkapan bertahap.
- Pilihan/isian outbound dijaga saat berpindah kampanye/tab workspace atau
  meninggalkan halaman. Ini bukan draf permanen atau concurrency lock antar-admin.
  Read campaign/response mempunyai cancellation, late-response guard dan timeout;
  pengiriman stale ditahan saat gagal/berganti bahasa. Retry setelah penyimpanan
  berhasil memanggil pembukaan/refresh, bukan otomatis membuat kampanye lain.
  Penyiapan sumber juga memeriksa kembali kunci sumber yang sama setelah koneksi
  putus. Request key/konfirmasi pengiriman, settings version dan gate server
  existing tidak dihapus. Antrean lama tidak otomatis diulang.
- Batas arsip tetap jelas: target/delivery hingga 500 terbaru; inbound hingga
  100 kunjungan, 500 aktivitas dan 300 hubungan kontak. Ringkasan analitik seluruh
  sampel tidak mengikuti pencarian, bukan orang unik atau total sepanjang waktu.
  Full server-side campaign pagination R07 tetap belum selesai; penyederhanaan
  UI tidak menghapus batas itu atau mengklaim seluruh kesiapan produksi selesai.
- Bukti lokal: 557 tes app/91 file lulus; 48 skenario Chromium di 1440/1024/390/
  320px lulus memakai API in-memory. Semua writes nyata dan jaringan luar diblokir;
  termasuk pembuatan sumber/kampanye serta send yang hanya mengubah fixture.
  Dua putaran desktop/mobile diinspeksi, detector terarah 0 temuan. Lint,
  TypeScript dan build produksi lulus. Kegagalan preview awal karena konfigurasi
  domain publik Vite diperbaiki tanpa memuat env/kredensial produksi.
  Ini bukan bukti runtime auth/database, inbox delivery, pelacakan lintas-domain
  produksi, pentest Strix atau pengujian pengguna nyata dengan admin baru.
- Panduan operasional: `docs/campaigns-admin-guide.md`. Tidak ada SQL/env baru,
  perubahan API, AI/email/outreach/scheduler/cleanup produksi, atau perubahan
  instrumen/skor/izin peserta/hasil historis/PFA2026. Scheduler tetap pending
  migrasi workspace Vercel BinaHub + Pro. Rilis ini hanya app; tidak memerlukan
  deploy API baru. Berikutnya tetap pagination arsip kampanye dan integrasi AMS.

### Batch 16 - 4 November 2026: arsip kampanye

- App 0.51.11/API 0.47.14 menambah entry Arsip kampanye yang tidak bergantung
  pada dashboard/daftar operasional. SQL88 mencari/filter sebelum pagination
  20 catatan dan jumlah eksak; urutan timestamp + UUID stabil. Status selesai,
  sumber yang dijeda dan status lama tetap dapat ditemukan. Ringkasan lingkup
  sebelum filter dibedakan dari jumlah cocok; bukan snapshot yang dibekukan.
- Penerima, pengiriman, impor, audit admin, kunjungan dan aktivitas kunjungan
  dibaca terpisah dengan scope UUID. Kunjungan memakai bukti UTM sentuhan pertama
  secara eksak (kode, sumber/media bila dikonfigurasi), bukan sentuhan terakhir.
  UTM yang dipakai ulang bisa cocok pada beberapa kampanye; bukan orang unik
  atau bukti kausal konversi. Satu perjalanan dihitung sekali meski banyak event.
- SQL service-role-only dan GET admin/rate-limit/no-store. DTO mengecualikan
  raw_data/config sumber, metadata event, isi email, token/tautan bertanda tangan,
  error dan ID provider. Status diterima provider bukan inbox; email uji terpisah.
  Reader tidak mengubah approval/izin, audience, antrean atau retensi.
- UI memakai pola admin existing; loading/error/SQL88/empty dibedakan. Filter
  tetap saat retry/kembali; page reset/clamp, debounce, timeout 20 detik,
  cancellation/late response dan guard pilihan penerima saat membuka arsip.
  Maksimum 10.001 halaman per pencarian dinyatakan; perinci filter untuk hasil
  di atas batas itu. Tidak memulihkan data yang telah dihapus karena retensi.
- Batas daftar operasional legacy (target/delivery 500; analitik inbound sampel
  100/500/300) tetap dinyatakan dan tidak menjadi total arsip. Pengiriman tetap
  memakai safety gate existing; reader baru tidak membuka pengiriman ke data
  tambahan. Pagination sumber/governance legacy bukan klaim selesai batch ini.
- Bukti lokal: 564 tes app; 1.142 tes API lulus/6 skip existing; 29 tes baru
  SQL/API (termasuk >1.000 data sintetis pada beberapa arsip) dan 7 komponen.
  Lint/TypeScript/build app/API lulus. 40 skenario Chromium di 1440/1024/390/320
  lulus; dua putaran visual desktop/mobile, detector terarah 0 temuan. Mock
  in-memory memblokir writes nyata/jaringan luar. Ini bukan runtime produksi,
  live deliverability, uji pelacakan lintas domain atau pentest Strix.
- Operator mengonfirmasi SQL88 berhasil dijalankan pada 4 November 2026.
  Urutan rilis SQL88 → API → app. Tidak ada env baru. Scheduler tetap pending
  migrasi akun Vercel BinaHub + Pro; tidak menjalankan email/AI/cleanup produksi,
  mengubah instrumen/skor/izin/retensi atau menyentuh PFA2026. AMS berikutnya;
  pemilik juga meminta perapihan website-prod dengan Unslop setelah batch ini.

### Batch 17 - 4 November 2026: perapihan UI app dan AMS

- App0.51.12 dan AMS0.11.5/web0.10.5 menerapkan prinsip Unslop pada shell dan
  komponen bersama: hierarki tenang, metadata terbaca, tabel normal-case, angka
  sejajar/tabular, serta input mobile16px. Identitas navy/gold dan font dipertahankan.
- App: sidebar/search/breadcrumb, target fokus, formulir dan statistik bersama,
  helper/footnote diagnosis dan PE. AMS: shell admin/reviewer/associate, tombol,
  pencarian, tab, status tanpa ping dan kartu statistik tanpa hover-translate.
- Menu mobile AMS memiliki nama kontrol, focus loop/Escape/return; popup
  notifikasi tidak keluar viewport. Styling tabel screen-only, CV/PDF terpisah.
- Bukti:568 tes app/93 file lulus; lint/types app lulus; build app97/97 halaman.
  AMS14 kontrak lokal lulus; build web final38/38 termasuk lint/types lulus.
  30 pemeriksaan fixture workspace +20 publik pada1440/1024/768/390/320px lulus.
  Browser memakai API sintetis dan memblokir writes/jaringan produksi; bukan bukti
  runtime data/auth, inbox, provider fallback atau semua inner section diaudit.
- Tidak ada API/SQL/env, perubahan izin/skor/harga, pengiriman/email/AI,
  aktivasi scheduler atau sentuhan pada PFA2026. API AMS tetap0.11.2.
  Bukan redesign seluruh halaman, pentest Strix atau klaim WCAG lengkap.
- Checklist UAT sales5November disiapkan di `docs/sales-uat-meeting-2026-11-05.md`.
  Jadwal/migrasi tetap ditunda; proposal final/custom dan handoff AMS otomatis
  tidak dinyatakan siap. Push dan deployment tetap dibuktikan terpisah.

### Batch 18 - 4 November 2026: recovery laporan melalui Supabase Cron

- Pemilik memilih pola SLJ. API0.47.15/SQL89 memasang satu job recovery laporan
  per menit, **nonaktif pada pemasangan awal**. Kontrol/status operator-only,
  secret existing disimpan di Vault, tujuan HTTPS tetap; tidak menyalin secret
  atau konfigurasi project SLJ. Tidak menunggu Vercel Cron/Pro untuk pemicu ini.
- Worker diagnosis tim/org, email individu dan rekomendasi program yang sudah
  ada tetap dipakai. Request antre/in-flight dibatasi; reapply mempertahankan
  job ID/status aktif-jeda. Probe HEAD405 tidak memproses pekerjaan; GET memakai
  Bearer/no-store. Queue lease/backoff, hasil uncertain dan heartbeat tetap berlaku.
- SQL89 membatasi browser/PUBLIC membaca header sementara di antrean pg_net.
  Tidak membuat jadwal outreach, AMS atau PETA; retensi PETA tetap bulanan pada
  konfigurasi existing. Retensi PE existing ikut worker setelah aktivasi,
  bukan dijalankan oleh migration. Pemeriksaan status bukan probe provider.
- Bukti lokal:46 tes terarah lulus; unit API1165 lulus/6 dilewati,152 file
  lulus/4 dilewati; lint/types/build produksi lulus. PL/pgSQL/role/transaksi
  diuji dengan PGlite, extension Cron/Net/Vault berupa fixture; bukan bukti
  extension native atau scheduler/email/AI produksi telah berjalan.
- Operator melaporkan SQL89 berhasil dijalankan pada4November; ini bukan
  pemeriksaan langsung produksi. Berikutnya isi Vault `binahub_report_worker_secret`
  dari `FOLLOW_UP_CRON_SECRET` produksi API, memverifikasi deployment/antrean dan
  mengaktifkan secara eksplisit. Tidak ada nama env baru. Panduan:
  `binahub-api/docs/SUPABASE-REPORT-SCHEDULER.md`. Tidak mengaktifkan worker,
  menjalankan SQL produksi, mengirim email/AI atau menyentuh PFA2026 saat tes.

#### Koreksi CI setelah batch18

- API GitHub quality gagal pada satu tes SPIN yang membaca sibling app checkout.
  Vercel deployment dilaporkan berhasil pada screenshot pengguna; CI gagal ini
  terpisah dari SQL89 dan bukan bukti query database gagal.
- API0.47.16 mengganti ketergantungan sibling dengan fingerprint kontrak publik
  yang dipin di kedua repo. App CI juga memeriksa source lokalnya terhadap
  fingerprint yang sama, tanpa skip jika sibling tidak ada. Form runtime,
  validasi jawaban, SQL89 dan pengiriman tidak diubah.
- Reproduksi lokal source-only dari Git index tanpa sibling app/env produksi:
  1163 tes publik/151 file lulus,3 tes/1 file dilewati; types/lint,3 kontrak
  dependency dan build dengan env sintetis lulus.4 kontrak Node pada app lulus.
  Ini bukan klaim remote GitHub sudah hijau. Satu tes loopback provider sempat
  gagal pada putaran awal lalu lulus terpisah dan pada rerun penuh; tidak memakai
  provider nyata atau mengubah routing AI untuk hotfix ini.

### Batch19: demo paket individu sebelum Mayar

- User meminta demo PE/RM untuk5November dengan pembayaran simulasi; publik tetap
  Coming soon. App0.51.13/API0.47.17 menyediakan pemilihan paket, contoh checkout
  berhasil/gagal, bank lengkap PE24+12/RM27+13, tinjau pilihan dan hasil server.
- Skor gabungan sementara50:50, metode tetap terpisah. RM tidak menyebarkan kredit
  SJT ke kompetensi tanpa aturan CEO. Tidak ada kategori/norma/interpretasi atau
  rekomendasi personal rekaan; laporan komersial final tetap belum diaktifkan.
- Draft demo scoped admin/sumber pada tab browser, dapat dipulihkan24jam. Bukan
  arsip peserta, transaksi atau entitlement. Tidak mengirim email/AI, membuat
  antrean baru, mengubah instrumen/hasil lama, retensi gratis atau PFA2026.
- API13 tes khusus +1177 regresi sintetis lulus,2 dilewati. App578 tes/96file
  lulus. Uji browser4 perjalanan lulus (PE/RM desktop/mobile),7 kontrak Node lulus,
  lint/types dan build API133/133 +app98/98 lulus dengan env sintetis. Review UI
  menutup dua temuan label skor aksesibel dan pemulihan jaringan. Status deploy
  dan smoke test admin bank produksi harus
  dicatat terpisah, tidak diartikan dari fixture sintetis.
- Tidak ada SQL/env baru. API0.47.17 harus dirilis sebelum app0.51.13. Panduan:
  [demo individu](individual-paid-demo-2026-11-05.md).
