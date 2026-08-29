# Fase 4 — Automation Control & Production Hardening

Tanggal: 29 Agustus 2026  
Versi working copy: `0.10.0`

## Ringkasan

Fase 4 membangun lapisan kontrol antara sinyal otomatis dan pekerjaan manusia. Scheduler tidak mengambil keputusan komersial dan tidak menghubungi client. Ia hanya membaca data yang sudah tersedia, membentuk kandidat deterministik, dan—setelah dry-run dinonaktifkan—membuat human task idempotent untuk ditangani owner melalui dashboard.

UAT end-to-end tetap ditunda sampai seluruh fase selesai. Karena itu workflow n8n baru selalu diimpor dalam kondisi inactive dan API memakai `OPERATIONS_DRY_RUN=true` secara default.

## Yang Sudah Dibangun

### Human task queue

- Tipe task: client review, renewal review, account risk, delivery risk, milestone overdue, retention action, proposal review, dan system alert.
- Task memiliki priority, owner, due time, SLA policy key, status, escalation level, source record, serta metadata bukti.
- Task aktif/menunggu wajib memiliki owner.
- Task completed/cancelled wajib memiliki actor dan catatan penyelesaian minimal lima karakter.
- Setiap perubahan task disimpan dalam append-only task event.

### Scheduler deterministik

- Client review yang sudah jatuh tempo.
- Renewal dalam bucket 90/60/30 hari.
- Account berstatus at risk/critical.
- Delivery project at risk atau high/critical.
- Milestone yang melewati due date.
- Next action retention yang jatuh tempo.
- Task key unik mencegah duplikasi ketika n8n/API retry.

### Automation run audit

- Workflow key dan idempotency key unik per run.
- Mode dry-run/live, trigger source, kandidat, task yang dibuat, failure, waktu mulai/selesai, dan error tersimpan.
- Run dengan key sama tidak diproses ulang.

### Operations Control dashboard

- Ringkasan task aktif, task melewati SLA, critical priority, dan run gagal.
- Filter queue, pencarian, assignment owner, due time, status, priority, serta resolusi.
- Riwayat automation run membedakan dry-run dan live.

## Batas Keputusan AI

Automation Fase 4 tidak boleh:

- menyelesaikan atau membatalkan human task;
- menyetujui proposal, diskon, renewal, atau retention opportunity;
- menandai kontrak/invoice/payment selesai;
- mengirim email atau menghubungi client;
- mengganti PIC berdasarkan enrichment eksternal;
- mengubah health score tanpa review manusia.

## Deployment

1. Backup database Supabase.
2. Terapkan `0029_automation_control_and_human_tasks.sql`.
3. Jalankan `production_readiness.sql` dan pastikan `automation_control_phase4_ready = true`.
4. Tambahkan secret acak `OPERATIONS_CRON_SECRET` pada API.
5. Tambahkan `OPERATIONS_DRY_RUN=true` pada API.
6. Deploy `binahub-api 0.10.0`, lalu `app-binahub 0.10.0`.
7. Impor `03-client-operations-scheduler.json`, buat credential `BinaHub Operations API`, tetapi jangan aktifkan workflow.

## UAT yang Ditunda

- Dry-run hanya mengembalikan kandidat dan tidak membuat operational task.
- Live run membuat satu task per task key dan retry tidak menggandakan data.
- Renewal menghasilkan bucket 90/60/30 sesuai tanggal.
- Account/delivery risk dan milestone overdue membentuk priority yang benar.
- Task in-progress/waiting tanpa owner ditolak.
- Task completed/cancelled tanpa catatan resolusi ditolak.
- Seluruh perubahan muncul pada task event dan seluruh scheduler call muncul pada automation run.

## Belum Dikerjakan atau Membutuhkan Keputusan

- Recipient dan kanal notifikasi eskalasi eksternal.
- SLA final per jenis task serta kalender hari libur operasional.
- QBR cadence resmi.
- Formula dan bobot account health final.
- Instrumen NPS/CSAT.
- Vendor kontrak/e-sign serta invoice/payment.
- Data owner/backup/approver resmi dari Business Rules final.

