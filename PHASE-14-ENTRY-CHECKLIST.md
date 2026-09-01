# Fase 14 — Entry Checklist Controlled Pilot Activation

Tanggal disiapkan: 31 Agustus 2026  
Status: **preparation only; activation locked**

## Batas Fase

Persiapan Fase 14 boleh berjalan sebelum Fase 13 selesai. Eksekusi Fase 14 baru dimulai setelah seluruh exit criteria Fase 13 lulus dan acceptance manusia mencatat keputusan `go`.

Selama preparation only, jangan:

- mengaktifkan workflow n8n;
- mengubah `requested_mode` atau environment worker menjadi `pilot`/`live`;
- mematikan dry-run;
- menyetujui Business Rules, template, release, atau acceptance atas nama owner bisnis;
- mengirim email, proposal, atau outreach ke kontak nyata.

## Pekerjaan yang Boleh Diselesaikan Sekarang

- arsipkan output readiness, smoke, dan runner Fase 13;
- siapkan daftar operator dan jalur eskalasi;
- tetapkan kandidat change window tanpa mengeksekusinya;
- verifikasi prosedur backup, rollback, kill switch, dan recovery;
- siapkan cohort pilot terisolasi dan batas maksimum peserta, tanpa memasukkan kontak nyata sebelum approval;
- siapkan dashboard monitoring, query audit, dan format laporan insiden;
- catat environment variables yang akan berubah, tanpa mengubah nilainya;
- lakukan review deployment app/API/website dan dependency inventory.

## Entry Gate yang Belum Lulus

Status pada 1 September 2026 pukul 09.47 WIB:

- UAT wajib: **12 passed, 0 in progress, 0 not started**;
- handoff `won → client`, lifecycle risiko/retention, dan traceability end-to-end sudah lulus setelah migration `0038` dan deployment API `0.16.2`;
- suppression scheduler, failed-run retry, idempotensi, dan automation dry-run sudah lulus tanpa outbound;
- snapshot monitoring `458b252a-57ee-4ce0-9fbe-027860c05aed` healthy, tetapi masih mock dan belum terikat release;
- template outreach `v1.0-review`: 18/18 non-mock draft dengan owner `admin@binahub.id`, tetapi approved masih 0/18 menunggu CEO;
- monitoring policy real dengan owner: **4/4 selesai**; runtime control juga ber-owner dan tetap `dry_run` tanpa release;
- Business Rules real: masih memiliki sembilan activation blocker;
- pilot release plan non-mock: belum ada;
- production rehearsal 8 langkah: belum ada;
- acceptance certification dan keputusan go/no-go: belum ada.

## Draft Change Window

Change window belum disetujui. Kandidat window harus berada pada jam kerja ketika owner teknis dan bisnis tersedia. Sebelum window dimulai, operator harus memastikan:

1. production readiness dan snapshot monitoring masih fresh;
2. tidak ada incident blocking;
3. release, cohort, limit per run, owner, success criteria, dan rollback trigger cocok dengan acceptance;
4. seluruh runtime tetap `dry_run` sampai langkah aktivasi yang disetujui;
5. kill switch dapat dipanggil oleh operator yang ditunjuk;
6. rollback mengembalikan runtime ke `dry_run`/`disabled` sebelum tindakan lain.

## Urutan Aktivasi yang Direncanakan

Urutan ini hanya draft dan belum boleh dijalankan:

1. freeze perubahan di API, app, website, database, dan workflow;
2. ambil snapshot readiness dan monitoring final;
3. catat persetujuan change window dan operator aktif;
4. aktifkan satu workflow paling rendah risiko untuk cohort pilot;
5. pantau satu run dan audit record sebelum membuka workflow berikutnya;
6. berhenti serta jalankan kill switch pada rollback trigger pertama;
7. tutup window dengan reconciliation, incident review, dan keputusan lanjut/rollback.

## Rollback Minimum

- ubah effective runtime kembali ke `dry_run` atau `disabled`;
- nonaktifkan workflow n8n yang baru diaktifkan;
- hentikan outbound dan tandai run aktif sebagai perlu rekonsiliasi;
- simpan execution log, automation run, event queue, dan incident evidence;
- jangan menghapus record evidence atau fixture UAT;
- lakukan rekonsiliasi idempotensi sebelum retry.

## Keputusan Masuk Fase 14

Kolom ini hanya boleh diselesaikan manusia setelah Fase 13 lulus:

- Business owner: belum ditetapkan
- Technical owner: belum ditetapkan
- Monitoring owner: belum ditetapkan
- Approved change window: belum ditetapkan
- Acceptance ID: belum tersedia
- Go/no-go ID: belum tersedia
- Keputusan: **NO-GO / activation locked**
