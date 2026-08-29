# Fase 3 — Status Implementasi Client, Delivery, dan Retain

Tanggal: 29 Agustus 2026  
Versi working copy: `0.9.0`

## Ringkasan

Implementasi kode utama Fase 3 kini tersedia pada working copy. Opportunity `won` dapat diubah menjadi client account, stakeholder utama, dan initial delivery project melalui satu transaksi idempotent. Dashboard menyediakan operasi stakeholder, delivery stage, milestone, risiko, account health, serta retention opportunity yang tetap melewati human gate.

Fase 3 belum aktif di production sampai migration `0028_client_delivery_and_retention.sql`, readiness check, deployment API `0.9.0`, dan deployment app `0.9.0` selesai. UAT bisnis tetap ditunda sesuai keputusan saat ini, tetapi typecheck, lint, dan build harus lulus sebelum handoff deployment.

## Yang Sudah Dibangun

### Deal menjadi client

- Hanya lead dengan opportunity stage `won` yang dapat diproses.
- Commercial owner, delivery owner, nama initial project, dan perusahaan wajib tersedia.
- Organisasi digunakan ulang berdasarkan nama yang dinormalisasi.
- Satu organisasi hanya mempunyai satu client account.
- Retry untuk lead yang sama menggunakan kembali client account dan initial project.
- Kontak lead menjadi stakeholder utama dan lifecycle lead menjadi `client`.
- Outreach tetap dijeda setelah konversi.

### Client account dan stakeholder

- Status account: onboarding, active, at risk, inactive, dan churned.
- Owner komersial dan delivery dipisahkan.
- Tanggal review, renewal, health, retain status, churn reason, dan catatan tersimpan.
- Stakeholder dapat diklasifikasikan sebagai sponsor, decision maker, champion, PIC, buyer, user, blocker, atau lainnya.
- Hanya satu stakeholder aktif yang dapat menjadi primary contact pada satu account.
- Perubahan PIC/HRD tidak menimpa histori activity client.

### Delivery governance

- Existing table `projects` diperluas dan tetap menjadi sumber data project agar tidak terbentuk sistem delivery kedua.
- Delivery stage: handoff, kickoff, planning, in progress, at risk, on hold, completed, dan cancelled.
- Delivery owner, target kickoff, delivery goal, success metrics, risk level, dan risk summary tersedia.
- Milestone mempunyai owner, due date, progress, weight, status, blocker reason, serta completion actor/time.
- Project berisiko tinggi/critical wajib memiliki risk summary; milestone blocked wajib memiliki blocker reason.

### Account health

- Review memakai empat dimensi 1–5: delivery, engagement, sentiment, dan commercial.
- Overall score dihitung deterministik oleh database, bukan ditebak AI.
- Health level: healthy, watch, at risk, dan critical.
- Account at risk/critical wajib memiliki next action dan tenggat.
- Review bersifat append-only dan snapshot terbaru disimpan pada client account.

### Retain dan repeat

- Opportunity type: renewal, upsell, cross-sell, repeat, dan referral.
- Retention tetap menjadi record baru yang tertaut ke account/project lama sehingga histori deal tidak berubah.
- Tahap proposal dan won membutuhkan human approval serta catatan approval minimal lima karakter.
- Nilai, target close, owner, module context, next action, due date, dan lost reason tersimpan.

### Audit dan akses

- Semua tabel baru mengaktifkan RLS dan tidak dapat diakses oleh role `anon` atau `authenticated` secara langsung.
- Mutasi hanya melalui route admin dan RPC `security definer` yang dibatasi ke `service_role`.
- `client_activities` menjadi append-only audit trail untuk handoff, account, stakeholder, delivery, milestone, health, dan retention.
- `production_readiness.sql` menambahkan hasil `client_delivery_phase3_ready`.

## Belum Dikerjakan atau Membutuhkan Keputusan Eksternal

| Kebutuhan | Status | Catatan |
|---|---|---|
| Kontrak dan e-sign | Belum dipilih | Tentukan vendor, approver, template kontrak, dan legal owner |
| Invoice dan payment | Belum dipilih | Tentukan accounting/payment system; AI tidak boleh menentukan status pembayaran |
| Kickoff checklist resmi | Masih generik | Ganti milestone mock/operasional dengan checklist per jenis modul |
| QBR cadence | Belum final | Tentukan apakah bulanan, kuartalan, atau berbasis durasi program |
| Renewal reminder 90/60/30 | Belum dijadwalkan | Dapat dibuat pada n8n setelah renewal policy disetujui |
| NPS/CSAT | Belum ada instrumen final | Tentukan pertanyaan, channel, timing, dan owner tindak lanjut |
| Health score weighting | Bobot sama | Empat dimensi saat ini berbobot sama; ubah setelah policy resmi tersedia |
| Retention catalog | Menggunakan konteks bebas | Hubungkan ke catalog module riil setelah katalog disetujui |
| UAT end-to-end | Ditunda | Uji setelah seluruh fase siap sesuai keputusan proyek |

## Deployment Fase 3

1. Backup database Supabase.
2. Jalankan `production_readiness.sql` sebelum migration dan simpan hasilnya.
3. Terapkan file lengkap `binahub-api/supabase/migrations/0028_client_delivery_and_retention.sql` melalui SQL Editor.
4. Jalankan ulang readiness dan pastikan `client_delivery_phase3_ready = true`.
5. Deploy `binahub-api 0.9.0`.
6. Deploy `app-binahub 0.9.0`.
7. Pertahankan follow-up dan transformation worker dalam dry-run sampai UAT disetujui.

Migration tidak membuat client dari seluruh lead won secara otomatis. Handoff sengaja dilakukan dari dashboard agar owner, project awal, dan human accountability tersedia.

## UAT yang Ditunda

- Handoff lead won berhasil dan retry tidak menggandakan data.
- Lead non-won ditolak.
- Stakeholder utama tunggal tetap terjaga saat PIC berganti.
- Delivery project at risk tanpa risk summary ditolak.
- Milestone blocked tanpa alasan ditolak.
- Health at risk/critical tanpa next action dan tenggat ditolak.
- Retention proposal/won tanpa human approval ditolak.
- Semua aksi muncul pada client activity trail.
- Client lama dapat menghasilkan repeat opportunity tanpa mengubah deal awal.
