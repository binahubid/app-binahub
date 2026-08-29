# Fase 8 — Launch Control & Observability

Tanggal: 30 Agustus 2026
Target release: `binahub-api 0.12.0`, `app-binahub 0.12.0`, `website-prod 0.2.20`

## Tujuan

Fase 8 membuat kesiapan automation dapat dibaca dan diaudit sebelum go-live. Sistem memisahkan tiga hal yang sebelumnya mudah tercampur: konfigurasi tersedia, dry-run terverifikasi, dan izin bisnis untuk aktivasi. Fase ini tidak menambahkan tombol aktivasi dan tidak mengubah worker menjadi live.

## Implementasi

- Endpoint admin read-only `/api/admin/launch-readiness` menggabungkan status environment tanpa mengirim nilai secret, Business Rules, katalog modul, template approved, acquisition governance, Cal.com lineage, email delivery evidence, event queue, serta run terakhir.
- Tab `Launch Control` menampilkan empat workflow: Follow-up Scheduler, Transformation Event Worker, Client Operations Scheduler, dan Acquisition Batch Processor.
- Setiap workflow mempunyai technical status, activation status, mode dry-run/live, check list, blocker, dan run evidence.
- Follow-up Scheduler serta Transformation Event Worker kini menulis audit ke `automation_runs`; Operations dan Acquisition tetap memakai audit yang sudah ada.
- Mode live yang ditemukan dashboard selalu menjadi `live_guard_required`, bukan dianggap lulus otomatis.
- Business Rules draft, outbound disabled, template kosong, source/campaign legal kosong, dan delivery evidence kosong tetap menjadi blocker yang terlihat.
- `.env.example` menggunakan dry-run sebagai default aman untuk seluruh worker.

## Kondisi Data Saat Implementasi

- Business Rules: `v1.0-approved-partial`, status `draft`, sembilan activation blocker.
- Katalog: satu modul ready/non-mock (BinaInsight gratis), belum ada modul komersial ready dengan harga resmi.
- Template: 0/18 template non-mock approved.
- Email delivery webhook evidence: 0 event.
- Operations dan Acquisition mempunyai run production `succeeded`, `dry_run=true`.
- Follow-up dan Event Worker baru akan memiliki audit database setelah API `0.12.0` dideploy dan keduanya dieksekusi ulang.

## Deployment dan UAT Fase 8

1. Tidak ada migration SQL baru pada Fase 8.
2. Deploy `binahub-api 0.12.0`.
3. Pastikan `FOLLOW_UP_DRY_RUN=true`, `TRANSFORMATION_WORKER_DRY_RUN=true`, `OPERATIONS_DRY_RUN=true`, dan `ACQUISITION_DRY_RUN=true`.
4. Deploy `app-binahub 0.12.0`.
5. Website tidak memerlukan deploy baru; baseline `0.2.20` sudah memenuhi gate Fase 7.
6. Execute manual Follow-up Scheduler dan Transformation Event Worker satu kali dari n8n lokal. Keduanya harus sukses dan tetap dry-run.
7. Operations dan Acquisition boleh dieksekusi ulang untuk menyegarkan evidence; hasil harus sukses dan dry-run.
8. Login admin, buka `Launch Control`, lalu pastikan tidak ada workflow berstatus live.
9. Hasil yang benar pada data saat ini: technical evidence dapat hijau setelah run, tetapi Follow-up/Acquisition tetap locked oleh keputusan bisnis/data riil yang belum lengkap.
10. Pertahankan keempat workflow n8n inactive. Jangan mengubah environment ke live pada fase ini.

## Exit Criteria

- API dan app build/test lulus.
- Launch endpoint menolak anonymous request.
- Nilai secret tidak pernah dikirim pada response.
- Empat workflow terlihat dengan mode dan bukti run yang benar.
- Mode live menghasilkan guard merah.
- Tidak tersedia mutasi/tombol aktivasi.
- Follow-up dan Event Worker mempunyai audit run dry-run setelah deployment.

Initial commit/remote privat `binahub-automation` tetap deferred atas keputusan operator dan bukan blocker Fase 8.
