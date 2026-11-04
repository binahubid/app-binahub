# Demo paket individu PE dan RM — 5 November 2026

Tujuan: CEO dapat mencoba perjalanan paket berbayar sebelum integrasi Mayar.
Pembayaran saja yang ditampilkan sebagai simulasi; soal dari bank terpasang dan
skor benar-benar dihitung server. Ini demo internal, bukan pembukaan penjualan.

## Cara membuka

1. Masuk ke app BinaHub sebagai admin masing-masing.
2. Buka **Diagnosis individu → Uji coba paket PE & RM**, atau langsung
   `https://app.binahub.id/admin/assessments/individual/trial`.
3. Pembaruan app0.51.14: tidak ada tautan simulasi pada halaman paket publik,
   termasuk ketika admin sedang masuk. Demo hanya melalui dashboard admin atau
   URL langsung di atas. Publik tetap **Coming soon** tanpa akses API demo.

## Alur yang dicoba

1. Pilih PE (rencana Rp59.000) atau RM (rencana Rp89.000).
2. Lihat ringkasan pesanan dan contoh pilihan QRIS/virtual account.
   Ditagih sekarang **Rp0 · simulasi**; tidak ada QR/rekening/transaksi asli.
3. Coba tombol simulasi gagal, lalu berhasil. Tidak ada penagihan atau hak akses
   komersial yang dibuat. Konfirmasi petunjuk, lalu mulai Self Diagnostic.
4. Jawab seluruh pertanyaan: **PE24 pengalaman nyata +12 studi kasus, enam
   kompetensi; RM27+13, sembilan kompetensi**. Bank RM27, bukan angka24 pada
   dokumen laporan lama. Soal dan kunci tidak diganti dengan data sintetis.
5. Kembali ke pertanyaan sebelumnya, ubah pilihan, tinjau soal dan jawaban terpilih.
   Tombol Lihat jawaban berikutnya membatasi panjang ringkasan.
6. Kirim untuk melihat skor gabungan dan rincian pengalaman nyata/studi kasus.
   Perhitungan tidak bergantung pada provider AI; tidak ada panggilan AI berbayar.

## Membaca hasil

- Skor memakai jawaban demo, bukan angka contoh. Bobot gabungan sementara50:50.
- PE: skor masing-masing metode dan gabungan per kompetensi. Ringkasan modul
  merata-ratakan keenam kompetensi untuk setiap metode, kemudian menggabungkan
  keduanya50:50. NA tidak dihitung sebagai nol; bukti yang belum cukup tetap kosong.
- RM: pengalaman nyata dan studi kasus serta gabungan tersedia untuk modul.
  Pengalaman nyata juga terurai per kompetensi. **Bobot SJT ke setiap kompetensi
  belum ada**: skor SJT/gabungan per kompetensi sengaja belum ditampilkan. Tidak
  menebak bobot dari tag bank soal. Ini yang masih perlu keputusan CEO.
- Tidak mengarang kategori, norma, validasi, narasi kemampuan, atau rekomendasi
  program. Laporan demo ini ringkasan skor/rencana refleksi, belum laporan
  personal berbayar final dengan interpretasi dan program yang disahkan.

## Batas demo yang perlu dijelaskan

- Khusus admin, gunakan jawaban uji. Tidak meminta nama/email/data kartu.
- Draft dapat dipulihkan maksimal24jam di tab/browser/admin yang sama, terikat
  versi sumber. Menutup tab dapat menghapusnya. Bukan penyimpanan peserta di server.
- Jika refresh setelah hasil, pilih paket yang sama lalu kirim ulang dari review
  untuk menghitung hasil kembali. Penghitungan tidak membuat transaksi ganda.
- Jika koneksi gagal, jangan tutup tab; coba lagi. Jika versi sumber berubah,
  mulai uji coba versi terbaru. Kunci jawaban/key action tetap di server.
- Tidak mengirim laporan/email, tidak mencatat pembayaran sungguhan, tidak memberi
  entitlement, tidak membuat riwayat peserta, tidak menyalakan worker baru.
- Alur gratis, hasil historis dan kebijakan akses/retensi gratis tidak diubah.
- LE/WBR/paket lengkap tetap belum tersedia untuk uji karena sumber belum siap.

## Persiapan operator dan bukti uji

- Deploy API0.47.17 sebelum app0.51.13. Tidak perlu SQL/env baru; private bank PE
  dan RM tetap prasyarat yang sudah ada. GET demo503 berarti sumber belum tersedia
  atau integritasnya bermasalah, bukan alasan untuk memakai soal rekaan.
- Akun admin CEO harus bisa masuk; tidak perlu membuka data/key hosting ke CEO.
- Uji lokal: API13 tes khusus demo, regresi1177lulus/2dilewati; app578tes/96file
  lulus;7kontrak Node; empat perjalanan browser (PE/RM × desktop/mobile) lulus.
  Lint/types dan build API133/133, app98/98 lulus. Fixture pengujian sintetis.
- Fixture browser bukan bukti bank/akun/versi produksi telah diuji. Sebelum meeting
  lakukan satu smoke test admin dengan bank terpasang untuk masing-masing paket.
- Mayar sandbox/merchant, webhook idempoten, identitas pelanggan, hak akses,
  riwayat/pengiriman laporan, ketentuan komersial dan laporan personal final tetap
  jalur berikutnya sebelum membuka penjualan publik.

## Scheduler bukan sakelar paket

Status operator4November menunjukkan Cron aktif dan worker menerima request200
pada13:42WIB. Itu pemulihan antrean laporan yang sudah didukung, bukan aktivasi
RM berbayar. Demo ini menghitung hasil langsung; tidak memerlukan scheduler tambahan.

## Verifikasi rilis — 4 November 2026

- API0.47.17 `0950f93` dan app0.51.13 `225d5b7` dipush ke main repo resmi
  `binahubid`, bukan mirror GM-Builder. Kedua pemeriksaan CI selesai sukses;
  status deployment Vercel API sukses.
- Endpoint demo RM produksi tanpa autentikasi mengembalikan401 dan pesan akses
  admin. Halaman admin mengarahkan pengunjung tanpa sesi ke login; ini perilaku
  yang diharapkan, bukan bukti soal bisa dibuka tanpa izin.
- Pada rilis0.51.13 bundle pricing publik sempat memuat tautan khusus admin.
  Pemilik kemudian meminta penghapusan: app0.51.14 tidak lagi menawarkan tautan
  simulasi di pricing publik. Akses tetap melalui dashboard admin/URL langsung.
  Pemeriksaan rilis tidak mengambil sesi, kunci, atau data peserta.
- Browser lokal dinonaktifkan di Work settings, sehingga smoke test dengan akun
  admin dan bank produksi belum dilakukan oleh agen. Operator perlu membuka
  tautan demo setelah masuk dan mencoba PE serta RM sebelum meeting. Jangan
  menyamakan fixture sintetis/CI sukses dengan verifikasi bank produksi.
