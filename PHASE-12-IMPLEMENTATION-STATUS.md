# Fase 12 — Pilot Rehearsal & Acceptance Certification

Tanggal implementasi: 30 Agustus 2026

## Outcome

Fase 12 menambahkan gate terakhir sebelum keputusan go/no-go. Tim menjalankan rehearsal dengan konfigurasi produksi tetapi seluruh worker tetap dry-run, mencatat delapan bukti wajib, mengikat hasil ke snapshot monitoring real yang fresh, lalu menyimpan acceptance manusia.

## Komponen

- Migration API `0037_phase12_pilot_rehearsal_certification.sql`.
- API/app `0.16.0`; website tetap `0.2.20`; automation tetap `0.2.0`.
- Endpoint admin `/api/admin/pilot-certification`.
- Tab admin `Pilot Certification`.
- Readiness gate `pilot_certification_phase12_ready` dan smoke gate `npm run test:phase12`.
- Lima workflow n8n tetap inactive; tidak ada workflow baru pada Fase 12.

## Delapan Langkah Rehearsal

1. Environment guard.
2. Follow-up Scheduler dry-run.
3. Transformation Event Worker dry-run.
4. Client Operations dry-run.
5. Acquisition Processor dry-run.
6. Retry dan idempotensi.
7. Incident drill dan kill switch.
8. Recovery dan rekonsiliasi.

## Gate yang Diterapkan

1. Rehearsal real membutuhkan release approved non-mock, owner, approver, dan environment production.
2. Rehearsal selalu `dry_run=true` dan baru lulus setelah delapan langkah passed dengan evidence.
3. Snapshot harus terikat release yang sama, non-mock, tidak critical/insufficient, dan berusia kurang dari 24 jam.
4. Acceptance membutuhkan seluruh UAT wajib lulus, empat policy monitoring real/aktif/owned, serta tidak ada critical incident terbuka.
5. `accepted` membutuhkan snapshot healthy tanpa blocker dan tanpa high/critical incident terbuka.
6. Go/no-go dan scheduling release ditolak tanpa acceptance yang sesuai.
7. Runtime `pilot` menerima accepted/accepted with conditions; `live` hanya menerima accepted penuh.

## Batas Aman

- Acceptance tidak menyalakan workflow, tidak mengubah environment, dan tidak mengirim pesan keluar.
- Workflow n8n tetap inactive sampai UAT/rehearsal/acceptance/go-no-go selesai dan deployment aktivasi disetujui terpisah.
- Sertifikasi tidak dapat diubah ketika runtime release masih pilot/live; kill switch harus dijalankan lebih dahulu.

## Verifikasi Engineering

- Seluruh migration app/API diterapkan pada PostgreSQL 16 disposable tanpa error.
- Negative gate berhasil menolak keputusan `go` sebelum acceptance.
- Positive flow berhasil: delapan step passed → rehearsal passed → accepted → go review → schedule → runtime pilot.
- `production_readiness.sql` menghasilkan `pilot_certification_phase12_ready = true` serta seluruh counter Phase 12 `0` pada fixture valid.
- Typecheck dan lint dashboard lulus sebelum rilis final.

## Langkah Operator Setelah Build

1. Backup database, lalu jalankan migration `0037` satu file penuh.
2. Jalankan `production_readiness.sql`; pastikan flag Phase 12 true dan counter issue nol.
3. Deploy API `0.16.0`, kemudian app `0.16.0`.
4. Jalankan `PHASE12_API_URL=https://api.binahub.id npm run test:phase12`.
5. Buka tab Pilot Certification untuk mengisi evidence real. Jangan aktifkan lima workflow n8n pada tahap deployment ini.

Setelah deployment dan smoke gate selesai, lakukan regroup untuk menentukan strategi UAT/rehearsal real, pilot cohort, activation window, dan rollback ownership.
