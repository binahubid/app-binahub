# Fase 10 — Controlled Pilot Operations & Kill Switch

Tanggal: 30 Agustus 2026  
Target release: `binahub-api 0.14.0`, `app-binahub 0.14.0`, `website-prod 0.2.20`

## Tujuan

Fase 10 menyediakan control plane untuk menyusun release pilot, merekam keputusan manusia, membatasi volume per worker, dan menghentikan worker melalui kill switch. Control plane tidak dapat mengaktifkan n8n atau mengubah environment. Database hanya dapat mempertahankan atau memperketat mode; `*_DRY_RUN=true` selalu menang.

## Implementasi

- Migration `0035_phase10_pilot_operations_control_plane.sql` membuat release plan, runtime control, dan audit event immutable.
- Empat runtime control disiapkan dalam mode `dry_run`: Follow-up, Transformation Event, Client Operations, dan Acquisition.
- Release plan menyimpan cohort, maksimum peserta, jadwal, tiga owner, kriteria sukses, trigger rollback, rollback plan, status, keputusan, dan approver.
- Approval release ditolak sampai 12 UAT wajib lulus, 18 template non-mock approved tersedia, dan Business Rules aktif membuka outbound tanpa blocker.
- Mode `pilot`/`live` ditolak tanpa release non-mock approved/scheduled, owner, approval manusia, catatan keputusan, dan rollback plan.
- Release tidak dapat dipause, di-rollback, atau diselesaikan selama masih direferensikan runtime control ber-mode pilot/live.
- Kill switch memerlukan alasan dan menghasilkan audit event.
- Empat route worker menghitung `effectiveMode` dari database dan environment; mode `disabled` mengembalikan HTTP 423 sebelum pekerjaan dilakukan.
- Dashboard `Pilot Operations` menampilkan gate, release editor, requested/effective mode, limit per run, approval, serta kill switch.
- `production_readiness.sql` memeriksa tabel, RPC, seed control, audit seed, orphan active release, dan approval mock.

## Model Pengamanan

| Database | Environment | Effective mode |
|---|---|---|
| disabled | nilai apa pun | disabled |
| dry_run | nilai apa pun | dry_run |
| pilot/live | `*_DRY_RUN=true` | dry_run |
| pilot | `*_DRY_RUN=false` | pilot |
| live | `*_DRY_RUN=false` | live |

Requested mode bukan perintah langsung kepada scheduler. n8n tetap harus diaktifkan secara terpisah dan hanya setelah deployment checklist, monitoring, dan keputusan manusia selesai.

## Urutan Deployment

1. Backup database dan jalankan `production_readiness.sql` sebelum perubahan.
2. Jalankan migration `0035_phase10_pilot_operations_control_plane.sql` sebagai satu file penuh.
3. Jalankan kembali readiness; `pilot_operations_phase10_ready=true`, `pilot_operations_definition_issues=0`, `active_runtime_release_issues=0`, dan `pilot_release_mock_approval_issues=0`.
4. Deploy `binahub-api 0.14.0`, lalu `app-binahub 0.14.0`.
5. Pertahankan seluruh `*_DRY_RUN=true` dan workflow n8n inactive.
6. Login admin, buka `Pilot Operations`, dan pastikan empat control menunjukkan requested/effective `dry_run`.
7. Buat draft release mock untuk memeriksa UI. Draft ini tidak dapat masuk review.
8. Ganti dengan data real hanya setelah owner dan kebijakan final tersedia.
9. Jalankan Human UAT Fase 9. Approval pilot tetap ditolak sampai seluruh gate benar-benar lulus.

## Exit Criteria Engineering

- Migration dan RPC terverifikasi pada PostgreSQL disposable.
- RLS aktif; anon/authenticated tidak mempunyai akses langsung; service role menjadi boundary server.
- Anonymous/non-admin tidak dapat membaca atau memutasi control plane.
- Empat worker fail-closed jika control hilang, tidak terbaca, atau disabled.
- Lint, typecheck, unit test, production build, dan dependency audit lulus.
- Smoke gate `npm run test:phase10` tersedia untuk dijalankan terhadap API production setelah deployment.
- Semua workflow n8n tetap inactive dan semua environment dry-run tetap `true`.

## Pekerjaan Manusia yang Tetap Menunggu

- Melengkapi Business Rules dan katalog real yang masih kosong.
- Menyetujui 18 template outreach non-mock.
- Menjalankan dan mendokumentasikan 12 skenario UAT wajib.
- Menetapkan cohort, owner, jadwal, success criteria, rollback trigger, dan rollback plan real.
- Menyiapkan monitoring selama pilot dan personel yang berwenang menekan kill switch.
- Mengubah environment serta mengaktifkan workflow n8n hanya pada change window yang disetujui.

Fase 10 menyelesaikan pembangunan kontrol pilot, bukan pelaksanaan pilot. Sampai pekerjaan manusia di atas selesai, status yang benar tetap `construction_locked` dan effective mode tetap `dry_run`.
