# Fase 13 — Human UAT & Production Dry-Run Rehearsal

Tanggal mulai: 30 Agustus 2026  
Status: **berjalan, activation locked**

## Outcome

Fase 13 mengubah engineering evidence Fase 1–12 menjadi bukti operasional manusia. Fase ini tidak menambahkan fitur produk, tidak mengaktifkan workflow n8n, dan tidak membuka outbound. Exit hanya dapat dicapai setelah 12 skenario UAT memiliki evidence riil, policy monitoring dan release memiliki owner, empat workflow memiliki run evidence yang cukup, delapan langkah rehearsal lulus, lalu acceptance manusia dicatat.

## Baseline Production

- Migration production tersedia sampai `0037`.
- API dan app `0.16.0` sudah dideploy; website tetap `0.2.20`.
- Smoke Phase 12 lulus 11/11.
- Seluruh tabel yang dilaporkan memiliki RLS aktif, anonymous blocked, dan authenticated direct-write blocked.
- Lima workflow n8n lokal tersedia tepat satu kali dan semuanya inactive.
- Keempat runtime control production berada pada `requested_mode=dry_run`.
- Tidak ada critical/high incident terbuka.
- Tidak ada release, rehearsal, atau acceptance production.

Output readiness yang disalin pada awal Fase 13 hanya memuat result set RLS. Sebelum final acceptance, simpan juga result set yang membuktikan `pilot_certification_phase12_ready=true` dan seluruh counter `*_issues=0`.

## Evidence Pertama — 30 Agustus 2026

| Pemeriksaan | Hasil |
|---|---|
| Follow-up Scheduler | HTTP 202, deferred di luar window kerja, `sent=[]`; belum dihitung sebagai run evidence |
| Transformation Event Worker | HTTP 200, `dryRun=true`, 0 processed, healthy |
| Client Operations | HTTP 200, `dryRun=true`; pemanggilan kedua duplicate dan memakai run yang sama |
| Acquisition Processor | HTTP 200, `dryRun=true`; pemanggilan kedua duplicate dan memakai run yang sama |
| Pilot Monitoring | `dryRun=true`, `activationLocked=true`, `outboundTriggered=false` |
| Snapshot | `insufficient_data`; hanya Follow-up Scheduler yang masih menjadi blocker minimum evidence |

Snapshot awal: `21cd22e8-9a12-4f86-8d99-8aef1cdde0eb`. Validasi evidence kit kemudian menghasilkan snapshot `14016ae1-1b92-4efa-9e34-c5d2ef1bc138`. Keduanya `is_mock=true` dan belum terikat release, sehingga bukan snapshot final untuk acceptance.

## Kondisi Awal yang Belum Boleh Ditandai Lulus

- Seluruh 12 skenario UAT masih `not_started`, environment `staging`, tanpa owner dan evidence.
- Empat monitoring policy masih `is_mock=true` dan belum memiliki owner.
- Delapan belas outreach template tersedia, tetapi belum ada yang `approved` dan non-mock.
- Business Rules `v1.0-approved-partial` masih draft dan memiliki sembilan activation blocker.
- Belum ada pilot release plan non-mock.
- Belum ada production rehearsal atau acceptance certification.

## Urutan Eksekusi Wajib

### Gate 13.0 — Tutup bukti deployment

1. Jalankan `production_readiness.sql` dan simpan seluruh result set.
2. Pastikan `pilot_certification_phase12_ready=true`.
3. Pastikan counter berikut bernilai `0`:
   - `pilot_rehearsal_snapshot_issues`
   - `pilot_rehearsal_definition_issues`
   - `pilot_rehearsal_step_evidence_issues`
   - `pilot_acceptance_evidence_issues`
   - `pilot_acceptance_binding_issues`

Counter total rehearsal/acceptance boleh `0` sebelum evidence dibuat.

### Gate 13.1 — Assign owner dan jalankan 12 Human UAT

Instruksi UAT adalah artefak developer dan tidak ditampilkan sebagai menu produk. Tester menjalankan skenario production berdasarkan arahan per langkah dari engineering, lalu melaporkan hasil ringkas melalui kanal kerja. Engineering mencatat hasil tersebut ke backend evidence tanpa meminta tester mengisi dashboard teknis.

Jangan memasukkan hasil asumsi. Status `passed` wajib tetap memiliki owner, actual result, evidence note, tester, waktu uji, dan jika tersedia URL evidence HTTPS. Karena seluruh pengujian saat ini dilakukan oleh satu tester, owner boleh menggunakan identitas tester yang sama pada seluruh skenario; peran pada tabel berikut menunjukkan pihak yang kelak bertanggung jawab setelah tim bertambah.

| Urutan | Skenario | Owner peran yang disarankan |
|---|---|---|
| 1 | Batas akses dashboard dan API admin | Engineering/Ops |
| 2 | Assessment publik, PDF, dan email hasil | Product/Marketing |
| 3 | Siklus booking konsultasi Cal.com | Sales Ops |
| 4 | Proposal standar dan human gate custom | Commercial/Approver |
| 5 | Pengiriman email dan webhook Resend | IT/Marketing |
| 6 | Suppression, unsubscribe, dan stop conditions | IT/Marketing |
| 7 | Handoff deal menjadi client dan delivery | Commercial/Delivery |
| 8 | Risiko delivery menjadi human task | Delivery/Ops |
| 9 | Retain dan repeat opportunity | Account Owner |
| 10 | Mobile dan aksesibilitas alur inti | Product/QA |
| 11 | Dry-run, retry, dan idempotensi automation | Engineering/Ops |
| 12 | Traceability proses end-to-end | Engineering/Ops + Process Owner |

Jika keputusan bisnis atau vendor belum tersedia, gunakan status `blocked` beserta alasan konkret. Jangan memakai `passed` untuk sekadar melewati gate.

### Gate 13.2 — Lengkapi keputusan bisnis

Sebelum release dapat di-approve:

1. Selesaikan sembilan activation blocker Business Rules.
2. Aktifkan rule set non-mock hanya setelah owner/approver/Finance/Legal menyetujui.
3. Approve 18 template ID/EN sebagai non-mock dengan owner yang jelas.
4. Tetapkan lawful basis, sumber data, retention, privacy notice, dan deletion process untuk outbound/acquisition.

Bagian ini membutuhkan keputusan manusia dan tidak boleh diisi otomatis oleh engineering.

### Gate 13.3 — Automation evidence

Jalankan evidence script dari repository API:

```powershell
Set-Location "C:\Users\USER\OneDrive\Documents\Dokumen Binahub\binahub-api"
$env:PHASE13_API_URL="https://api.binahub.id"
$env:PHASE13_CONFIRM_DRY_RUN="true"
node .\scripts\phase13-evidence.mjs
Remove-Item Env:PHASE13_API_URL
Remove-Item Env:PHASE13_CONFIRM_DRY_RUN
```

Script melakukan preflight terhadap runtime control database dan berhenti sebelum memanggil worker jika salah satu workflow bukan `dry_run`. Secret dimuat server-side dari `.env.local` dan tidak dicetak.

Follow-up harus diulang pada Senin–Jumat di dalam window 08.00–17.00 WIB. Request deferred membuktikan guard waktu bekerja, tetapi tidak memenuhi minimum satu run dalam 24 jam.

Sesudah sign-in ke n8n melalui UI, jalankan workflow secara manual dari editor untuk memperoleh execution log n8n. Jangan mengubah toggle workflow menjadi active.

### Gate 13.4 — Monitoring policy dan release

1. Ubah empat monitoring policy menjadi non-mock, tetap enabled, dengan owner riil.
2. Buat pilot release plan non-mock lengkap dengan business, technical, dan monitoring owner.
3. Isi cohort kecil, maximum participants, success criteria, rollback trigger, dan rollback plan.
4. Release baru boleh di-approve setelah UAT, template, dan Business Rules lulus.
5. Tautkan runtime control ke release tetapi pertahankan requested/effective mode `dry_run`.
6. Jalankan watchdog ulang sehingga snapshot fresh terikat release yang sama dan `is_mock=false`.

### Gate 13.5 — Delapan langkah rehearsal

Di tab **Pilot Certification**, jalankan:

1. Environment guard.
2. Follow-up Scheduler dry-run.
3. Transformation Event Worker dry-run.
4. Client Operations dry-run.
5. Acquisition Processor dry-run.
6. Retry dan idempotensi.
7. Incident drill dan kill switch.
8. Recovery dan rekonsiliasi.

Setiap step wajib memiliki owner, hasil aktual, dan evidence. Rehearsal hanya boleh memakai snapshot fresh, non-mock, dan terikat release yang sama.

### Gate 13.6 — Acceptance dan go/no-go

1. Pastikan 12/12 UAT passed dan tidak ada critical incident terbuka.
2. Rekam acceptance manusia:
   - `accepted_with_conditions` hanya untuk pilot terbatas;
   - `accepted` diperlukan sebelum live.
3. Buat keputusan go/no-go terhadap snapshot yang sama.
4. Walaupun hasilnya go, lima workflow tetap inactive sampai change window Phase 14 disetujui terpisah.

## Exit Criteria Fase 13

- Readiness struktural Phase 12 terarsip lengkap.
- 12/12 UAT wajib passed dengan evidence production.
- 18 template approved non-mock dan Business Rules aktif tanpa blocker outbound.
- Empat policy monitoring enabled, non-mock, dan memiliki owner.
- Empat workflow healthy pada snapshot fresh yang terikat release.
- Delapan rehearsal step passed.
- Tidak ada critical incident terbuka.
- Acceptance dan keputusan go/no-go tercatat.
- n8n masih inactive dan seluruh outbound tetap terkunci sampai Phase 14.
