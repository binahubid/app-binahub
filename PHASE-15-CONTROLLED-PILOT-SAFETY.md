# Fase 15 — Controlled Pilot Safety Layer

## Keputusan ruang lingkup

Fase 15 menguatkan jalur aktivasi pilot tanpa menjalankan pilot. Seluruh acceptance UI/UX dan konfigurasi bisnis yang belum selesai dipindahkan secara eksplisit ke `PHASE-16-FINISHING-BACKLOG.md`.

Fase ini tidak membuat sistem release baru. Release plan, monitoring policy, incident, rehearsal, acceptance, go/no-go, runtime control, dan kill switch yang dibangun pada Fase 10–12 tetap menjadi source of truth.

## Perubahan rilis

Rilis runtime: `binahub-api` v0.18.0. Tidak ada migration database, perubahan `app-binahub`, perubahan `website-prod`, ataupun perubahan workflow n8n.

Empat lapisan berikut sekarang harus lulus bersamaan sebelum mode pilot/live efektif:

1. Dry-run environment milik worker harus dibuka secara sengaja.
2. Master circuit breaker server-side harus dibuka secara sengaja.
3. Runtime control database harus meminta `pilot` atau `live` dan terikat release yang sah.
4. Release harus non-mock, berstatus `scheduled`, memiliki change window valid, dan invocation terjadi di dalam window tersebut.

Jika salah satu lapisan gagal, effective mode otomatis menjadi `dry_run`. Requested mode database tidak dapat melewati circuit breaker server.

## Environment baru

```text
AUTOMATION_PILOT_ENABLED=false
AUTOMATION_LIVE_ENABLED=false
```

Keduanya harus tetap `false` pada deployment Fase 15. Nilai yang tidak tersedia juga diperlakukan sebagai `false`.

Ketika pilot kelak disetujui, hanya `AUTOMATION_PILOT_ENABLED` yang boleh dibuka pada change window. `AUTOMATION_LIVE_ENABLED` tetap `false`. Mode live membutuhkan kedua switch dan tidak termasuk eksekusi Fase 15.

## Deployment dan verifikasi

1. Deploy `binahub-api` v0.18.0.
2. Pastikan seluruh `*_DRY_RUN=true` tetap dipertahankan.
3. Pastikan kedua master circuit breaker bernilai `false`.
4. Jalankan smoke gate read-only:

   ```powershell
   Set-Location "C:\Users\USER\OneDrive\Documents\Dokumen Binahub\binahub-api"
   $adminSecret = Read-Host "Masukkan password admin" -AsSecureString
   $env:PHASE15_ADMIN_PASSWORD = [System.Net.NetworkCredential]::new("", $adminSecret).Password
   $env:PHASE15_ADMIN_EMAIL = "admin@binahub.id"
   $env:PHASE15_API_URL = "https://api.binahub.id"
   $env:PHASE15_CONFIRM_PRODUCTION_READINESS = "true"
   npm run test:phase15
   Remove-Item Env:PHASE15_ADMIN_PASSWORD, Env:PHASE15_ADMIN_EMAIL, Env:PHASE15_API_URL, Env:PHASE15_CONFIRM_PRODUCTION_READINESS
   $adminSecret = $null
   ```

Smoke gate hanya membaca control plane menggunakan sesi admin sementara dan memeriksa endpoint tanpa secret. Runner tidak mengubah release, runtime, environment, n8n, data bisnis, atau outbound.

## Exit criteria Fase 15

- API v0.18.0 berhasil dibangun dan dideploy.
- Unit test membuktikan master switch, scheduled release, dan batas waktu fail-closed.
- Production smoke membuktikan empat runtime efektif `dry_run`/`disabled`.
- Kedua master switch production masih tertutup.
- n8n tetap inactive dan tidak ada outbound.

Kelulusan Fase 15 berarti safety layer siap. Kelulusan ini bukan keputusan `go`, bukan acceptance bisnis, dan bukan izin mengaktifkan pilot.
