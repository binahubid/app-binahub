# Fase 7 — Integrated UAT & Security Gate

Tanggal: 29 Agustus 2026  
Target release: `binahub-api 0.11.2`, `app-binahub 0.11.1`, `website-prod 0.2.19`, `binahub-automation 0.1.1`

## Tujuan

Fase 7 menguji integrasi yang dibangun pada Fase 2–6, memperbaiki defect yang ditemukan, dan mempertahankan seluruh automation dalam dry-run/inactive sampai production gate lulus. Fase ini tidak mengaktifkan outbound email, proposal otomatis, promotion acquisition live, atau scheduler terjadwal.

## Evidence yang Sudah Lulus

- API: lint, typecheck, 82 unit test lulus, 2 test integrasi environment skipped, production build lulus.
- App: lint, typecheck, 41 unit test, 17 Playwright E2E, dan production build lulus.
- Website: public quality gate, static asset check, dan production build lulus.
- `npm audit --omit=dev --audit-level=high` pada API, app, dan website: 0 vulnerability.
- Smoke gate API lokal: 18 pemeriksaan lulus, meliputi kontrak katalog, auth boundary, signature webhook, CORS, dan security headers.
- RLS production yang diberikan operator: seluruh tabel yang dilaporkan mempunyai RLS aktif, anon blocked, dan authenticated writes blocked.
- Cal.com production: `BOOKING_CREATED`, `BOOKING_RESCHEDULED`, dan `BOOKING_CANCELLED` diterima serta diproses.
- n8n local: container sehat, PostgreSQL sehat, tepat empat workflow tersedia, seluruh workflow inactive.
- Follow-up execution: `dryRun=true`, 11 kandidat, 0 terkirim, 0 failure.
- Transformation Event Worker: `dryRun=true`, 0 pending, 0 diproses.
- Acquisition Processor: `dryRun=true`, 0 kandidat, 0 dipromosikan, 0 failure.

## Defect yang Ditemukan dan Diperbaiki

### Client Operations Scheduler

Production run gagal dengan `UNION types text and uuid cannot be matched`. Migration `0032_phase7_client_operations_union_fix.sql` memberi tipe UUID eksplisit pada nullable candidate IDs. API juga dapat mengklaim ulang run `failed` secara race-safe; run sukses/running tetap idempotent.

### Acquisition Retry

Run Acquisition berstatus `failed`/`partial` sebelumnya terkunci sebagai duplicate. API `0.11.2` dapat mengklaim ulang audit run tersebut tanpa membuat run atau lead ganda.

### Cal.com Reschedule Lineage

Cal.com mengganti booking UID saat reschedule tetapi mempertahankan `iCalUID`. Implementasi lama meninggalkan booking awal `confirmed`. Migration `0033_phase7_calcom_booking_lineage.sql` menyimpan series UID, melakukan backfill, dan menandai slot lama sebagai `rescheduled`.

### CORS dan Static Security Headers

- Origin asing tidak lagi menerima `Access-Control-Allow-Origin` fallback.
- `X-Idempotency-Key` masuk allow-list preflight.
- App dan website static export membawa `.htaccess` dengan HSTS, nosniff, frame denial, referrer policy, permissions policy, dan CSP sesuai resource yang digunakan.

### Repeatable Gate

- API: `npm run test:phase7`.
- Automation: `scripts/check-local-readiness.ps1` sekarang memeriksa health, empat workflow, activation gate, secret presence, dan API reachability dengan exit code yang benar.

## Temuan Deployment Production

Smoke test terhadap `https://api.binahub.id` masih gagal pada dua check:

1. respons katalog masih memakai kontrak lama `pricesExcludeTax: true` dan belum memiliki `taxPolicyFinalized`;
2. CORS masih mengirim fallback origin pada request dari origin asing.

Cache-busting menghasilkan cache MISS, sehingga production belum menjalankan artifact API terbaru. Database sudah mengembalikan katalog `v1.0-public`, tetapi deployment API perlu diulang dari working copy `0.11.2`.

## Urutan Tindakan Operator

1. Backup Supabase production.
2. Jalankan migration `0032_phase7_client_operations_union_fix.sql`.
3. Jalankan migration `0033_phase7_calcom_booking_lineage.sql`.
4. Jalankan `production_readiness.sql` dan simpan seluruh result set, bukan hanya result set RLS.
5. Pastikan semua `*_ready = true`, termasuk `client_operations_phase7_ready` dan `calendar_booking_lineage_phase7_ready`; seluruh `*_issues = 0`.
6. Deploy `binahub-api 0.11.2`.
7. Dari folder API jalankan:

   ```powershell
   $env:PHASE7_API_URL="https://api.binahub.id"
   npm run test:phase7
   Remove-Item Env:PHASE7_API_URL
   ```

8. Execute manual workflow **Client Operations Scheduler**. Hasil yang benar: HTTP success, `dryRun=true`, run `succeeded`, dan tidak ada task baru.
9. Execute workflow yang sama sekali lagi. Hasil kedua harus duplicate terhadap run yang sudah sukses, bukan duplicate terhadap run gagal.
10. Deploy `app-binahub 0.11.1` dan `website-prod 0.2.19`, lalu bersihkan cache Hostinger/CDN.
11. Verifikasi header production dan fungsi login/pricing/Google Maps/PDF preview setelah CSP aktif.
12. Pertahankan seluruh workflow n8n inactive dan seluruh `*_DRY_RUN=true`.

Initial commit dan remote privat `binahub-automation` tetap deferred atas keputusan operator. Source `.env`, credential, database, dan volume Docker tidak boleh masuk Git.

## UAT yang Masih Memerlukan Manusia

- Assessment publik lengkap sampai PDF dan email hasil.
- Admin login, role boundary, Sales Operations, proposal approval, handoff won-to-client, delivery, dan retention memakai akun nyata tiap role.
- Cal.com no-show dan meeting-ended.
- Resend signed webhook untuk delivered, bounced, complaint, dan suppression.
- Accessibility dan visual regression pada perangkat mobile nyata.

## Exit Criteria

Fase 7 belum boleh dinyatakan selesai sampai migration `0032`/`0033`, API `0.11.2`, app `0.11.1`, website `0.2.19`, production smoke gate, Operations retry, seluruh readiness result set, dan human UAT kritis sudah lulus. Workflow tetap inactive sampai keputusan aktivasi terpisah.
