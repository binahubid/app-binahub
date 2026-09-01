# Fase 13 — CEO Decision Pack

Tanggal disiapkan: 1 September 2026  
Status: **menunggu keputusan bisnis; automation tetap dry-run dan inactive**

## Ringkasan yang Sudah Selesai

- Human UAT production: **12/12 passed**.
- Monitoring policy: **4/4 enabled, non-mock**, owner `admin@binahub.id`.
- Runtime control: **4/4 dry-run**, technical owner `admin@binahub.id`, tanpa release binding.
- Template follow-up: **18/18 versi `v1.0-review`** tersedia sebagai non-mock draft, owner `admin@binahub.id`.
- Snapshot terakhir `458b252a-57ee-4ce0-9fbe-027860c05aed`: healthy, tanpa outbound, tetapi masih mock karena belum ada release.
- Incident high/critical terbuka: **0**.

## Batas Keputusan

Dokumen ini meminta keputusan, bukan memberi persetujuan atas nama CEO. Sampai seluruh keputusan selesai:

- Business Rules tetap `draft`;
- template tetap `draft` dan approved tetap `0/18`;
- release, rehearsal, acceptance, dan go/no-go belum dibuat;
- workflow n8n tetap inactive;
- outbound tetap terkunci.

## Sembilan Keputusan yang Dibutuhkan

### 1. Status resmi tujuh payung solusi

Status data sekarang:

| Produk | Status saat ini | Keputusan CEO |
|---|---|---|
| BinaInsight | ready | setujui / ubah: ____ |
| BinaLab | design | setujui / ubah: ____ |
| BinaCoach | design | setujui / ubah: ____ |
| BinaPlay | design | setujui / ubah: ____ |
| BinaAcademy | design | setujui / ubah: ____ |
| BinaWorks | design | setujui / ubah: ____ |
| BinaImpact | design | setujui / ubah: ____ |

Nilai status yang tersedia: `concept`, `design`, `development`, `ready`, atau `retired`.

### 2. Katalog modul komersial resmi

Saat ini hanya `BI-PUBLIC — BinaInsight Public Assessment` yang real dan ready. Tujuh modul lain masih placeholder mock dan tidak boleh masuk proposal atau automation.

Keputusan minimum untuk setiap modul resmi:

- produk/payung solusi;
- kode dan nama modul;
- deskripsi dan tujuan;
- scope standar dan batas scope;
- output/deliverable;
- status readiness;
- owner dan versi.

Keputusan: **daftar modul disetujui / perlu revisi / belum tersedia**  
Catatan: ____

### 3. Unit harga dan harga dasar modul

Untuk setiap modul komersial resmi, tetapkan:

- pricing unit;
- base price;
- minimum quantity;
- biaya terpisah/out-of-scope;
- status ready-to-sell.

Harga pada modul berlabel `MOCK` tidak boleh dianggap harga resmi.

Keputusan: ____

### 4. Transaksi di bawah Rp15.000.000

Minimum transaksi yang terkonfirmasi saat ini adalah Rp15.000.000, tetapi perlakuan transaksi di bawah nilai tersebut masih terbuka.

Pilih satu kebijakan:

- ditolak;
- diarahkan ke produk/modul khusus;
- boleh diproses hanya dengan persetujuan CEO/Commercial Director;
- kebijakan lain: ____

Keputusan final: ____

### 5. Owner individual dan backup

Technical, monitoring, dan template owner sudah menggunakan `admin@binahub.id`. Tetapkan owner manusia dan backup untuk:

| Fungsi | Owner | Backup |
|---|---|---|
| Sales Operations | ____ | ____ |
| Proposal/Commercial | ____ | ____ |
| Delivery | ____ | ____ |
| Deliverability/Email | ____ | ____ |
| Template/Content | admin@binahub.id | ____ |
| Product Catalog | ____ | ____ |

### 6. Approver individual

Peran approver yang disetujui adalah CEO dan Commercial Director. Isi identitas yang akan dicatat pada audit:

- CEO approver — nama/email: ____
- Commercial Director approver — nama/email: ____
- Jika salah satu tidak tersedia, kewenangan pengganti: ____

### 7. SLA legal/reputasi

SLA untuk review legal, reputasi, etik, dan conflict risk masih kosong.

- SLA review awal: ____ jam kerja / hari kerja
- SLA eskalasi ke backup: ____
- SLA keputusan akhir CEO: ____
- Kanal eskalasi: ____

### 8. Final approval 18 template follow-up

Versi `v1.0-review` sudah disiapkan dalam Bahasa Indonesia dan Inggris untuk:

- inquiry follow-up level 1–3;
- assessment result follow-up level 1–3;
- assessment proposal follow-up level 1–3.

Seluruh template:

- memakai satu CTA ke `https://cal.com/binahub/konsultasi`;
- tidak menyuruh penerima membalas alamat no-reply;
- memiliki footer unsubscribe otomatis pada saat pengiriman;
- belum dapat digunakan live sebelum approval.

Keputusan CEO:

- setujui seluruh 18 template;
- setujui dengan revisi berikut: ____;
- belum disetujui.

Approval actor/email: ____  
Approval note: ____

### 9. Wording Finance/Legal

Kondisi yang sudah dicatat:

- status PPN: `not_pkp`;
- harga tidak termasuk PPh 23 sebesar 2%;
- wording final membutuhkan konfirmasi Finance/Legal.

Wording final pada proposal/invoice: ____  
Disetujui oleh Finance/Legal: ____  
Tanggal keputusan: ____

## Identitas Business Owner

- Business owner nama/email: ____
- CEO/decision actor nama/email: ____
- Tanggal review: ____
- Keputusan keseluruhan: approved / approved with revisions / pending
- Catatan keputusan: ____

## Langkah Setelah CEO Memberi Keputusan

1. Engineering memasukkan keputusan ke Business Rules tanpa mengaktifkan outbound.
2. Template yang disetujui diubah dari `draft` menjadi `approved` dengan actor dan approval note CEO.
3. Business Rules diaktifkan hanya jika sembilan blocker sudah benar-benar selesai.
4. Release plan non-mock dibuat dengan business owner CEO, technical owner `admin@binahub.id`, dan monitoring owner `admin@binahub.id`.
5. Runtime tetap dry-run; watchdog menghasilkan snapshot fresh non-mock yang terikat release.
6. Delapan langkah rehearsal dijalankan sebelum acceptance dan go/no-go.

