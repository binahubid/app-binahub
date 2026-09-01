# Fase 14 — Configurable Commercial & Learning Operations

## Tujuan

Mengubah keputusan bisnis yang sebelumnya menunggu dokumen statis menjadi control plane yang dapat dikelola administrator, tanpa menghilangkan human approval untuk keputusan berisiko.

## Ruang lingkup rilis 0.17.0

1. Katalog produk dan modul dapat dibuat, diubah, dipublikasikan, diarsipkan, atau dihapus dari `/admin/catalog`.
2. Katalog publik tersedia di `/catalog`; hanya item siap, aktif, non-mock, dan `public_visible` yang muncul.
3. Minimum transaksi, owner/backup, approval/delegasi, SLA risiko, serta wording finance/legal dikelola di `/admin/settings`.
4. Pre-test dan Post-test menjadi modul program; admin menyusun atau mengimpor soal di `/admin/programs/tests?programId=...`.
5. Peserta mengisi test melalui `/client/program/test?kind=pre_test|post_test` dan admin memperoleh statistik respons.
6. Tautan program dilengkapi QR code berlabel nama/kode program yang dapat diunduh.
7. Tips halaman menjadi panel informasi dari ikon `i`, bukan kolom permanen yang mempersempit konten.

## Keputusan yang tetap memerlukan review manusia

- Delapan belas template follow-up tetap berada dalam review konten.
- Wording finance/legal disediakan sebagai template `review`; status `approved` membutuhkan catatan approval manusia.
- SLA dan delegasi awal tidak aktif. Mengisi nilai saja tidak mengaktifkannya.
- Publish katalog dan questionnaire merupakan tindakan admin eksplisit dan tercatat.

## Urutan deployment

1. Jalankan migration API `0039_configurable_business_and_program_assessments.sql`.
2. Jalankan `supabase/production_readiness.sql` dan pastikan semua tabel baru menunjukkan `rls_enabled=true`, `anon_blocked=true`, dan `authenticated_writes_blocked=true`.
3. Deploy `binahub-api` v0.17.0.
4. Deploy `app-binahub` v0.17.0.
5. Login sebagai admin, buka `/admin/catalog` dan `/admin/settings`, lalu simpan konfigurasi yang disetujui.
6. Jalankan smoke gate API:

   ```powershell
   $env:PHASE14_API_URL="https://api.binahub.id"
   npm run test:phase14
   Remove-Item Env:PHASE14_API_URL
   ```

## Acceptance check

- Produk draf tidak muncul pada `/catalog`; produk ready + public dan modul ready + active + non-mock + public muncul tepat satu kali.
- Owner dan backup tidak dapat menunjuk akun yang sama.
- Delegasi/SLA nonaktif tidak mengubah workflow.
- Questionnaire tanpa soal tidak dapat dipublikasikan.
- Questionnaire yang telah memiliki respons tidak dapat diganti massal atau dihapus.
- Peserta hanya dapat membuka test pada programnya dan modul yang diaktifkan.
- QR dapat dipindai menuju link program dan file PNG menyertakan nama/kode program.
