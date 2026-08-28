# BinaHub Business Rules v0.1 — Mock Assumptions

Status: **SIMULASI UNTUK MOCKUP — BUKAN ATURAN PRODUKSI**  
Tanggal: 27 Agustus 2026  
Tujuan: menyediakan asumsi sementara agar UI, workflow, dan demonstrasi end-to-end dapat dibangun sebelum keputusan final para pengambil keputusan.

## 1. Prinsip Penggunaan

1. Semua angka harga, threshold, SLA, dan owner dalam dokumen ini adalah asumsi kerja.
2. Proposal dari mockup wajib memuat watermark `SIMULASI / BELUM MERUPAKAN PENAWARAN RESMI`.
3. Sistem tidak boleh mengirim proposal mock kepada calon klien tanpa approval manusia.
4. Setelah review para pengambil keputusan, dokumen ini harus dinaikkan menjadi `Business Rules v1` dan diberi tanggal berlaku.
5. Perubahan aturan setelah v1 harus memiliki versioning dan audit trail.

## 2. Ideal Customer Profile — Asumsi Mock

### 2.1 Target utama

| Dimensi | Asumsi awal |
|---|---|
| Industri | Professional services, financial services, manufacturing, healthcare, education, technology, retail, logistics, dan perusahaan keluarga yang sedang melakukan transformasi |
| Ukuran | Prioritas 50–1.000 karyawan; 20–49 dapat diterima jika kebutuhan dan budget jelas; di atas 1.000 masuk enterprise/custom |
| Lokasi | Indonesia; prioritas awal Jabodetabek dan kota besar, dengan opsi hybrid/nasional |
| Jabatan | Founder/Pimpinan Perusahaan, CHRO/HR Director, Head of People, Learning & Development Head, Organization Development Head, Business Unit Director |
| Kebutuhan | Leadership, culture, team effectiveness, capability development, assessment, transformation execution, dan measurement |

### 2.2 Exclusion list sementara

- Individu yang meminta layanan personal di luar katalog B2B.
- Perusahaan tanpa identitas organisasi yang dapat diverifikasi.
- Permintaan yang melanggar hukum, etika, privasi, atau meminta manipulasi hasil assessment.
- Kompetitor yang meminta materi proprietary, rubric, prompt, atau data klien.
- Kontak yang unsubscribe, hard bounce, complaint, atau masuk suppression list.
- Lead duplikat yang sudah memiliki opportunity aktif, kecuali ditautkan ke opportunity tersebut.
- Kebutuhan di luar kapabilitas BinaHub dan tidak memiliki partner delivery yang disetujui.

### 2.3 Mock fit score

| Faktor | Bobot mock |
|---|---:|
| Kesesuaian kebutuhan dengan modul | 25 |
| Ukuran dan kompleksitas organisasi | 15 |
| Senioritas/jabatan pengambil keputusan | 15 |
| Urgensi 0–3 bulan | 15 |
| Budget readiness | 15 |
| Engagement: assessment, reply, meeting | 15 |

Klasifikasi simulasi:

- **Hot:** 75–100, terdapat kebutuhan jelas dan sinyal keputusan/meeting.
- **Warm:** 50–74, fit cukup baik tetapi urgensi, budget, atau authority belum lengkap.
- **Cold:** 0–49, data belum cukup atau belum terdapat buying signal.

AI boleh merekomendasikan klasifikasi, tetapi manusia dapat override dengan alasan yang tercatat.

## 3. Catalog dan Pricing — Asumsi Mock

Produk adalah payung solusi, bukan unit harga. Setiap produk dapat memiliki banyak modul. Harga proposal selalu dihitung dari modul yang dipilih, kuantitas, dan satuannya. Karena katalog riil masih dirancang, nama dan angka di bawah hanya placeholder teknis untuk menguji configurator, human gate, dan PDF.

| Produk/payung | Modul simulasi | Unit simulasi | Harga dasar mock |
|---|---|---|---:|
| BinaInsight | Public Assessment | Per responden publik | Rp0 |
| BinaInsight | `[MOCK]` Corporate Diagnostic | Per organisasi | Rp15.000.000 |
| BinaLab | `[MOCK]` Learning Workshop | Per program | Rp35.000.000 |
| BinaCoach | `[MOCK]` Coaching Package | Per program | Rp18.000.000 |
| BinaPlay | `[MOCK]` Facilitation Sprint | Per program | Rp45.000.000 |
| BinaAcademy | `[MOCK]` Cohort Program | Per cohort | Rp120.000.000 |
| BinaWorks | `[MOCK]` Execution Sprint | Per program | Rp75.000.000 |
| BinaImpact | `[MOCK]` Measurement Package | Per program | Rp25.000.000 |

Aturan simulasi:

- Minimum transaksi: **Rp25.000.000**, kecuali BinaInsight publik.
- Diskon otomatis: **maksimum 5%** hanya untuk paket katalog yang memenuhi syarat.
- Diskon **di atas 5%** wajib approval manusia.
- Diskon absolut maksimum simulasi: **10%**; lebih dari itu tidak dapat disetujui melalui human override biasa.
- Pajak: ditambahkan sesuai ketentuan yang berlaku pada tanggal invoice; rate tidak ditanam permanen di prompt AI.
- Masa berlaku proposal: **14 hari kalender**.
- Perjalanan, akomodasi, venue, lisensi pihak ketiga, dan kebutuhan custom dihitung terpisah.
- Harga harus memiliki `catalog_version`; proposal menyimpan snapshot harga agar histori tidak berubah ketika katalog diperbarui.

## 4. Human Gate

### 4.1 Kondisi wajib review manusia

Proposal masuk review jika salah satu kondisi berikut benar:

- scope custom;
- nilai deal di atas **Rp150.000.000** pada simulasi;
- terdapat permintaan diskon;
- confidence AI di bawah **0,75**;
- modul/kebutuhan tidak ditemukan di katalog aktif;
- terdapat risiko reputasi, legal, privasi, konflik kepentingan, atau komersial;
- enterprise di atas 1.000 karyawan;
- proposal memuat term pembayaran atau SLA yang berbeda dari template;
- data penting seperti kebutuhan, jumlah peserta, timeline, atau decision maker belum lengkap.

### 4.2 Jalur keputusan mock

| Kondisi | Aksi sistem | Human task |
|---|---|---|
| Paket standar, data lengkap, tanpa diskon, confidence ≥0,75 | Buat draft standar | Sales Ops melakukan final check sebelum kirim |
| Scope custom atau item di luar katalog | Buat brief kebutuhan, bukan harga final | Solution/Delivery Owner menyusun scope |
| Diskon 1–5% | Hitung simulasi | Proposal Approver menyetujui |
| Diskon >5% atau deal >Rp150 juta | Tahan proposal | Approver yang ditunjuk memutuskan |
| Risiko legal/reputasi | Bekukan automasi | Eskalasi kepada pimpinan dan fungsi terkait |
| Confidence rendah/data kurang | Buat daftar pertanyaan | Sales Ops melengkapi data atau konsultasi |

### 4.3 Kondisi sistem saat ini

Sudah tersedia setelah migration `0024` diterapkan:

- dashboard assessment dan tindakan proposal;
- status proposal, deal, lost, closed, dan lanjut diskusi;
- configurator harga per modul dan snapshot katalog;
- rule engine yang menampilkan alasan human gate;
- antrean approval dengan approve, reject, request revision, due date, dan audit trail;
- larangan teknis mengirim proposal sebelum status gate clear/approved;
- hard block untuk modul belum siap dan diskon di atas batas absolut;
- tindakan manusia untuk meminta, membuat, mengirim, dan menindaklanjuti proposal;
- pause follow-up dan histori tindakan.

Perlu ditingkatkan:

- assignment approver per role/nominal dan notifikasi SLA;
- confidence AI otomatis yang tersimpan beserta evidence;
- aktivasi `Business Rules v1` serta katalog riil;
- pajak, term pembayaran, add-on, lokasi, dan biaya perjalanan yang telah disepakati.

## 5. Follow-up Policy

### 5.1 Aturan mock

- Follow-up 1: H+2.
- Follow-up 2: H+7.
- Follow-up 3: H+14.
- Maksimum: 3 pesan otomatis per channel/opportunity.
- Jam kirim mock: 09.00–16.00 WIB pada hari kerja.
- Tidak mengirim pada akhir pekan atau hari libur setelah kalender bisnis dikonfigurasi.
- Setiap pesan harus menyebut konteks interaksi sebelumnya dan satu next action yang jelas.

### 5.2 Stop conditions

Automasi berhenti ketika:

- penerima membalas;
- meeting dijadwalkan;
- lead meminta dihubungi pada waktu lain;
- status menjadi Lanjut Diskusi, Deal/Client, Lost, Closed, atau Archived;
- follow-up dijeda manusia;
- email unsubscribe;
- hard bounce atau spam complaint;
- tiga follow-up sudah terkirim;
- terdapat risiko atau human gate aktif.

### 5.3 Kondisi sistem saat ini

Sudah tersedia:

- jadwal H+2/H+7/H+14;
- maksimum tiga level;
- stop status, pause, history, dan claim anti-duplikasi;
- unsubscribe bertoken dan suppression list;
- auto-pause setelah unsubscribe;
- endpoint untuk scheduler n8n.

Perlu ditingkatkan:

- business-hours dan holiday calendar;
- deteksi reply melalui inbound email webhook;
- webhook bounce/complaint dari provider email;
- Cal.com webhook sudah tersedia; masih perlu diaktifkan pada akun Hosted dan diuji end-to-end;
- quiet hours, reschedule, dan retry policy;
- dashboard deliverability dan alert kegagalan;
- scheduler n8n production serta credential-nya.

## 6. Ownership dan SLA — Asumsi Mock

Nama orang belum ditetapkan. Untuk mockup digunakan role berikut.

| Tanggung jawab | Owner mock | SLA mock |
|---|---|---|
| Lead Hot baru | Sales Operations | Ditinjau maksimal 2 jam kerja |
| Lead Warm baru | Sales Operations | Ditinjau maksimal 1 hari kerja |
| Proposal standar | Sales Operations + Proposal Approver | 1 hari kerja |
| Proposal custom | Delivery/Solution Owner + Proposal Approver | 3 hari kerja setelah data lengkap |
| Diskon >5% / deal besar | Approver komersial yang ditunjuk | 2 hari kerja |
| Deliverability incident | Engineering/Ops | Acknowledge 2 jam, mitigasi 4 jam kerja |
| Handoff Deal → Delivery | Delivery Owner | Kickoff task dibuat maksimal 1 hari kerja |
| Data/privacy/reputation risk | Pimpinan + owner terkait | Automasi langsung berhenti; review 1 hari kerja |

## 7. Mockup yang Dapat Dibangun dari Rules Ini

1. **ICP & Lead Score card** — menampilkan fit score, temperature, evidence, confidence, dan override manusia.
2. **Catalog configurator** — memilih modul di bawah produk, unit, kuantitas, diskon, status kesiapan, dan versi katalog.
3. **Indicative proposal preview** — satu konfigurasi modul terpilih dengan rincian harga dan watermark simulasi.
4. **Human Gate inbox** — alasan gate, owner, SLA countdown, approve, reject, dan request revision.
5. **Follow-up timeline** — H+2/H+7/H+14, next send, pause, stop reason, unsubscribe, reply, dan meeting.
6. **Pipeline board** — Prospect → Qualified → Consultation → Proposal → Negotiation → Won/Lost.
7. **Handoff checklist** — Deal → organisasi/program → PIC delivery → kickoff.

## 8. Data yang Perlu Dilengkapi Para Pengambil Keputusan

Item berikut menggantikan data mock agar v0.1 dapat dinaikkan menjadi v1:

1. Industri dan ukuran perusahaan prioritas pertama.
2. Harga dasar resmi setiap modul dan unit perhitungannya.
3. Minimum transaksi dan batas diskon tiap level persetujuan.
4. Nilai deal yang memicu approval pimpinan/approver komersial.
5. Nama pemegang empat ownership utama.
6. SLA Hot Lead dan proposal custom.
7. Jam/hari follow-up serta kalender hari libur.
8. Definisi stop setelah reply/meeting dan siapa yang boleh membuka pause.

## 9. Status Fase Saat Ini

Posisi aktual adalah **Fase 1 — mock implementation dan integration hardening**.

- **Fase 0 berjalan paralel** karena ICP, katalog modul, pricing, ownership, dan SLA belum disahkan para pengambil keputusan; sistem memakai `v0.1-mock` sementara.
- **Human Gate sudah diimplementasikan dan migration `0024` telah diverifikasi pada database**; aturan aktif masih mock sampai diganti Business Rules v1.
- **Follow-up sudah tersedia secara teknis**, termasuk H+2/H+7/H+14, pause, stop status, anti-duplikasi, unsubscribe, suppression, workflow n8n lokal, serta dry-run aman untuk UAT. Yang belum adalah policy production, aktivasi scheduler production, inbound reply, konfigurasi akun Cal.com, bounce, dan complaint integration.
- **Fase 1 yang sudah dikerjakan**: BinaInsight publik, program module, lead scoring, proposal builder berbasis modul, PDF proposal, dashboard katalog, lifecycle fields, attribution, suppression, human gate, dan worker hardening.

Mockup dapat diuji internal menggunakan v0.1 ini. Aktivasi pengiriman penawaran resmi dan otomatisasi eksternal tetap menunggu `Business Rules v1`, katalog riil, serta konfigurasi production; migration `0024` dan `0025` sudah tersedia dan terverifikasi.
