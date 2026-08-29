# Fase 6 — Release Reconciliation

Tanggal: 29 Agustus 2026  
Baseline production: `website-prod 0.2.18`, `app-binahub 0.11.0`, `binahub-api 0.11.0`, migration sampai `0030`

## Tujuan

Fase 6 menyamakan kondisi repository, deployment, database, katalog publik, dan n8n sebelum UAT terintegrasi. Fase ini tidak mengaktifkan outbound, proposal otomatis, atau workflow terjadwal.

## Sudah Diverifikasi

- `website-prod` v0.2.18 bersih dan sudah dideploy.
- `/pricing`, `/id/pricing`, dan `/en/pricing` production mengembalikan HTTP 200.
- `app-binahub` dan `binahub-api` v0.11.0 sudah dideploy menurut catatan operator.
- Migration `0030` sudah diterapkan menurut catatan operator.
- Endpoint production katalog publik mengembalikan data dan endpoint acquisition menolak request tanpa secret.
- Docker n8n dan PostgreSQL lokal sehat.
- Empat workflow sudah diimpor dan seluruhnya inactive.
- `binahub-automation` sudah memiliki repository Git lokal, `.gitignore`, version file, dan changelog.

## Rekonsiliasi yang Dibangun

- Migration `0031_phase6_release_reconciliation.sql` mengubah versi `BI-PUBLIC` menjadi `v1.0-public` dan status produk BinaInsight menjadi `ready`.
- Endpoint katalog hanya membaca produk `ready`, lalu tetap menyaring modul aktif, ready, dan non-mock.
- Respons katalog tidak lagi mengklaim harga belum termasuk pajak selama wording Finance/Legal belum final.
- `production_readiness.sql` memiliki gate `public_catalog_phase6_ready`.
- Dokumentasi Fase 2–5 diperbarui agar membedakan deployed, inactive, dan UAT belum selesai.

## Masih Memerlukan Tindakan Operator

1. Backup Supabase dan terapkan migration `0031_phase6_release_reconciliation.sql`.
2. Jalankan `production_readiness.sql`; pastikan `public_catalog_phase6_ready = true` dan counter issue tetap nol.
3. Deploy `binahub-api 0.11.1`.
4. Verifikasi respons `/api/catalog/modules` menampilkan `catalogVersion: v1.0-public` dan status pajak belum final.
5. Buat credential n8n `BinaHub Operations API` memakai `OPERATIONS_CRON_SECRET`.
6. Buat credential n8n `BinaHub Acquisition API` memakai `ACQUISITION_CRON_SECRET`.
7. Hubungkan credential ke workflow 03 dan 04; jangan aktifkan workflow.
8. Buat initial commit dan remote privat untuk `binahub-automation` tanpa memasukkan `.env`.

## Exit Criteria Fase 6

- Website pricing production 200: **lulus**.
- Empat workflow tersedia dan inactive: **lulus**.
- Automation project mempunyai Git lokal dan proteksi secret: **lulus; initial commit/remote menunggu operator**.
- Migration 0031 dan API 0.11.1 production: **menunggu operator**.
- Credential workflow 03/04 terhubung: **menunggu operator**.
- Readiness database seluruhnya hijau: **menunggu hasil SQL production**.

Setelah seluruh exit criteria terpenuhi, pekerjaan berpindah ke Fase 7 — Integrated UAT & Security Gate.
