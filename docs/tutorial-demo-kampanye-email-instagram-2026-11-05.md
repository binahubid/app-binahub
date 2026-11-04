# Tutorial demo kampanye email dan Instagram BinaHub

Untuk meeting 5 November 2026. Disiapkan 4 November, mengikuti kode app saat ini.

Tujuan demo: menunjukkan perjalanan dari pesan/iklan, kunjungan, pengisian
kebutuhan, hingga tindak lanjut admin. Bukan blast ke klien atau peluncuran iklan.
PETA disembunyikan dari website. PE/RM berbayar masih Coming soon untuk publik;
demo pembayarannya hanya di dashboard admin, tidak dipakai sebagai tujuan iklan.

## 1. Pahami pembagian pekerjaannya

| Pekerjaan | Tempat mengerjakan | Yang terjadi |
| --- | --- | --- |
| Kirim email pertama ke daftar yang disetujui | App → Workspace Penjualan → Outbound | Pratinjau template, pilih penerima, konfirmasi kirim, pantau pengiriman |
| Buat tautan untuk iklan/sosial | App → Workspace Penjualan → Inbound | Membuat kampanye dan tautan berparameter; belum memasang iklan atau mengirim email |
| Buat/tayangkan iklan Instagram | Meta Ads Manager | Pilih akun, tujuan, audiens, penempatan, materi, anggaran dan jadwal |
| Baca kunjungan dari tautan | App → Inbound → Lihat respons | Membaca catatan kunjungan/aktivitas yang tersedia, bukan biaya iklan Meta |
| Baca permintaan rekomendasi | Workspace Penjualan → Klien & proposal → Discovery organisasi | Isian kebutuhan, status proses, laporan dan checklist meeting |

Outbound saat ini memakai template email pertama yang sudah disetujui. CTA-nya
mendukung jalur Diagnosis Tim/Organisasi dengan tautan unik. Jangan menyebutnya
email langsung ke form rekomendasi program bila pratinjau aktual tidak demikian.
Untuk demo Instagram, pilih tujuan **Rekomendasi program organisasi** secara eksplisit.

## 2. Persiapan sebelum meeting

- Siapkan akun admin BinaHub, 1–2 inbox internal yang pemiliknya setuju menerima
  email uji, serta akses inbox/spam. Tidak perlu memakai daftar prospek nyata.
- Siapkan sumber outbound dan inbound yang telah disetujui. Jika belum ada,
  penanggung jawab melengkapi asal, dasar penggunaan, URL privasi yang benar,
  masa simpan dan penanggung jawab sebelum demo. Jangan mengisi persetujuan
  rekaan agar tombol terbuka. Persetujuan sumber bukan izin otomatis setiap kontak.
- Periksa pratinjau template, identitas pengirim dan reply-to. Jika ada pesan
  “Kampanye belum siap dikirim”, selesaikan penghambat yang tertulis; jangan
  menonaktifkan pengaman. Panduan ini tidak memeriksa secret atau provider produksi.
- Siapkan akses akun iklan yang benar, Facebook Page dan Instagram BinaHub untuk
  dipilih pada bagian Identity/Identitas di Ads Manager. Jika akun belum tersedia,
  cukup demo rancangan materi + tautan; tidak perlu membuat/membeli akun saat meeting.
- Siapkan gambar milik BinaHub yang memang boleh dipakai, logo asli, dan copy
  yang disetujui CEO. Untuk contoh kerja: feed 1080×1350 dan Story/Reels 1080×1920;
  ini ukuran rancangan, bukan klaim semua format wajib memakai ukuran tersebut.
- Buka browser admin dan jendela incognito terpisah untuk bertindak sebagai klien.
  Buat sesi incognito baru ketika berpindah kanal agar atribusi kunjungan pertama
  dari uji email tidak tertukar dengan uji Instagram. Jangan melawan pilihan privasi
  atau pemblokir pengunjung untuk memaksa pelacakan.

Contoh penamaan, supaya record demo mudah ditemukan:

- Email: `DEMO-20261105-EMAIL-TIM`.
- Instagram: `DEMO-20261105-IG-REKOMENDASI`.
- Perusahaan contoh: `PT Contoh Bertumbuh — DEMO` (fiktif).
- Kontak: nama/peran uji, dengan **email internal yang Anda kuasai dan disetujui**.

## 3. Demo A — kampanye email, langkah demi langkah

### A1. Buat kampanye

1. Buka [Workspace Penjualan](https://app.binahub.id/admin/acquisition).
2. Pilih tab **Outbound**.
3. Klik **Buat kampanye** pada panel Kampanye email.
4. Isi nama `DEMO-20261105-EMAIL-TIM`.
5. Pada **Asal daftar target**, pilih sumber outbound yang sudah disetujui,
   misalnya daftar internal demo. Nama ini contoh, bukan sumber yang dijamin sudah ada.
6. Klik **Buat kampanye**. Kode kampanye/pelacakan dibuat otomatis; belum mengirim.

Jika belum ada sumber, gunakan **Siapkan sumber data** atau **Gunakan asal daftar
baru**. Misalnya nama “Internal demo BinaHub”, metode “Alamat internal yang
pemiliknya menyetujui uji 5 November”. Pilih “Persetujuan penerima” hanya setelah
persetujuan itu benar-benar ada. URL privasi, masa simpan, pemilik data dan
penanggung jawab diisi berdasarkan kebijakan nyata, bukan contoh angka dari panduan.

### A2. Batasi pengiriman untuk demo

7. Buka **Pengaturan lanjutan → Atur pengiriman**.
8. Pilih **Uji terbatas**. Isi 1–2 alamat internal yang diizinkan pada **Alamat uji**.
   Jangan pilih Target disetujui untuk membuka pengiriman luas pada demo.
9. Tinjau **Kirim target hanya pada jam kerja**. Jika aktif, target diproses
   Senin–Jumat 08.00–17.00 WIB. Pertahankan kebijakan yang disepakati; jangan mengubah
   kampanye produksi lain untuk mempercepat demo. Email uji admin tidak memakai
   batas jam tersebut.
10. Jika akan benar-benar mengirim internal, pilih **Diaktifkan**, periksa
    cakupan alamat, konfirmasi pengaturan lalu **Simpan pengaturan**.
    Menyimpan pengaturan belum mengirim, tetapi mengubahnya membatalkan antrean
    lama yang belum diproses. Karena itu pakai kampanye demo terpisah, tanpa antrean lama.

Jika hanya mempresentasikan tanpa email nyata, cukup pratinjau; jangan konfirmasi
pengiriman. Mengaktifkan atau konfirmasi kirim dapat mengaktifkan kampanye yang
sebelumnya dijeda. Follow-up tetap terpisah.

### A3. Tambah penerima internal

11. Pada langkah **Penerima**, klik **Tambah target**.
12. Cara paling mudah: tempel satu email internal per baris. Atau gunakan CSV
    dengan kolom `name,email,company,consent_status`.
13. Klik **Periksa daftar** jika memakai tempelan, periksa hasil, lalu konfirmasikan
    kewenangan penggunaan daftar. Centang persetujuan semua penerima hanya jika
    semua yang diimpor memang sudah menyetujui; bukan cara untuk mengabaikan opt-out.
14. Klik **Tambahkan target**. Jika tampil daftar menunggu persetujuan,
    **Tinjau & setujui**, baca seluruh daftar, tulis catatan yang benar dan setujui.
15. Pilih **satu** penerima internal. Hindari tombol “Pilih hingga 50 target siap”
    untuk demo, supaya tidak salah memilih target yang lain.

Contoh isi CSV (ganti placeholder dengan email milik Anda; jangan kirim literalnya):

```csv
name,email,company,consent_status
Peserta Demo,EMAIL_INTERNAL_YANG_DISETUJUI,BinaHub Demo,opted_in
```

`opted_in` hanya benar bila pemilik alamat memang menyetujui. Menambah target atau
menyetujui daftar tidak mengirim email. Sistem tetap memblokir alamat tidak valid,
ganda, opt-out, di luar batas uji, atau daftar yang belum disetujui.

### A4. Pratinjau dan email uji

16. Klik **Lanjut ke email**. Pilih bahasa Indonesia pada pemilih bahasa kampanye.
17. Baca subjek, nama/perusahaan, isi, CTA dan tujuan tautan di pratinjau.
    Layar ini **bukan editor copy bebas**: memakai template aktif yang disetujui.
18. Untuk demonstrasi paling aman, buka **Kirim email uji ke saya · opsional**.
    Periksa alamat akun admin yang tertera. Klik **Kirim email uji**, lalu **Kirim uji**
    hanya jika Anda memang setuju menerima satu email nyata.
19. Buka inbox/spam akun admin. Pastikan tampilannya terbaca di ponsel, CTA benar,
    reply-to benar dan tautan berhenti berlangganan tersedia. Jangan klik unsubscribe
    kecuali sedang melakukan skenario opt-out terpisah—itu dapat memblokir pengiriman berikutnya.

Email uji dikirim **ke akun admin yang sedang login**, bukan ke sembarang alamat
atau seluruh daftar. Satu email nyata tetap memakai layanan/kuota email, bukan
mock seperti pembayaran PE/RM. Email uji boleh dilewati bila hanya menunjukkan pratinjau.

### A5. Demo kirim ke target — opsional

20. Jika cukup dengan email uji admin, berhenti di langkah 19. Jika ingin menunjukkan
    alur target juga, pastikan 1 target internal dipilih dan disetujui.
21. Klik **Lanjut ke tinjauan**. Periksa nama kampanye, bahasa, subjek, waktu dan
    **alamat penerima lengkap**.
22. Klik **Tinjau & kirim**, baca dialog terakhir, kemudian **Konfirmasi pengiriman**.
    Ini mengirim email nyata, bukan sekadar pratinjau.
23. Pada **Hasil**, tunggu pembaruan status. “Diterima penyedia email” berarti
    provider menerima, bukan bukti sudah masuk inbox/dibaca. Buktikan dengan inbox internal.
24. Jika masih ada antrean, periksa jadwal lalu gunakan **Proses antrean berikutnya**
    untuk kampanye demo ini. Tombolnya membatasi pemrosesan pada kampanye terpilih,
    tetapi bisa memproses antrean lain yang sudah disetujui dalam kampanye itu.
    Jangan menjalankan worker global hanya untuk meloloskan demo.

Konfirmasi kirim memicu pemrosesan awal di backend; tidak perlu selalu menekan
tombol proses. Cron laporan yang sudah aktif **bukan scheduler outbound email**.
Follow-up juga bukan otomatis aktif karena email pertama berhasil.

### A6. Tunjukkan hasil dan langkah berikutnya

25. Dari email internal, buka CTA sebagai klien. Tautan outbound unik dapat
    mengidentifikasi target; jangan menempelkan URL lengkapnya ke dokumen bersama.
26. Jika CTA menuju Diagnosis Tim/Organisasi, gunakan jalur tersebut sesuai
    pratinjau. Isian nyata dapat memicu AI/email laporan—gunakan data fiktif dan
    alamat internal, dan lakukan hanya satu kasus yang disetujui untuk demo.
27. Kembali ke **Klien & proposal → Self Diagnostic & proposal** untuk hasil
    diagnosis tim/org, atau buka **Inquiry masuk** jika tindakan klien adalah inquiry.
28. Buat catatan tindak lanjut/owner pada modul yang sesuai; jangan menganggap
    reply email eksternal otomatis dibaca ke CRM. Balasan perlu dicek di inbox reply-to.

Kalimat presenter: “Admin tidak mengirim dari daftar mentah. Sumber, penerima,
isi dan konfirmasi diperiksa dulu; setelah itu hasil pengiriman dapat dipantau.”

### Contoh email untuk bahan review CEO

Ini draf contoh, **bukan klaim bahwa template produksi sudah berisi copy ini**.
Perubahan template perlu ditinjau/disetujui pada proses pengelolaan template,
bukan ditempel ke layar pratinjau kampanye.

Subjek: **Dari tantangan tim, mulai dengan diagnosis yang lebih terarah**

> Yth. Bapak/Ibu [Nama],
>
> Prioritas pengembangan tim akan lebih mudah dibahas ketika kondisi dan
> tantangannya sudah dipetakan.
>
> BinaHub menyediakan Diagnosis Tim/Organisasi sebagai langkah awal untuk
> mengenali kebutuhan pengembangan dan menyiapkan diskusi yang lebih terarah.
>
> Silakan mulai melalui tombol di bawah. Bila ingin membahas konteks perusahaan
> terlebih dahulu, Bapak/Ibu dapat membalas email ini.
>
> Salam,
> Tim BinaHub

Teks CTA contoh: **Mulai Diagnosis Tim/Organisasi**. Gunakan tautan unik yang
diterbitkan sistem pada template aktif, bukan URL peserta lain atau tautan contoh.
Identitas pengirim, privasi dan unsubscribe tetap mengikuti konfigurasi resmi.

## 4. Demo B — siapkan tautan Instagram di BinaHub

1. Di Workspace Penjualan, pilih **Inbound → Buat kampanye**.
2. Isi form contoh:

   | Kolom | Contoh |
   | --- | --- |
   | Nama kampanye | `DEMO-20261105-IG-REKOMENDASI` |
   | Dibagikan melalui | **Meta Ads** |
   | Halaman tujuan | **Rekomendasi program organisasi** |
   | Sumber yang disetujui | Pilih sumber inbound aktif yang benar |
   | Penanggung jawab | Email admin penanggung jawab sebenarnya |

3. Konfirmasikan penggunaan sumber/tujuan yang benar, lalu **Buat tautan kampanye**.
4. Klik **Salin tautan** pada kampanye baru. Gunakan tautan ini persis, jangan
   mengarang nilai UTM sendiri. Kanal Meta Ads membuat `utm_source=meta`,
   `utm_medium=paid_social` dan `utm_campaign` berkode otomatis.
5. Simpan tautan itu pada catatan pribadi demo. Membuat tautan belum memasang
   iklan dan belum menimbulkan tagihan iklan.

Contoh bentuk URL, **bukan kampanye terdaftar untuk langsung dipakai**:

```text
https://binahub.id/rekomendasi-program?utm_source=meta&utm_medium=paid_social&utm_campaign=inbound-contoh-demo
```

Jangan mengganti `meta` menjadi `instagram` atau mengganti kode otomatis tanpa
menyesuaikan kampanye sumber. Untuk demo ini gunakan full URL hasil Salin tautan
di Website URL Meta dan kosongkan kolom URL parameters tambahan, agar tidak ada
UTM ganda yang saling menimpa. Jangan memasukkan email/nama/token hasil ke UTM.

Jika belum ada sumber inbound: **Pengaturan sumber dan kampanye → Buka pengaturan
lengkap → Sumber data → Tambah**. Gunakan kunci unik misalnya
`demo_ig_20261105`, nama “Instagram BinaHub — demo”, Penyedia `meta_ads`, Kanal
`inbound`, metode akuisisi yang benar, kebijakan privasi/masa simpan/PIC yang
disahkan. Admin yang berwenang memilih Disetujui + Sumber aktif + persetujuan
penanggung jawab, lalu menyimpan. Itu registrasi sumber internal, **bukan OAuth
Instagram, bukan izin mengambil semua data pengikut dan bukan pemasangan iklan**.

## 5. Demo C — rancangan iklan di Meta Ads Manager

Gunakan [Meta Ads Manager](https://adsmanager.facebook.com/) di browser desktop.
Meta menyediakan jalur promosi melalui Instagram maupun Ads Manager; untuk demo
ini Ads Manager dipilih agar tahap kampanye, audiens dan materi lebih jelas.
[Rujukan resmi Meta Blueprint](https://www.facebookblueprint.com/student/path/253190-meta-advertising-course).

Nama/posisi kontrol bisa berbeda menurut bahasa, akun dan pembaruan Meta. Saya
belum mengakses akun iklan BinaHub; beberapa halaman bantuan/lesson Meta meminta
login. Langkah berikut adalah rancangan demo, bukan bukti setelan akun Anda sudah
terverifikasi. Tidak perlu mengubah konfigurasi akun lain untuk menyamakan tampilan.

### C1. Campaign / Kampanye

1. Pastikan akun iklan milik BinaHub yang benar sedang dipilih, bukan akun klien.
2. Klik **Create/Buat**.
3. Untuk contoh kunjungan ke landing page, pilih **Traffic/Lalu lintas** bila
   tersedia. Ini contoh untuk menunjukkan alur kunjungan, **bukan optimasi jumlah
   lead atau penjualan**. Gunakan Leads untuk tahap berikutnya setelah pengukuran
   formulir/konversi benar-benar terverifikasi.
4. Beri nama `DEMO-20261105-IG-REKOMENDASI`. Jangan gunakan kampanye aktif lama.

### C2. Ad set / Set iklan

5. Pilih tujuan kunjungan **Website**, bukan Instagram profile, WhatsApp atau
   Instant Form, supaya pengunjung melewati form BinaHub yang sedang didemokan.
6. Untuk performance goal, pilih opsi klik tautan yang tersedia untuk demo bila
   Pixel/event belum dikonfirmasi. Jangan mengaku mengoptimasi form submit atau
   pembelian tanpa event yang sudah diuji. Status Pixel/CAPI BinaHub belum saya
   verifikasi di akun Meta; jangan menjadikannya prasyarat membuka draf.
7. Contoh audiens kerja: wilayah layanan yang disepakati, misalnya Jabodetabek,
   semua gender, usia 25–55. Ini **asumsi contoh untuk ditinjau CEO**, bukan bukti
   segmen terbaik. HR/manajer/pimpinan adalah pesan sasaran; setelan minat/jabatan
   tidak menjamin semua penonton memiliki jabatan tersebut. Jangan unggah daftar
   klien menjadi Custom Audience hanya untuk demo.
8. Jika kontrol penempatan manual tersedia, pilih Instagram Feed, Stories dan
   Reels yang sesuai materi. Tinjau preview masing-masing. Bila akun hanya
   menawarkan Advantage+ atau kontrol berbeda, jangan menyatakan pasti Instagram
   saja—baca penempatan yang benar-benar tercantum sebelum peluncuran.
9. Jika perlu mengisi anggaran draf, contoh **lifetime/total Rp150.000 untuk 3 hari**,
   dengan tanggal mulai/akhir yang jelas. Ini hanya angka contoh di draf, bukan
   instruksi membelanjakan uang atau janji hasil. Minimum/opsi akun dapat berbeda.
   Jangan tekan Publish untuk “mencoba sebentar”. Tidak perlu memasukkan/menyimpan
   data pembayaran atau menerima persyaratan baru dalam demo ini.

### C3. Ad / Iklan

10. Pada **Identity/Identitas**, pilih Page dan Instagram BinaHub yang benar.
    Jika aset tidak tersedia, pemilik aset perlu memberi akses yang sesuai;
    jangan memakai identitas bisnis lain atau berbagi password.
11. Gunakan satu materi dulu agar fokus: gambar feed dan adaptasi Story/Reels,
    logo BinaHub asli, warna navy/putih/gold. Gunakan foto yang hak pakainya jelas.
12. Masukkan contoh copy di bawah setelah CEO meninjaunya. Pilih CTA
    **Learn more/Pelajari selengkapnya** atau padanan yang tersedia.
13. Pada **Website URL**, tempel **full URL dari Inbound BinaHub**.
    Kolom URL parameters tambahan dikosongkan untuk pola full URL ini.
14. Periksa preview desktop/ponsel dan penempatan. Pastikan teks tidak tertutup
    tombol/UI Instagram dan halaman tujuan sesuai dengan janji materi.
15. **Untuk meeting, berhenti sebelum Publish/Terbitkan.** Gunakan preview dan
    pertahankan status draf bila tersedia. Jika dialog menawarkan simpan draf,
    pilih itu, bukan terbitkan. Jangan menganggap tampilan preview sebagai bukti
    iklan sudah berjalan atau akan lolos peninjauan. Screenshot preview dapat
    menjadi cadangan jika draf tidak tersimpan pada sesi/akun Anda.

### Contoh materi iklan

Judul pada gambar: **Dari tantangan menuju hasil yang nyata.**

Teks pendamping: **Temukan program pengembangan yang relevan untuk tim Anda.**

Primary text / caption contoh:

> Program pengembangan akan lebih mudah dipilih ketika kebutuhan tim sudah jelas.
>
> Ceritakan tantangan, dampak pada pekerjaan, dan hasil yang ingin dicapai.
> BinaHub membantu menghubungkan kebutuhan organisasi dengan fokus kompetensi
> dan pilihan program yang relevan sebagai bahan diskusi awal.
>
> Mulai dari rekomendasi program untuk tim dan organisasi Anda.

Headline iklan: **Rekomendasi program untuk tim Anda**.

Tidak menjanjikan hasil pasti, tidak menyebut PETA atau paket PE/RM Coming soon,
tidak memakai diagnosis klinis, testimoni atau angka keberhasilan rekaan.

## 6. Buktikan alur tanpa menayangkan iklan berbayar

1. Dari catatan tautan Inbound, buka **tautan yang sama** di sesi incognito baru.
   Ini meniru tujuan klik iklan, tetapi **bukan klik iklan berbayar** dan tidak
   membuktikan metrik Meta berjalan.
2. Tunjukkan landing page rekomendasi program, lalu CTA menuju pengisian.
3. Gunakan kasus fiktif yang konsisten:

   | Konteks | Contoh jawaban |
   | --- | --- |
   | Organisasi | PT Contoh Bertumbuh — DEMO, sektor jasa |
   | Ukuran | 100 karyawan; 30 target peserta, supervisor dan koordinator |
   | Dorongan | Koordinasi lintas fungsi sering terlambat ketika prioritas berubah |
   | Dampak | Tugas menunggu keputusan, pembagian peran perlu diklarifikasi dan pekerjaan berulang |
   | Upaya sebelumnya | Briefing mingguan; membantu sementara, tindak lanjut belum konsisten |
   | Hasil diharapkan | Kesepakatan peran/prioritas dan tindak lanjut lebih jelas; berkurangnya pekerjaan berulang |
   | Dukungan setelah program | Atasan/HR mendampingi praktik dan umpan balik |

   Pilih opsi form yang paling sesuai; jangan centang semua masalah sekaligus.
   Tidak ada nama/kontak pribadi di jawaban kebutuhan. Bagian kontak memakai
   identitas uji dan inbox internal yang pemiliknya setuju.
4. Untuk demo tanpa panggilan AI/email nyata, berhenti di ringkasan sebelum kirim.
   Jika tim menyetujui satu analisis, kirim **satu kasus** saja, tunggu status dan
   periksa hasil. Jangan menjanjikan laporan selesai dalam hitungan detik.
5. Buka **Workspace Penjualan → Klien & proposal → Discovery organisasi**.
   Cari perusahaan/email uji; buka isian, status laporan dan checklist meeting.
   Jika laporan/email masih diproses, tampilkan status jujur; jangan kirim ulang form
   berkali-kali. Catat referenceID/waktu, bukan token atau tautan hasil pribadi.
6. Buka **Inbound → Lihat respons** pada kampanye untuk bukti kunjungan yang
   tercatat. Pencarian operasional menggunakan atribusi pertama dan sampel terbaru;
   tidak selalu menunjukkan total sepanjang waktu atau setiap form SPIN sebagai
   konversi otomatis. Pisahkan bukti kunjungan dari record Discovery organisasi.
7. Gunakan **Arsip kampanye** bila perlu mencari record/aktivitas lama. Kampanye
   demo bisa ditemukan dengan awalan namanya. Jangan membuat kampanye duplikat
   karena daftar gagal dimuat sesaat.

Kalimat presenter: “Iklan mengantar orang ke halaman kebutuhan. BinaHub menyimpan
permintaan dan membantu admin menindaklanjutinya. Biaya/klik iklan dibaca di Meta;
kunjungan dan kebutuhan klien dibaca pada modul BinaHub yang sesuai.”

## 7. Apa yang dinilai dan apa yang tidak boleh diklaim

- **Email:** penerima benar, tidak terkirim saat sekadar navigasi, konfirmasi
  jelas, provider menerima, inbox internal terbukti, tujuan CTA benar.
- **Instagram draf:** akun/identitas, materi, URL/UTM, audiens, penempatan dan
  rancangan anggaran terbaca. Tidak ada belanja iklan untuk demonstrasi ini.
- **Website/app:** tautan berfungsi, form tidak kehilangan jawaban, record uji
  ditemukan, proses/report terlihat, PIC tindak lanjut jelas.
- **Bukan bukti:** jaminan AI selalu berhasil, email selalu inbox, UTM=orang unik,
  seluruh leads otomatis teratribusi, integrasi spend Meta ke dashboard BinaHub,
  Pixel/CAPI berfungsi, performa/cost-per-lead atau ROAS nyata. Tanpa iklan tayang
  memang belum ada data performa berbayar yang dapat dinilai.

Jika kelak disetujui benar-benar tayang, operator meninjau ulang akun, materi,
tujuan, pelacakan, privasi, anggaran total dan jadwal, lalu pemilik akun menerbitkan.
Jangan mengubah demo menjadi penerbitan iklan atau blast pelanggan tanpa keputusan itu.

## 8. Run of show — 25 menit

1. Menit 0–3: jelaskan Email/Meta/BinaHub adalah tiga pekerjaan yang berbeda.
2. Menit 3–10: Outbound → satu target internal → preview → email uji bila disetujui.
3. Menit 10–15: Inbound → Meta Ads → buat/salin tautan → preview draf Ads Manager.
4. Menit 15–22: buka tautan incognito, kasus fiktif, tunjukkan record dan laporan
   yang tersedia. Siapkan satu hasil uji sebelumnya bila pemrosesan masih berjalan.
5. Menit 22–25: cek PIC, CTA, pertanyaan CEO, dan keputusan sebelum pilot nyata.

Yang perlu CEO siapkan: target segmen/wilayah, satu kasus kebutuhan, persetujuan
copy/katalog yang boleh dipromosikan, admin pemilik follow-up, serta batas anggaran
untuk pilot berikutnya. Untuk demo draf besok, Mayar tidak diperlukan.

## Dasar dan batas verifikasi

- Jalur/menu diverifikasi dari source app 4 November 2026, Codebase Memory dan
  pembacaan langsung: QuickEmailCampaign, OutboundEmailPanel, OutboundSettingsDialog,
  QuickInboundCampaign, InboundCampaignsPanel, SalesWorkspace dan pembuat URL inbound.
- API outbound membaca template `marketing_blast_initial`; email uji hanya ke
  admin terautentikasi, pemrosesan manual membatasi campaignId. Pengiriman nyata,
  provider/inbox dan akun iklan tidak dijalankan saat menyusun panduan ini.
- [Meta Blueprint: pengantar promosi Instagram dan Ads Manager](https://www.facebookblueprint.com/student/path/253190-meta-advertising-course)
  dan [pelatihan resmi kampanye](https://www.facebookblueprint.com/student/activity/289906-direct-response-solutions)
  diperiksa 4 November. Sebagian bantuan detail/lesson meminta login; posisi
  tombol, opsi penempatan, anggaran dan performance goal perlu dicocokkan di akun.
- [Panduan kampanye operasional](campaigns-admin-guide.md) dan
  [checklist meeting sales](sales-uat-meeting-2026-11-05.md) melengkapi tutorial.
- Sebanyak 33 tes kampanye lokal lulus pada empat file: pembuat tautan inbound,
  pembuatan kampanye cepat, langkah outbound dan pengaturan uji terbatas. Tes
  memakai data sintetis, bukan pembuktian pengiriman/inbox atau akun Meta produksi.
