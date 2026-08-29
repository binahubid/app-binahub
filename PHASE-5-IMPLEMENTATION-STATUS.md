# Fase 5 — Acquisition Governance & Growth Operations

Tanggal: 29 Agustus 2026  
Versi working copy: `0.11.0`

## Ringkasan

Fase 5 menutup celah tahap Data Konsumen dan Awareness tanpa mengaktifkan pengambilan data atau outreach yang belum disetujui. Data dari Apollo, LinkedIn, Google, Ads, partner, referral, website, atau file manual harus memiliki governed source. Prospect masuk staging, diperiksa terhadap suppression dan duplikasi, direview manusia, lalu dapat dipromosikan sebagai lifecycle `consumer` pada existing leads.

UAT bisnis tetap ditunda. Workflow n8n Fase 5 berstatus inactive dan `ACQUISITION_DRY_RUN=true` wajib dipertahankan.

## Yang Sudah Dibangun

### Source governance

- Provider, channel, acquisition method, lawful basis, privacy notice, retention period, data owner, dan legal owner.
- Source outbound tidak dapat approved tanpa seluruh bukti governance dan human approval.
- Hanya source approved dan aktif yang dapat menerima prospect batch.

### Campaign governance

- Objective, channel, owner, budget, currency, tanggal, target definition, serta konfigurasi UTM.
- Campaign approved/active membutuhkan source approved dan human approval.
- Campaign aktif membutuhkan tanggal mulai dan selesai.

### Prospect staging

- Maksimum 500 prospect per batch.
- Validasi email dan field dasar.
- Deteksi email suppression, opted-out, existing lead, dan duplicate dalam batch.
- Legal snapshot dari source disimpan pada batch dan prospect.
- Staging membentuk operational task agar batch direview manusia.
- Keputusan approve/reject menyelesaikan operational task terkait beserta actor dan catatan resolusinya.

### Promotion ke existing leads

- Hanya batch approved yang dapat diproses.
- Dry-run hanya menghitung kandidat.
- Live mode membuat lifecycle `consumer`, opportunity `identified`, dan source metadata lengkap.
- Existing lead tidak ditimpa atau digandakan.
- Lock per email mencegah dua processor paralel membuat lead yang sama; status campaign diperiksa kembali saat review dan promotion.
- Processor tidak melakukan scraping, enrichment, scoring, maupun outreach.

### Acquisition Control dashboard

- Ringkasan source aktif, campaign aktif, batch menunggu review, serta record invalid/duplicate/suppressed.
- Pengelolaan source dan campaign dengan human gate.
- Staging prospect JSON yang tervalidasi server.
- Approval/rejection batch dan ringkasan validasi.

## Deployment

1. Backup database Supabase.
2. Terapkan `0030_acquisition_governance_and_growth_ops.sql`.
3. Jalankan `production_readiness.sql`; pastikan `acquisition_governance_phase5_ready = true`.
4. Tambahkan `ACQUISITION_CRON_SECRET` yang acak dan berbeda pada API.
5. Tambahkan `ACQUISITION_DRY_RUN=true` pada API.
6. Deploy `binahub-api 0.11.0`, lalu `app-binahub 0.11.0`.
7. Impor `04-acquisition-batch-processor.json`, hubungkan credential `BinaHub Acquisition API`, dan biarkan inactive.

## UAT yang Ditunda

- Source outbound tanpa lawful basis/privacy notice/owner ditolak.
- Campaign tidak dapat active tanpa source approved, human approval, dan tanggal.
- Batch dari source/campaign yang belum approved ditolak.
- Email invalid, suppressed, opted-out, serta duplicate diklasifikasikan dengan benar.
- Batch approved dry-run tidak membuat lead.
- Live promotion dan retry tidak membuat lead ganda.
- Tidak ada email atau outreach yang dikirim oleh processor.

## Belum Dikerjakan atau Membutuhkan Keputusan

- Akun dan paket Apollo.
- API credentials Google/Meta/Microsoft Ads.
- Sumber LinkedIn/Google Maps yang diizinkan secara kontraktual dan hukum.
- ICP serta exclusion list final.
- Kebijakan legitimate interest, consent wording, retention, dan deletion final.
- Domain/subdomain outbound serta warming policy.
- Budget, owner, dan target campaign riil.
- Adapter vendor otomatis; saat ini ingestion dilakukan lewat governed batch.
