# Fase 9 — Human UAT & Pilot Gate

Tanggal: 30 Agustus 2026
Target release: `binahub-api 0.13.0`, `app-binahub 0.13.0`, `website-prod 0.2.20`

## Tujuan

Fase 9 mengubah UAT dari daftar informal menjadi proses yang memiliki owner, status, bukti, hasil aktual, blocker, dan audit trail. Sistem hanya dapat menyatakan seluruh skenario wajib **layak direview manusia**. Sistem tidak dapat menyetujui pilot, mengubah dry-run, mengaktifkan workflow n8n, atau mengirim komunikasi live.

## Implementasi

- Migration `0034_phase9_human_uat_pilot_gate.sql` membuat `uat_scenarios`, `uat_scenario_events`, dan RPC `update_uat_scenario`.
- Dua belas skenario wajib disiapkan untuk assessment publik/PDF/email, RBAC, proposal human gate, lifecycle Cal.com, webhook Resend, suppression, client handoff, delivery risk, retention, mobile/accessibility, dry-run/idempotensi, dan traceability end-to-end.
- Status `in_progress`, `passed`, `failed`, dan `blocked` wajib memiliki owner.
- Status `passed`/`failed` wajib mempunyai catatan bukti dan hasil aktual; status `blocked` wajib mempunyai alasan.
- Skenario wajib tidak dapat ditandai `not_applicable`.
- Endpoint admin `/api/admin/pilot-readiness` menyediakan GET readiness dan PATCH hasil UAT tervalidasi.
- Tab `UAT & Pilot Gate` menampilkan progres, daftar skenario, editor bukti, serta audit trail.
- Evaluator readiness selalu mengembalikan `activationLocked=true` dan `humanDecisionRequired=true`.
- `production_readiness.sql` menambahkan gate struktur Fase 9 serta counter progres manusia yang tidak disamakan dengan error database.
- Next.js server meneruskan `/api/*` ke `NEXT_PUBLIC_BINAHUB_API_URL`; ini menutup 404 production pada dashboard ketika app dan API berada di host berbeda.

## Deployment

1. Backup database dan jalankan `production_readiness.sql` sebelum perubahan.
2. Jalankan migration `0034_phase9_human_uat_pilot_gate.sql` sebagai satu file penuh.
3. Jalankan kembali `production_readiness.sql`; `human_uat_pilot_gate_phase9_ready` harus `true` dan `uat_definition_issues` harus `0`.
4. Deploy `binahub-api 0.13.0`, kemudian `app-binahub 0.13.0`.
5. Pertahankan `FOLLOW_UP_DRY_RUN=true`, `TRANSFORMATION_WORKER_DRY_RUN=true`, `OPERATIONS_DRY_RUN=true`, dan `ACQUISITION_DRY_RUN=true`.
6. Login admin dan buka `UAT & Pilot Gate`.
7. Sebelum login, buka `https://app.binahub.id/api/auth/role`; status harus `401` dan tidak boleh `404`.
8. Tetapkan owner lalu jalankan skenario satu per satu. Gunakan data uji yang dapat dibersihkan dan jangan memasukkan secret pada bukti.
9. Simpan bukti menggunakan URL HTTPS yang hanya dapat diakses pihak berwenang.
10. Pertahankan seluruh workflow n8n inactive selama pengujian.

## Exit Criteria

- Migration, RLS, RPC, readiness SQL, lint, typecheck, unit test, dan production build lulus.
- Endpoint anonymous/non-admin ditolak.
- Dua belas skenario wajib tersedia dan mempunyai event `created`.
- Setiap perubahan UAT menghasilkan audit event.
- Seluruh skenario wajib berstatus `passed` dengan owner dan bukti.
- Dashboard hanya menampilkan `eligible_for_human_review`; tidak ada aksi go-live.
- Keputusan pilot, rollback plan, jadwal observasi, dan otorisasi live tetap dilakukan manusia pada fase aktivasi berikutnya.

Pengujian manusia boleh diselesaikan setelah semua fase pembangunan siap, tetapi pilot dan komunikasi live tetap terblokir sampai exit criteria ini dipenuhi.
