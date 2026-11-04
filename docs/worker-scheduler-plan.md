# Rencana scheduler operasional BinaHub

## Pembaruan 4 November 2026 — mengikuti pola SLJ

Pemilik meminta memeriksa SLJ dan menggunakan caranya jika sesuai. Pemeriksaan
source menunjukkan pola yang sesuai: Supabase Cron (`pg_cron`) memanggil HTTP
melalui `pg_net`; fungsi terautentikasi mengambil pekerjaan dari database.
Ini menjadi arah scheduler BinaHub, menggantikan ketergantungan jadwal pada
migrasi Vercel Pro. Migrasi kepemilikan/hosting tetap pekerjaan terpisah, bukan
dibatalkan atau dianggap selesai. Tidak ada scheduler produksi diaktifkan oleh
pembaruan dokumen ini.

Bukti source lokal SLJ:

- `slj-binahub/supabase/cron-setup.sql`: jadwal `slj-send-user-reminders` per menit,
  HTTP POST ke Edge Function dengan credential khusus reminder.
- `slj-binahub/supabase/functions/send-user-reminders/index.ts`: pemeriksaan
  `x-cron-secret`, pembuatan reminder, pengambilan antrean dan pengiriman Web Push.
- `slj-binahub/src/lib/web-push.ts`: izin browser dan subscription perangkat.

Yang diperiksa adalah kode/configuration template, bukan `cron.job` atau riwayat
pengiriman produksi SLJ. Web Push adalah kanal pengiriman; Cron adalah pemicu
waktu. Tidak perlu menambahkan Web Push ke BinaHub hanya untuk memakai Cron.

Penerapan berikutnya:

Implementasi API0.47.15 / SQL89 disiapkan pada 4 November: satu job recovery
laporan, nonaktif saat pertama dipasang, kontrol/status hanya operator database,
credential Vault, target HTTPS tetap dan pembatasan request antre/in-flight.
Lihat `binahub-api/docs/SUPABASE-REPORT-SCHEDULER.md` untuk setup sekali jalan.
Pemilik melaporkan SQL89 berhasil dijalankan pada4November, Vault telah diisi dan
job diaktifkan. Status yang dikirim operator menunjukkan `active:true`,
`accepted_by_worker`, HTTP200 pada13:42WIB. Ini bukti penerimaan worker yang
dilaporkan operator, bukan inspeksi langsung database atau bukti semua laporan/email
selesai. Tidak perlu cron baru untuk demo RM; demo dihitung langsung.

1. Supabase Cron memanggil worker BinaHub yang sudah ada, bukan menyalin fungsi
   reminder SLJ atau membuat antrean kedua. `/api/assessment/worker` memakai GET
   dengan Bearer `FOLLOW_UP_CRON_SECRET`; jangan menyalin POST/header SLJ mentah.
2. Simpan credential khusus BinaHub di Vault; tidak menyalin secret, service-role
   key, VAPID key atau konfigurasi project SLJ. Jangan memasukkan nilainya ke
   Git, URL, chat atau SQL setup yang dipublikasikan. Batasi akses antrean HTTP
   database yang dapat memuat header saat pengiriman.
3. Mulai dari recovery laporan per menit setelah uji terisolasi, konfigurasi
   tujuan/credential dan pemeriksaan kapasitas. Queue/lease/retry/heartbeat tetap
   di worker/database. Jangan menganggap keberhasilan enqueue HTTP sebagai
   keberhasilan analisis AI atau email diterima.
4. Hanya satu scheduler per pekerjaan. Retensi PETA sudah tercantum di
   `binahub-api/vercel.json` bulanan; jangan membuat salinan Supabase sebelum
   pemindahan jadwal lama dikoordinasikan. AMS dan outreach tidak otomatis ikut
   aktif ketika recovery laporan disiapkan.
5. Pastikan HTTP worker, heartbeat, hasil pekerjaan dan kegagalan dapat ditinjau.
   Cron yang berjalan tidak berarti seluruh job/email selesai. Tidak mengubah
   batas hosting atau ketentuan penggunaan paket tempat API berjalan.

Acuan resmi: [Supabase Cron](https://supabase.com/docs/guides/cron) dan
[penjadwalan HTTP/Edge Functions dan Vault](https://supabase.com/docs/guides/functions/schedule-functions).

## Riwayat keputusan 31 Oktober 2026

Status 31 Oktober 2026: n8n lokal di laptop; API Vercel Hobby pada akun pribadi
pemilik. Pemilik menyetujui Vercel Pro setelah migrasi ke akun/workspace BinaHub,
yang belum dibuat. Persetujuan ini tidak mengizinkan upgrade atau migrasi sekarang.
Dokumen ini bukan bukti worker produksi sudah berjalan.

## Rekomendasi sebelumnya — digantikan pembaruan 4 November

Gunakan Vercel Pro + Cron setelah project dipindahkan ke workspace BinaHub dan
paket Pro dikonfirmasi aktif. Tidak perlu menjalankan VPS/n8n hanya
untuk memanggil endpoint berkala. Simpan n8n lokal sebagai lingkungan uji.

Menurut [harga resmi](https://vercel.com/docs/plans/pro-plan), Pro memiliki biaya
dasar USD20/bulan termasuk satu deploying seat dan USD20 kredit pemakaian; pemakaian
tambahan, seat/add-on dan pajak dapat menambah biaya. Konfirmasi ulang saat aktivasi.
[Cron](https://vercel.com/docs/cron-jobs/usage-and-pricing) Pro mendukung per menit,
sedangkan Hobby minimal harian. [Hobby](https://vercel.com/docs/plans/hobby) dibatasi
untuk penggunaan pribadi nonkomersial. Mengganti scheduler saja tidak mengubahnya.

Selama migrasi belum siap, jangan memaksa cron berfrekuensi tinggi ke konfigurasi
Hobby, meng-upgrade akun pribadi, atau menjadikan laptop sebagai ketergantungan
produksi. Perbaikan kode dan pengujian lokal tetap dapat dilanjutkan.

## Prasyarat migrasi yang ditunda

1. Pemilik menyiapkan akun dan workspace/team milik BinaHub untuk kepemilikan dan
   penagihan, lalu menentukan waktu pelaksanaan migrasi.
2. Gunakan alur Transfer Project yang didukung Vercel, bukan menghapus project
   lama atau membuat salinan produksi yang dapat menggandakan jadwal.
3. Periksa domain/SSL, koneksi GitHub, environment per lingkungan, integrasi,
   cron yang sudah ada, serta akses operator pada tujuan. Jangan menganggap semua
   integrasi dan konfigurasi sensitif berpindah otomatis; jangan menyalin secret
   ke Git/chat. Perubahan paket/metode pembayaran tetap ditangani pemilik.
4. Konfirmasi Pro aktif pada tujuan sebelum memasang cron berfrekuensi tinggi.
5. Verifikasi deployment dan alur layanan, lalu aktifkan recovery bertahap sesuai
   urutan di bawah. Outreach tidak ikut diaktifkan secara otomatis.

Acuan saat pelaksanaan: [transfer project resmi](https://vercel.com/docs/projects/transferring-projects).
Belum ada akun dibuat, project dipindahkan atau konfigurasi produksi diubah oleh
pekerjaan pencatatan keputusan ini.

## Pisahkan jenis pekerjaan

| Jenis | Tujuan | Usulan awal, belum diaktifkan |
| --- | --- | --- |
| Pemulihan laporan | Melanjutkan tugas/email hasil yang tertunda | Per menit, batch dan lease terbatas |
| AMS | Memproses event integrasi yang tertunda | Tiap 5 menit setelah deployment/otorisasi diverifikasi |
| Outreach/follow-up | Menghubungi calon klien sesuai persetujuan dan suppression | Aktivasi terpisah; bukan otomatis mengikuti worker pemulihan |
| Retensi PETA | Menghapus data yang melewati retensi satu tahun | Tetap tanggal 1 pukul 00 UTC/07 WIB, sesuai keputusan pemilik |

Angka interval adalah titik awal, bukan jaminan kapasitas. Ukur umur antrean,
durasi dan throughput sebelum menaikkan batch/konkurensi. Antrean persisten di
database tetap menjadi sumber status; scheduler hanya pemicu, bukan tempat data
peserta atau logika bisnis. Jangan memasukkan jawaban, kontak atau kunci API AI
ke URL/log/workflow scheduler.

## Urutan aktivasi

1. Selesaikan retry terbatas, idempotensi dan penanganan gagal analisis AI.
2. Siapkan autentikasi cron, heartbeat, deteksi antrean terlambat dan kanal alarm.
3. Pastikan ada satu scheduler untuk tiap pekerjaan, bukan n8n dan Cron bersamaan.
4. Konfirmasi migrasi selesai dan Pro aktif di workspace BinaHub; gunakan secret
   di penyimpanan environment platform dan
   pasang batas/peringatan pemakaian. Jangan menyalin secret ke Git atau chat.
5. Uji satu siklus memakai data sintetis/penerima internal yang disetujui, tanpa
   memproses antrean outreach nyata secara tidak sengaja. Verifikasi hasil dan
   ulang pemanggilan tidak menggandakan email/tindakan.
6. Aktifkan recovery bertahap, pantau heartbeat dan umur antrean; outreach tetap
   memerlukan aktivasi operator terpisah. Kegagalan tidak dianggap pekerjaan selesai.

Cron sendiri bukan retry queue. [Vercel tidak otomatis mengulang panggilan cron
yang gagal](https://vercel.com/docs/cron-jobs/manage-cron-jobs); retry/backoff,
lease dan rekonsiliasi harus tetap di kode/database. Operator harus memiliki cara
melihat kegagalan dan mencoba ulang secara aman.

Dokumen ini tidak mengubah vercel.json, menjalankan SQL, memasang workflow n8n,
mengaktifkan pengiriman atau memanggil provider AI. Program PFA2026 tidak disentuh.
