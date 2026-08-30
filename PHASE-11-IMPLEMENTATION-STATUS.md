# Fase 11 — Operational Assurance

Tanggal implementasi: 30 Agustus 2026

## Outcome

Fase 11 menambahkan lapisan assurance di antara controlled pilot dan aktivasi eksternal. Empat workflow bisnis dinilai dengan aturan deterministik berdasarkan execution evidence. Finding dapat dicatat menjadi incident, diberi owner, ditangani, dan ditutup dengan audit trail. Keputusan go/no-go selalu dilakukan manusia dan dikunci ke snapshot monitoring tertentu.

## Komponen

- Migration API `0036_phase11_operational_assurance.sql`.
- API/app `0.15.0`.
- Automation bundle `0.2.0` dengan workflow kelima yang tetap inactive.
- Tab admin `Operational Assurance`.
- Endpoint admin `/api/admin/operational-assurance`.
- Watchdog `/api/automation/pilot-monitoring` dengan `PILOT_MONITOR_SECRET`.
- Smoke gate `npm run test:phase11`.

## Gate yang Diterapkan

1. Keempat policy monitoring harus aktif, non-mock, dan memiliki owner.
2. Snapshot untuk keputusan harus terikat release, non-mock, dan berusia kurang dari 24 jam.
3. `go` membutuhkan status healthy tanpa blocker dan tanpa incident high/critical terbuka.
4. `conditional_go` membutuhkan kondisi tertulis dan ditolak jika snapshot critical/insufficient atau ada critical incident.
5. Seluruh Human UAT wajib tetap lulus.
6. Release tidak dapat dijadwalkan tanpa review operasional.
7. Runtime `pilot` membutuhkan go/conditional go; `live` membutuhkan go penuh.

## Batas Aman

- Policy awal sengaja berstatus mock.
- `PILOT_MONITOR_DRY_RUN=true` menyimpan snapshot tetapi tidak membuat incident otomatis.
- Dashboard dan watchdog tidak mengaktifkan n8n, tidak mengubah environment, dan tidak mengirim komunikasi keluar.
- Workflow `05-pilot-monitoring-watchdog.json` tetap `active: false`.
- Perubahan environment dan aktivasi workflow tetap menjadi deployment terpisah setelah semua gate manusia selesai.

## Exit Criteria Deployment

- Migration `0036` berhasil.
- `operational_assurance_phase11_ready = true`.
- `operational_assurance_definition_issues = 0`.
- `incident_open_critical_issues = 0` sebelum go/no-go.
- API dan app `0.15.0` berhasil dideploy.
- Smoke Phase 11 lulus terhadap `https://api.binahub.id`.
- Workflow kelima berhasil diimpor, credential disambungkan, dan tetap inactive.

Human UAT dan activation decision belum otomatis dianggap selesai hanya karena engineering gate ini lulus.
