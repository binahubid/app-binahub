# Fase 7 — Integrated UAT & Security Gate

Tanggal penutupan engineering gate: 30 Agustus 2026
Release tervalidasi: `binahub-api 0.11.2`, `app-binahub 0.11.2`, `website-prod 0.2.20`, migration sampai `0033`

## Status

**Engineering gate lulus.** Seluruh workflow tetap inactive dan seluruh worker tetap dry-run. Human end-to-end UAT yang memerlukan akun, email, perangkat, dan keputusan bisnis riil dipindahkan menjadi activation gate setelah semua fase pembangunan selesai; penundaan itu tidak memberi izin untuk mengaktifkan automation.

## Evidence Production yang Lulus

- Migration `0032_phase7_client_operations_union_fix.sql` dan `0033_phase7_calcom_booking_lineage.sql` telah dijalankan.
- RLS result set yang diberikan operator: semua tabel yang dilaporkan mempunyai RLS aktif, anonymous blocked, dan authenticated writes blocked.
- `npm run test:phase7` terhadap `https://api.binahub.id`: 18/18 check lulus, meliputi katalog publik, auth boundary, signature webhook, CORS, dan security headers.
- Client Operations retry setelah `0032`: HTTP 200, `dryRun=true`, `retried=true`, 0 task dibuat; pemanggilan kedua mengembalikan duplicate terhadap run `succeeded`.
- Cal.com setelah `0033`: dua booking tersimpan sebagai `rescheduled` dan `cancelled`, tidak ada `provider_series_uid` kosong, serta tidak ada active duplicate series.
- Acquisition Processor: `dryRun=true`, run `succeeded`, 0 promotion dan 0 failure.
- Follow-up Scheduler: `dryRun=true`, 11 kandidat, 0 terkirim dan 0 failure.
- Transformation Event Worker: `dryRun=true`, 0 pending dan 0 diproses.
- `app.binahub.id` dan `binahub.id`: HTTP 200 serta HSTS, nosniff, frame denial, referrer policy, permissions policy, dan CSP header tersedia setelah deploy app `0.11.2`/website `0.2.20`.
- API, app, dan website: lint/typecheck/test/build serta audit dependency yang relevan lulus.

## Defect yang Ditutup

- UUID nullable pada union Client Operations diperbaiki dan failed run dapat diklaim ulang secara race-safe.
- Acquisition failed/partial run dapat diklaim ulang tanpa membuat lead atau idempotency key ganda.
- Reschedule Cal.com memakai `iCalUID` sebagai series lineage sehingga slot lama tidak tertinggal `confirmed`.
- Origin asing tidak menerima fallback CORS dan `X-Idempotency-Key` masuk preflight allow-list.
- Security headers dipindahkan dari `.htaccess` ke Next.js response karena Hostinger menjalankan aplikasi sebagai Node.js Web App.

## Limitation yang Tercatat

Hostinger CDN mempertahankan header CSP miliknya sebagai `upgrade-insecure-requests`, sehingga policy CSP origin yang lebih ketat tidak terlihat pada response production. HSTS, nosniff, frame denial, referrer policy, dan permissions policy diterapkan sesuai konfigurasi. Hardening CSP lanjutan memerlukan pengaturan CDN yang mendukung custom response policy atau perpindahan edge/proxy; ini bukan alasan untuk mengaktifkan workflow lebih awal.

## Human Activation Gate yang Tetap Terbuka

- Assessment publik lengkap sampai PDF dan email hasil pada inbox nyata.
- Admin login dan role boundary memakai akun riil setiap role.
- Proposal approval, won-to-client handoff, delivery, dan retention scenario.
- Cal.com no-show dan meeting-ended.
- Resend signed webhook untuk delivered, bounced, complaint, dan suppression.
- Accessibility dan visual regression pada perangkat mobile nyata.

## Keputusan

Fase 7 selesai untuk pembangunan dan engineering verification. Pekerjaan berpindah ke Fase 8 — Launch Control & Observability. Aktivasi tetap dilarang sampai Business Rules, template, legal source, deliverability evidence, human UAT, dan keputusan go-live selesai.
