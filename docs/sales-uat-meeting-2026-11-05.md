# Checklist meeting uji coba sales BinaHub

Untuk 5 November 2026 · disiapkan 4 November 2026.

Tujuan: admin dapat menjalankan satu perjalanan penjualan dan mengetahui siapa
yang bertindak berikutnya. Ini uji penerimaan terbatas, bukan persetujuan blast,
aktivasi scheduler atau pernyataan semua alur produksi sudah terbukti.

## Ringkasan kesiapan

- Kode tersedia: workspace Prioritas, Inbound, Outbound, Klien & proposal,
  Tindak lanjut, Peluang dan Konsultasi; checklist meeting kebutuhan program;
  arsip kampanye dengan pencarian/pagination server. SQL88 sudah dikonfirmasi
  operator. API0.47.14 sudah dipush; versi hosting tetap perlu diperiksa.
- UI bersama app0.51.12 dan AMS0.11.5/web0.10.5 sedang dirilis terpisah dari
  API. Build dan tes lokal bukan bukti deployment, autentikasi/inbox produksi.
- Arah scheduler diperbarui 4 November: Supabase Cron mengikuti pola SLJ;
  belum diaktifkan. Migrasi workspace Vercel BinaHub + Pro tetap terpisah.
  Tombol “Diizinkan”/kampanye aktif tidak membuktikan worker berjalan berkala.
- Proposal indikatif bukan penawaran komersial final. Catatan meeting disimpan
  terpisah dari jawaban/laporan klien; bukan otomatis membuat/mengirim proposal
  revisi. Meeting → draf proposal otomatis dan handoff AMS penuh masih pekerjaan
  lanjutan yang belum boleh didemokan sebagai kemampuan selesai.
- Pembayaran individu/produk Coming soon tetap terkunci, bukan scope uji sales.

## Sebelum meeting — tim teknis/operator

- [ ] Periksa hasil deployment app/API/website/AMS dan tujuan branch yang benar.
  Catat versi/commit aktual, jangan hanya status push. Buka satu modul admin
  untuk memastikan tidak ada error fungsi SQL88; tidak perlu replay SQL lama.
- [ ] Siapkan akun admin masing-masing peserta. Jangan berbagi satu password;
  tidak perlu memberi semua orang akses hosting/database. Satu orang menjadi
  operator worker, satu pencatat, satu admin yang belum terbiasa menguji UX.
- [ ] Siapkan mode utama di staging/preview dengan data sintetis. Jika terpaksa
  memakai produksi, gunakan record berawalan `UAT-SALES-20261105`, penerima internal
  yang disetujui, dan satu penanggung jawab; jangan mengubah data klien nyata.
- [ ] Siapkan 2–3 inbox internal yang pemiliknya setuju, dapat dibuka saat meeting.
  Jangan memakai daftar klien untuk sekadar membuktikan pengiriman.
- [ ] Periksa sender/reply-to dan konfigurasi autentikasi domain email pada
  penyedia. Bedakan diterima provider, sampai inbox/spam, dan benar-benar dibaca.
- [ ] Periksa konfigurasi/kuota provider AI dan jalur fallback yang disetujui
  melalui panel aman. Jangan menyalin API key ke chat, slide atau rekaman layar.
  Batas biaya dan siapa yang boleh menjalankan satu analisis nyata disepakati.
- [ ] Siapkan tautan kampanye inbound dengan kode unik, tujuan yang benar, serta
  satu sumber data uji yang sudah ditinjau. Jangan memakai UTM kampanye nyata.
- [ ] Periksa antrean dan kendala di Kesiapan layanan. Bila akan memproses manual,
  periksa cakupan endpoint, record due lain dan apakah pemanggilannya global.
  Jangan klik kontrol global di produksi bila dapat mengirim ke klien lain.
  Jika tidak dapat diisolasi, cukup simulasi; jangan mengubah jadwal/izin klien.
- [ ] Siapkan desktop, satu ponsel, browser incognito untuk peran klien,
  koneksi cadangan, dan lembar temuan di bagian akhir dokumen ini.

Tidak ada izin email/AI/worker produksi baru yang diberikan oleh checklist ini.
Tiap tindakan nyata tetap memerlukan persetujuan pemilik dan penerima uji.

## Yang dibawa atau diputuskan CEO

### Minimum agar hasil meeting bisa dinilai

1. **Target penjualan pertama:** segmen perusahaan, peran pengambil keputusan,
   masalah utama, serta batas kebutuhan yang tidak cocok untuk program BinaHub.
   Bukan sekadar “semua perusahaan”. Pilih satu segmen dulu untuk uji.
2. **Tiga kasus contoh dan jawaban acuan:** dua kasus yang memang cocok ke
   katalog dan satu kasus kompleks/kurang jelas. Untuk setiap kasus tentukan
   fokus kompetensi, 1–3 program yang masuk akal, alasan, dan kapan konsultasi
   lebih tepat daripada memaksakan program. AI dinilai terhadap acuan ini.
3. **Katalog yang dapat dijual sekarang:** kode/nama, kaitan kompetensi,
   sasaran, hasil/deliverables, durasi, kapasitas peserta, cakupan dan harga/satuan
   yang disahkan. Jangan menganggap kelengkapan jawaban menjamin semua program cocok.
4. **Batas penawaran:** mana indikatif vs final, yang termasuk/tidak termasuk,
   kewenangan diskon/negosiasi, siapa menyetujui scope dan harga. Ketentuan pajak,
   perjalanan, masa berlaku dan pembayaran harus dikonfirmasi, bukan ditebak AI.
5. **Asal daftar dan hak penggunaan:** sumber yang boleh dipakai, dasar penggunaan
   yang sudah ditinjau organisasi, URL pemberitahuan privasi, masa simpan,
   pemilik data dan penanggung jawab legal. Jika belum jelas, uji inbox internal
   saja; fitur sumber data tidak menentukan dasar hukum bagi organisasi.
6. **Pembagian pekerjaan:** siapa pemilik lead, membalas inquiry, menjadi konsultan,
   menyetujui proposal, dan memantau kegagalan. Tentukan target waktu respons
   serta pemilik next action/tenggat; angka SLA adalah keputusan CEO, bukan
   default baru yang ditetapkan dokumen ini.
7. **Standar komunikasi:** persetujuan template outbound/balasan/follow-up,
   identitas pengirim, reply-to/WA/booking yang benar, bahasa dan klaim yang boleh
   dipakai. Jangan menjanjikan hasil program atau layanan yang belum tersedia.

Bila waktu persiapan terbatas, prioritaskan kasus acuan + program/harga yang
disahkan + pemilik proses. Persetujuan penggunaan kontak tetap wajib sebelum
pengiriman nyata; tidak dapat digantikan oleh target waktu meeting.

### Bisa dibahas setelah uji, tidak perlu menghambat simulasi besok

- Waktu migrasi Vercel/Pro dan aktivasi Supabase Cron yang diperiksa terpisah.
- Batas/anggaran pilot kecil, penanggung jawab insiden dan kanal alarm.
- Kontrak proposal custom final serta serah terima operasional/AMS yang lebih lengkap.
- Produk berbayar, refund, instrumen tambahan dan aturan skor final: jalur
  tersendiri, bukan prasyarat untuk mencoba rekomendasi program tim/organisasi.

## Agenda usulan — 75 menit

| Waktu | Kegiatan | Hasil yang dicatat |
| --- | --- | --- |
| 0–10 | Batas uji, peran dan kasus acuan | Tujuan, penerima internal, tidak ada blast |
| 10–25 | Inbound → form kebutuhan → laporan → admin | Jawaban tersimpan, hasil dan program relevan |
| 25–40 | Outbound → email → respons/inquiry | Kejelasan langkah, bukti pengiriman internal bila disetujui |
| 40–55 | Konsultasi → checklist → peluang | Jawaban asli/tambahan terpisah, owner/tenggat jelas |
| 55–65 | Arsip, gagal/retry dan admin baru | Bisa menemukan data, tidak ada pengiriman ganda |
| 65–75 | Tinjauan CEO dan keputusan | Penghambat, PIC, tenggat dan go/no-go pilot |

## Skenario dan kriteria lulus

| ID | Uji | Kriteria lulus / batas |
| --- | --- | --- |
| S01 | Admin baru membuka Workspace Penjualan | Dapat memilih langkah berikutnya tanpa diarahkan setiap klik; catat kebingungan, bukan hanya “tombol bekerja” |
| S02 | Buat tautan Inbound ke rekomendasi, buka sebagai klien | Kode kampanye/tujuan benar; membuat tautan tidak mengirim email; rekam perjalanan sebagai bukti UTM, bukan orang unik |
| S03 | Isi kasus kebutuhan sesuai acuan CEO | Validasi jelas, ringkasan mudah dibaca, jawaban tidak hilang, nomor referensi tersimpan sekali |
| S04 | Analisis dan laporan rekomendasi | Kompetensi/program ada di katalog dan alasannya sesuai; harga/satuan berasal dari sumber sah; kasus kompleks boleh diarahkan konsultasi |
| S05 | Outbound uji internal: Penerima → Email → Tinjau → Hasil | Penerima benar, template disetujui, navigasi tidak mengirim; satu konfirmasi akhir; satu email internal bila diizinkan |
| S06 | Inbox/reply-to/unsubscribe | Tinjau inbox/spam dan tujuan balasan; opt-out diuji pada akun internal, tidak muncul lagi sebagai layak kirim; bukan izin mengirim ulang |
| S07 | Inquiry → balasan/draf → Konsultasi | Pesan dan konteks terbaca; penerima/balasan ditinjau; perubahan status tersimpan; konsultasi internal punya tanggal/PIC benar |
| S08 | Lanjutkan kebutuhan klien saat meeting | Jawaban klien terlihat; “Hanya yang belum diisi” membantu; tambahan tersimpan terpisah dan laporan asli tidak berubah |
| S09 | Peluang → next action → proposal | Owner, tahap, catatan dan tenggat jelas; draf ditinjau manusia; tidak menganggap laporan indikatif sebagai penawaran final |
| S10 | Berhasil/Tidak lanjut dan tindak lanjut | Alasan/keputusan tercatat; lead yang dijeda/ditangani tidak didorong kirim ulang; tombol serah terima bukan bukti AMS selesai |
| S11 | Cari Arsip kampanye / data lama | Kampanye dan riwayat yang tepat ditemukan; pencarian/pagination sesuai; error tidak disajikan sebagai angka nol |
| S12 | Gangguan jaringan/provider pada lingkungan uji | Jawaban tetap, status gagal/menunggu jujur, retry terkontrol tanpa duplikasi; jangan sengaja mematikan provider produksi |

Untuk S04/S05 yang benar-benar memanggil provider: satu kasus dulu, biaya dan
alamat internal disetujui; lanjut hanya setelah bukti pertama diperiksa.
Fallback AI harus diuji di lingkungan terisolasi atau dengan gangguan tiruan;
tidak perlu mengubah secret/endpoint produksi saat demo. AI tidak dapat dijamin
selalu tersedia: kriteria andal adalah jawaban aman, status jelas dan pemulihan.

Tunggu pemrosesan sesuai kontrol yang memang tersedia. Jika worker belum aktif
dan tidak aman dipanggil secara terisolasi, catat “tertunda verifikasi”, bukan
memaksa “lulus” atau menyalahkan UI karena status belum berubah otomatis.

## Keputusan akhir meeting

- **Lulus untuk pilot terbatas:** jalur utama berhasil, output CEO setujui,
  penerima/izin jelas, ada owner dan prosedur manual selama scheduler tertunda.
- **Perlu perbaikan sebelum kirim nyata:** program/harga keliru, jawaban hilang,
  salah penerima, data lintas klien, aksi ganda, atau status sukses tanpa bukti.
- **Belum lulus otomatisasi penuh:** scheduler dan pemulihan runtime belum
  diverifikasi. Jangan memakai hasil demo untuk mengklaim layanan unattended24/7.

Catat status tiap skenario: Lulus / Gagal / Tertunda / Tidak diuji; bukan satu
angka “semua beres”. Setelah meeting, prioritas pertama adalah keselamatan data
dan pengiriman, lalu hambatan alur, baru kosmetik. Jangan menjalankan cleanup
massal; inventaris record uji untuk penanganan selektif yang disetujui kemudian.

## Lembar temuan

| ID skenario | Harapan | Yang benar-benar terjadi | Bukti/ref uji | Tingkat dampak | PIC | Tenggat | Status uji ulang |
| --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | | | |

Bukti cukup berupa referenceID, waktu WIB dan screenshot yang disamarkan.
Jangan menempelkan token, alamat kontak klien atau jawaban sensitif ke dokumen
meeting yang akan dibagikan. Penerima internal pun mengikuti aturan data yang disepakati.

## Dasar pemeriksaan

Panduan kampanye saat ini, rencana scheduler, readiness batch16, source
SalesWorkspace/SalesFollowUpControl/CampaignSourceSetup dan checklist meeting.
Graph app 2026-11-04T04:05:08Z + sumber langsung digunakan untuk memverifikasi
jalur. Panduan18Oktober berisi riwayat, bukan status pagination terbaru.
Dokumen ini tidak menjalankan deployment, provider, SQL, worker atau pengiriman.
