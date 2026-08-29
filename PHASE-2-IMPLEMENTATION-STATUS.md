# Fase 2 — Status Implementasi Lead & Proposal Operations

Tanggal pembaruan: 29 Agustus 2026
Versi working copy: `app-binahub 0.8.0`, `binahub-api 0.8.0`

## Kesimpulan

Implementasi kode utama Fase 2 sudah tersedia di working copy. Sistem sekarang mempunyai Sales Pipeline yang dapat dioperasikan manusia, qualification berbasis data yang tidak menebak, template follow-up terkontrol, webhook deliverability, dan audit trail. Fitur ini belum boleh dianggap aktif di production sampai migration `0027`, environment, webhook Resend, dan deployment v0.8.0 selesai.

UAT bisnis sengaja ditunda sesuai keputusan saat ini. Type checking boleh dijalankan sebagai pemeriksaan integritas kode, tetapi tidak menggantikan UAT end-to-end.

## Sudah Dibangun

### 1. Sales Pipeline dan human control

- Tahap: identified, qualified, consultation, proposal, negotiation, won, lost.
- Owner peluang, next action, due date, zona waktu lead, nilai peluang, dan alasan lost.
- Human pause beserta alasan, actor, dan waktu pause.
- Perubahan opportunity dilakukan melalui RPC atomik dan langsung menulis activity trail.
- Pause disinkronkan ke assessment dan inquiry agar scheduler tidak tetap mengirim.
- Dashboard menampilkan peluang aktif, overdue next action, peluang tanpa owner, dan alert deliverability.

### 2. Qualification capture

- Assessment publik tetap tanpa autentikasi.
- Profil menangkap industri dan lokasi.
- Konteks strategis menangkap timeline, status budget, dukungan sponsor, next-step intent, dan konsekuensi bisnis.
- Semua pilihan menyediakan kondisi belum diketahui; sistem tidak mengubah data kosong menjadi asumsi positif.
- Rules deterministik memakai data tersebut untuk score, Cold/Warm/Hot, confidence, buying signals, ICP exclusion, dan missing data.

### 3. Template follow-up dan activation gate

- Sembilan template key dalam dua bahasa (18 template aktif saat lengkap) mencakup inquiry, assessment result, dan proposal pada H+2/H+7/H+14.
- Status template: draft, approved, archived; satu versi approved per key dan locale.
- Approval template wajib non-mock, memiliki catatan persetujuan, actor, dan waktu.
- Pergantian versi approved dilakukan atomik agar kegagalan update tidak menghapus versi aktif sebelumnya.
- Scheduler production membutuhkan dua pengunci sekaligus: Business Rules outbound aktif dan template approved tersedia.
- Migration menyediakan draft mock agar bentuk workflow dapat direview; draft mock tidak dapat dikirim.

### 4. Deliverability dan reply handling

- Webhook Resend memverifikasi signature Svix dari raw body.
- Webhook id disimpan unik sehingga delivery event tidak diproses dua kali.
- Bounce, complaint, dan provider suppression masuk `email_suppressions`.
- Bounce, complaint, suppression, failure, dan inbound reply menjeda outreach untuk keputusan manusia.
- Dashboard menampilkan delivered, reply, bounce, complaint, failed, dan processing failure.
- Deteksi reply otomatis siap di kode, tetapi memerlukan alamat inbound Resend melalui `EMAIL_REPLY_TO`.

### 5. Cal.com dan n8n

- Booking, reschedule, cancel, reject, completed, dan no-show dicatat sebagai activity opportunity.
- Booking/reschedule menjeda follow-up; cancellation tidak otomatis melanjutkan sequence.
- No-show menjeda outreach dan meminta keputusan manusia.
- Dua workflow n8n tetap inactive di repository, memakai credential terpisah, retry maksimal tiga kali, dan menyimpan failed execution.

## Belum Dapat Diselesaikan Tanpa Data atau Infrastruktur Eksternal

| Kebutuhan | Alasan belum final | Tindakan berikutnya |
|---|---|---|
| Katalog dan harga modul riil | Produk/modul masih berkembang | Ganti setiap modul mock dengan scope, unit, harga, currency, readiness, dan versi resmi |
| Business Rules aktif | Activation blockers belum seluruhnya diputuskan | Isi owner/backup, approver, SLA risiko, pajak, transaksi minimum, dan owner template; kemudian buat rule set active |
| Isi template final | Membutuhkan tone dan persetujuan komersial | Edit draft mock, review 18 template Bahasa Indonesia/Inggris, set owner, lalu approve satu per satu |
| Inbound reply Resend | Memerlukan domain/DNS receiving | Siapkan receiving domain, isi `EMAIL_REPLY_TO`, dan aktifkan event `email.received` |
| Webhook Resend production | Memerlukan secret dari dashboard Resend | Arahkan ke `/api/integrations/resend/webhook` dan isi `RESEND_WEBHOOK_SECRET` |
| n8n production | VPS belum tersedia | Tetap gunakan lokal untuk dry-run; pindahkan PostgreSQL+n8n ke VPS sebelum automasi 24/7 |
| Alert eksternal | Kanal penerima belum dipilih | Tentukan email/Slack/WhatsApp dan SLA eskalasi; dashboard saat ini menjadi inbox operasional |
| UAT end-to-end | Ditunda sampai komponen siap | Uji assessment, qualification, proposal, webhook, scheduler, retry, idempotensi, dan stop conditions setelah deployment |

## Urutan Deployment Saat Siap

1. Backup Supabase dan jalankan `production_readiness.sql`.
2. Terapkan `binahub-api/supabase/migrations/0027_sales_pipeline_and_deliverability.sql`.
3. Jalankan ulang readiness; `sales_operations_phase2_ready` dan `email_deliverability_ready` harus `true`.
4. Tambahkan environment API: `RESEND_WEBHOOK_SECRET`, `EMAIL_REPLY_TO` bila inbound siap, `CALCOM_BOOKING_URL`, dan `FOLLOW_UP_REQUIRE_APPROVED_TEMPLATE=true`.
5. Deploy `binahub-api 0.8.0`, lalu `app-binahub 0.8.0`.
6. Buat webhook Resend menuju `https://api.binahub.id/api/integrations/resend/webhook`.
7. Pertahankan `FOLLOW_UP_DRY_RUN=true` dan `TRANSFORMATION_WORKER_DRY_RUN=true` sampai UAT disetujui.
8. Uji production-like, baru kemudian aktifkan Business Rules, template, dan outbound secara bertahap.

## Batas Fase 2

Fase 2 selesai pada level kode ketika pipeline lead/proposal dapat dioperasikan dengan human gate dan audit trail. Deal-to-delivery, kontrak, invoice, kickoff, account health, QBR, renewal, dan repeat opportunity merupakan Fase 3 dan tidak diaktifkan secara implisit oleh perubahan ini.
