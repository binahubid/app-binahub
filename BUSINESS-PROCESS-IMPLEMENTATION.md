# Status Implementasi BinaHub AI Business Process

Tanggal audit dan implementasi: 30 Agustus 2026
Repositori: `website-prod`, `app-binahub`, `binahub-api`, dan `binahub-automation`

## Ringkasan Eksekutif

Fondasi proses dari prospect masuk sampai retain sudah tersedia dan BinaInsight dapat dipakai publik tanpa autentikasi. Business Rules yang dikembalikan pengambil keputusan telah diterjemahkan menjadi `v1.0-approved-partial`: keputusan final menjadi guardrail, sedangkan data kosong tetap menjadi activation blocker. Engineering gate, Launch Control, Human UAT, controlled pilot, Operational Assurance, dan Pilot Certification kini telah dibangun sampai app/API `0.16.0`, website `0.2.20`, automation `0.2.0`, dan migration `0037`; rincian terakhir ada di `PHASE-12-IMPLEMENTATION-STATUS.md`.

Deployment kode tidak berarti otomatisasi aktif. Business Rules masih menonaktifkan proposal auto-send dan outbound, lima workflow n8n tetap inactive, dan UAT terintegrasi belum selesai.

## Posisi Fase Saat Ini

- **Fase 0 — Keputusan bisnis:** selesai sebagian dan sudah dibekukan sebagai `v1.0-approved-partial`; sembilan kelompok data masih menjadi activation blocker.
- **Fase 1 — Fondasi dan guardrail:** implementasi kode selesai.
- **Fase 2 — Operasional Lead & Proposal:** kode API dan app v0.8.0 sudah dideploy; data resmi, aktivasi outbound, dan UAT masih menunggu.
- **Fase 3 — Client, Delivery & Retain:** migration `0028`, API, dan app v0.9.0 sudah dideploy; UAT ditunda.
- **Fase 4 — Automation Control & Production Hardening:** migration `0029`, API, dan app v0.10.0 sudah dideploy; workflow masih inactive dan UAT ditunda.
- **Fase 5 — Acquisition Governance & Growth Operations:** migration `0030`, API, dan app v0.11.0 sudah dideploy; workflow sudah diimpor tetapi inactive, data governance riil dan UAT masih menunggu.
- **Fase 6 — Release Reconciliation:** selesai; katalog publik, credential n8n, migration `0031`, dan deployment telah direkonsiliasi.
- **Fase 7 — Integrated UAT & Security Gate:** engineering gate selesai; migration `0032`/`0033`, smoke 18/18, retry/idempotensi, Cal.com lineage, RLS, dan security headers terverifikasi. Human scenario riil tetap menjadi activation gate akhir.
- **Fase 8 — Launch Control & Observability:** implementasi app/API `0.12.0` selesai lokal; deployment dan pengisian audit run Follow-up/Event Worker menunggu operator.
- **Fase 9 — Human UAT & Pilot Gate:** implementasi migration `0034`, API/app `0.13.0`, checklist 12 skenario wajib, bukti, owner, dan audit trail selesai lokal; eksekusi skenario manusia menunggu setelah deployment.
- **Fase 10 — Controlled Pilot Operations & Kill Switch:** implementation migration `0035`, API/app `0.14.0`, release plan, requested/effective mode, volume ceiling, approval gate, rollback guard, dan kill switch selesai dibangun; deployment dan UAT manusia menunggu operator.
- **Fase 11 — Operational Assurance & Go/No-Go:** implementation migration `0036`, API/app `0.15.0`, policy monitoring, snapshot deterministik, incident register, watchdog, dan human go/no-go selesai dibangun; deployment dan evidence riil menunggu operator.
- **Fase 12 — Pilot Rehearsal & Acceptance:** implementation migration `0037`, API/app `0.16.0`, delapan langkah production dry-run rehearsal, evidence binding, final acceptance, dan gate tambahan selesai dibangun; deployment dan pengisian evidence riil menunggu operator.

Dengan demikian, pembangunan engineering saat ini selesai sampai Fase 12. Aktivasi otomatis penuh tetap terkunci dan seluruh worker terjadwal tetap inactive/dry-run sampai seluruh blocker bisnis, human UAT, release approval, policy real, monitoring evidence, rehearsal, acceptance, dan keputusan go-live disetujui.

## Status Workflow End-to-End

| Tahap | Sudah tersedia | Ditambahkan pada iterasi ini | Belum siap / membutuhkan keputusan |
|---|---|---|---|
| 1. Data Konsumen & Awareness | Landing page BinaInsight di `website-prod`, form kontak, BinaInsight publik/gratis, serta attribution UTM/click ID | Governed source dan campaign; staging maksimal 500 prospect per batch; validasi format, suppression, opt-out, exclusion, dan deduplikasi; human review; promotion idempotent ke consumer lead tanpa outreach | Akun dan anggaran Ads/Apollo, sumber dan lawful basis riil, owner data/legal, privacy notice, retention policy, ICP/exclusion resmi, dan domain outbound |
| 2. Prospecting | Assessment publik, analisis AI, PDF hasil, email hasil, data admin; BinaInsight juga sudah dapat diaktifkan sebagai modul program | Attribution disimpan; configurator memilih modul di bawah produk; katalog publik hanya memuat modul riil/siap; snapshot harga dan PDF proposal tidak memberi AI kewenangan menentukan angka; 12 data proposal kini divalidasi eksplisit | Daftar modul resmi, scope/output/satuan/harga/status modul, kebijakan transaksi di bawah minimum, dan wording pajak final |
| 3. Lead Qualification | Lifecycle, temperature, opportunity stage, serta dashboard admin tersedia | Skor Cold/Warm/Hot deterministik; form kini menangkap industri, lokasi, timeline, budget, sponsor, next-step intent, dan konsekuensi bisnis; Sales Pipeline menambahkan owner, next action, due date, nilai, lost reason, pause, dan audit | Owner riil dan data organisasi lama masih perlu dilengkapi; override qualification eksplisit masih perlu kebijakan |
| 4. Follow-up | Manual follow-up dan endpoint otomatis H+2/H+7/H+14; stop status, pause, history, dan anti-duplikasi claim sudah ada | Activation gate, 18 template ID/EN berversi, atomic approval, webhook Resend idempotent, suppression bounce/complaint, reply pause, health email, retry n8n, dan no-show control | Template final+owner, inbound receiving, webhook production, VPS n8n, serta kanal alert eksternal belum dikonfigurasi |
| 5. Client | Status Deal, organisasi/program, modul program, peserta, fasilitator, LEP, T-BOS, dan data delivery tersedia | Won-to-client handoff atomik; client account; stakeholder; owner; delivery project; milestone; risk; health review; audit trail | Kontrak/e-sign, invoice/payment, kickoff checklist per modul, dan integrasi project management eksternal |
| 6. Retain | Data program dan histori interaksi menjadi fondasi account record | Account health; pergantian PIC tanpa menghapus histori; renewal/upsell/cross-sell/repeat/referral opportunity; human gate; loop tertaut ke account lama | QBR cadence resmi, reminder 90/60/30, NPS/CSAT, katalog retention riil, dan policy bobot health |

## Perubahan yang Sudah Dikerjakan

### 0. Katalog publik, Cal.com, dan n8n lokal

- `website-prod` memiliki halaman `/pricing` dalam Bahasa Indonesia dan Inggris; data mock atau modul yang belum `ready` tidak pernah dipublikasikan.
- Pilihan modul diteruskan ke form kontak tanpa membuat harga atau order palsu.
- Cal.com mengirim webhook langsung ke API; signature `X-Cal-Signature-256` diverifikasi sebelum booking disimpan dan lead dipindahkan ke tahap consultation.
- `binahub-automation` menyediakan Docker Compose n8n + PostgreSQL, lima workflow, export/import script, dan runbook migrasi VPS.
- Workflow di repository selalu inactive dan secret harus dihubungkan melalui n8n Credentials.
- Docker Desktop, n8n, dan PostgreSQL lokal sudah berjalan; lima workflow sudah diimpor tepat satu kali dan semuanya inactive.
- Migration `0024` dan `0025` sudah diverifikasi melalui tabel Business Rules, katalog, booking, dan webhook event yang dapat diakses API.
- Lokal/UAT memakai `FOLLOW_UP_DRY_RUN=true`, sehingga scheduler hanya menampilkan kandidat tanpa mengirim email atau mengubah status.

### 0A. Business Rules v1 terkonfirmasi namun belum diaktifkan

- Migration `0026_business_rules_v1_confirmed.sql` menyimpan `v1.0-approved-partial` sebagai draft non-mock.
- Nilai final yang sudah masuk sistem: minimum transaksi Rp15 juta, review deal di atas Rp100 juta, diskon tanpa approval maksimal 5%, batas absolut 10%, confidence 0,75, masa berlaku proposal 14 hari, window follow-up 08.00–17.00 WIB, serta SLA tugas berbasis hari/jam kerja.
- Proposal otomatis tetap nonaktif. Status draft dipertahankan sampai katalog modul, owner/backup, approver individu, SLA risiko, owner template, kebijakan transaksi di bawah minimum, dan wording pajak final tersedia.
- Dashboard Business Rules menampilkan draft dan daftar blocker ini secara terpisah dari rules mock/aktif agar operator tidak salah menganggap sistem sudah production-ready.

### 1. Attribution dari landing page sampai database

- `website-prod/src/app/insight/page.tsx` meneruskan parameter `utm_*`, `gclid`, `fbclid`, `msclkid`, dan source yang relevan ketika pengguna berpindah ke aplikasi assessment.
- Query pada referrer tidak ikut disimpan; hanya origin dan path yang dibawa untuk mengurangi risiko kebocoran data.
- `app-binahub/src/app/insight/page.tsx` membentuk payload attribution saat assessment dikirim.
- API memvalidasi panjang dan struktur attribution, lalu menyimpannya pada `assessments.attribution` serta `leads.source_metadata`.

### 2. Contact form tidak lagi menghasilkan “sukses semu”

- Lead wajib berhasil disimpan.
- Inquiry wajib berhasil disimpan dan selalu terhubung ke lead.
- Jika database gagal, API mengembalikan HTTP `503` agar pengguna dapat mencoba kembali.
- Kegagalan notifikasi internal melalui email tidak menghilangkan data inquiry; respons menyertakan `notificationDelayed`.

### 3. Model funnel yang dapat dibaca bisnis

Migration `0023_business_process_p0.sql` menambahkan:

- `lifecycle_stage`: consumer, prospect, lead, client, retained;
- `lead_temperature`: cold, warm, hot;
- `opportunity_stage`: identified, qualified, consultation, proposal, negotiation, won, lost;
- `source_metadata` dan `last_meaningful_activity_at`;
- indeks untuk antrean kerja dan segmentasi dashboard.

Ketika assessment selesai, qualification deterministik menyimpan score, temperature, confidence, evidence, missing data, dan rule version. Hot lead hanya masuk opportunity `qualified` jika skor minimal 75 sekaligus memenuhi problem, timeline, sponsor/decision maker, next step/meeting, dan minimum tiga buying signals. Status lama tetap disimpan agar fungsi dashboard yang sudah ada tidak rusak.

### 4. Unsubscribe dan suppression follow-up

- Tautan memakai token HMAC yang terikat ke email dan memiliki masa berlaku.
- Link biasa menampilkan halaman konfirmasi; email juga mengirim header one-click unsubscribe.
- Email yang memilih unsubscribe masuk ke `email_suppressions`.
- Semua pengiriman melalui `sendOutreachEmail` memeriksa suppression sebelum menghubungi Resend.
- Target follow-up otomatis dijeda setelah unsubscribe agar cron tidak mencoba mengirim berulang kali.
- Email hasil assessment dan proposal yang memang diminta tetap diperlakukan sebagai email transaksional.

### 5. Worker event aman terhadap concurrency

- Event diklaim atomik dengan `FOR UPDATE SKIP LOCKED`.
- Claim memiliki lease 15 menit sehingga job dapat diambil kembali jika worker mati.
- Event gagal dijadwalkan ulang dengan exponential backoff.
- Maksimal lima percobaan; setelah itu status menjadi `failed` dan perlu tindakan operator.
- Update selesai hanya diterima dari worker yang masih memegang lease.

### 6. Proposal dan follow-up tidak dapat melewati guardrail

- Data proposal final terdiri dari 12 field bisnis; field kosong dicatat dan menjadi hard block yang tidak dapat disetujui lewat override biasa.
- Deal di bawah minimum masuk review manusia karena kebijakannya belum diputuskan; sistem tidak menolak atau meloloskan sendiri.
- Approval menyimpan actor, waktu, alasan, snapshot sebelum, dan snapshot sesudah.
- Atomic claim `claim_follow_up_delivery` mengunci opportunity sebelum email dibuat sehingga dua worker paralel tidak dapat melewati batas tiga pesan.
- Booking Cal.com baru/reschedule menjeda assessment dan inquiry terkait. Cancellation tidak otomatis melanjutkan sequence; hanya manusia berwenang yang boleh menentukan resume.

## Runbook Produksi

Urutan ini penting. Jangan deploy API baru sebelum migration tersedia karena API mengandalkan kolom dan RPC baru.

1. Backup database Supabase dan jalankan `../binahub-api/supabase/production_readiness.sql` secara read-only.
2. Terapkan migration API sampai `0037_phase12_pilot_rehearsal_certification.sql`, lalu pastikan seluruh flag readiness true dan counter integritas issue nol.
3. Tambahkan secret production yang berbeda untuk `UNSUBSCRIBE_SECRET`, `FOLLOW_UP_CRON_SECRET`, `TRANSFORMATION_WORKER_SECRET`, `PROPOSAL_LINK_SECRET`, `PILOT_MONITOR_SECRET`, `CALCOM_WEBHOOK_SECRET`, dan `RESEND_WEBHOOK_SECRET`. Masing-masing harus acak; unsubscribe minimal 32 karakter.
4. Pastikan `NEXT_PUBLIC_BINAHUB_API_URL=https://api.binahub.id`, URL website, dan URL app mengarah ke domain production yang benar.
5. Deploy `binahub-api` v0.16.0, lalu `app-binahub` v0.16.0; website tetap v0.2.20. Pastikan API health, reverse proxy `/api/*`, dan role boundary merespons sesuai kontrak.
6. Lima workflow harus tetap inactive. Isi evidence Pilot Certification melalui dashboard; jangan aktifkan scheduler bisnis pada deployment Fase 12.
7. Simpan secret di credential store n8n, bukan di node text atau repository. Tambahkan retry terbatas dan alert jika respons bukan 2xx.
8. Lakukan smoke test UTM → assessment → qualification evidence → admin; proposal dengan data tidak lengkap; booking → auto-pause; unsubscribe → suppression; serta dua pemanggilan follow-up paralel pada lead yang sama.

## Backlog Detail

### P0 — Wajib sebelum otomatisasi produksi

1. **Selesaikan gate Fase 9–11.** Scheduler tidak boleh diaktifkan sebelum readiness production, 12 skenario UAT lulus, release non-mock disetujui, policy monitoring real, snapshot cukup, incident blocker selesai, dan keputusan go/no-go tersedia. Owner: Engineering/Ops.
2. **Konfigurasi deliverability.** Verifikasi domain Resend, SPF, DKIM, DMARC, alamat balasan, bounce/complaint webhook, dan batas kirim. Owner: IT/Marketing.
3. **Persetujuan legal outbound.** Tetapkan lawful basis, sumber data yang boleh digunakan, disclosure, retention, dan proses data deletion sebelum impor Apollo/LinkedIn/Google. Owner: Pimpinan/Legal.
4. **Lengkapi activation blockers.** Isi status produk, katalog dan harga modul, kebijakan transaksi di bawah Rp15 juta, owner/backup, approver individu, SLA legal/reputasi, owner template, dan wording pajak. Owner: Product/Commercial/Finance/Legal.
5. **Rekonsiliasi release dan evidence.** Terapkan `0037`, deploy API/app v0.16.0, jalankan smoke Phase 12, lalu isi rehearsal dan acceptance tanpa mengaktifkan workflow. Owner: Engineering/Ops.

### P1 — Membuat proses Lead dan Proposal benar-benar operasional

1. **Finalisasi proposal builder:** struktur modul, harga snapshot, diskon, versioning, PDF, dan disclaimer sudah tersedia; lengkapi katalog riil, pajak, lokasi, add-on, serta term pembayaran.
2. **Finalisasi human approval gate:** enforcement, hard block, dan audit sudah tersedia; lengkapi assignment approver, notifikasi, dan eskalasi SLA.
3. **Cal.com Hosted:** event konsultasi, kalender, webhook production, create/reschedule/cancel, dan update stage sudah diuji; lanjutkan uji no-show serta putuskan reminder dan kebijakan resume setelah cancellation.
4. **Pipeline admin:** board per opportunity stage, owner, next action, due date, SLA breach, timeline aktivitas, alasan lost, dan audit perubahan status.
5. **Qualification enrichment:** rules, alasan, confidence, evidence, dan version sudah tersimpan; tambahkan field industri, lokasi, timeline, budget, sponsor, next step, dan konsekuensi bisnis pada capture form serta mekanisme human override.
6. **Scheduler policy:** window WIB, maksimum frekuensi, dan stop meeting/deal/lost sudah enforced; selesaikan timezone per lead, reply/bounce/complaint event, duplicate opportunity resolution, serta approval template Bahasa Indonesia/Inggris.

### P2 — Client Delivery dan Retain

1. Trigger `won` untuk membuat/menautkan organisasi, program, kickoff checklist, PIC, dan task delivery tanpa membuat data ganda.
2. Integrasi kontrak/e-sign dan invoice/payment; status pembayaran tidak boleh ditentukan AI.
3. Account health berdasarkan engagement, milestone, issue, attendance, survey, dan invoice; selalu tampilkan data sumber, bukan hanya ringkasan AI.
4. QBR dan renewal workflow 90/60/30 hari sebelum akhir program.
5. Deteksi perubahan HRD/PIC melalui konfirmasi manusia; jangan menimpa kontak aktif hanya dari hasil enrichment eksternal.
6. Repeat/upsell membuat opportunity baru yang tetap terhubung ke account lama, bukan mengubah histori deal sebelumnya.

## Vendor dan Langganan yang Memerlukan Tindakan

| Vendor/komponen | Kondisi kode saat ini | Tindakan |
|---|---|---|
| Supabase | Sudah menjadi system of record; migration sampai `0037` disiapkan | Terapkan `0037`, jalankan readiness, backup, cek limit plan, dan tetapkan owner database |
| Resend | Sudah dipakai untuk result, proposal, dan follow-up | Verifikasi domain, quota, webhook bounce/complaint, serta pilih plan berdasarkan volume nyata |
| OpenRouter/model AI | Sudah dipakai untuk analisis assessment, narasi proposal, dan follow-up; keputusan temperature memakai rules deterministik | Pilih model production, budget cap, fallback, logging biaya, dan evaluasi kualitas narasi |
| Vercel/hosting | Website v0.2.20 live; app/API v0.16.0 disiapkan | Deploy setelah migration `0037`; konfirmasi observability, reverse proxy, dan kebijakan preview |
| n8n | Docker Desktop, PostgreSQL, dan lima workflow inactive tersedia; worker memakai runtime ceiling, kill switch, dan watchdog | Uji `test:phase11`, hubungkan credential dengan dry-run, lalu setelah exit criteria pindahkan ke VPS dengan HTTPS/backup/alert |
| Cal.com Hosted | Event konsultasi, kalender, HMAC webhook production, booking store, create/reschedule/cancel, dan update opportunity sudah tersedia | Uji no-show, reminder, dan aturan resume setelah cancellation |
| Apollo | Belum terintegrasi | Putuskan seat/credit, aturan ekspor, enrichment, dedupe, consent, dan batas outreach |
| Google/Meta Ads | Landing bisa menerima attribution | Siapkan akun, pixel/conversion event, naming UTM, budget, dan definisi conversion |
| PostHog | Belum wajib untuk fungsi inti | Tambahkan setelah event taxonomy dan consent disetujui jika product analytics dibutuhkan |
| Sentry | Belum wajib untuk fungsi inti, tetapi disarankan sebelum skala | Tambahkan jika tim membutuhkan alert error, trace, dan release health terpusat |

## Definition of Done End-to-End

Proses baru dapat disebut berjalan end-to-end ketika satu lead uji dapat melewati semua kondisi berikut dengan audit trail:

1. sumber kampanye terbaca;
2. assessment/inquiry tersimpan tepat satu kali;
3. hasil, score, temperature, dan next action terbentuk;
4. custom case masuk approval manusia;
5. meeting tercatat dari webhook kalender;
6. follow-up berhenti ketika reply, meeting, unsubscribe, lost, atau deal;
7. deal membuat handoff delivery tanpa data ganda;
8. program selesai menghasilkan health/renewal signal;
9. repeat order menjadi opportunity baru yang tertaut ke account lama;
10. biaya, error, override AI, dan setiap perubahan status dapat diaudit.
