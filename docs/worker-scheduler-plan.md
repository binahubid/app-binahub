# Rencana scheduler operasional BinaHub

Status 31 Oktober 2026: n8n lokal di laptop; API Vercel Hobby pada akun pribadi
pemilik. Pemilik menyetujui Vercel Pro setelah migrasi ke akun/workspace BinaHub,
yang belum dibuat. Persetujuan ini tidak mengizinkan upgrade atau migrasi sekarang.
Dokumen ini bukan bukti worker produksi sudah berjalan.

## Rekomendasi

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
