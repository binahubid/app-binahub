# Fase 16 — Production Finishing & Human Acceptance

Fase 16 menutup seluruh pekerjaan yang sengaja tidak menghalangi pembangunan safety layer Fase 15.

## Status implementasi routing dan UI — 2026-09-02

Selesai pada aplikasi:

- Menetapkan satu beranda administrator di `/admin/dashboard`; `/admin` sekarang hanya redirect kompatibilitas.
- Memecah workspace tab lama menjadi URL kanonis untuk dashboard, acquisition, pipeline, assessment, meeting, kontak, inquiry, klien, operasional, dan otomasi.
- Menyatukan seluruh halaman administrator ke `AdminShell` dan satu sumber konfigurasi navigasi.
- Mengganti sidebar desktop dengan kelompok accordion yang dapat dicari dan digulir.
- Mengganti navigasi mobile menjadi drawer aksesibel dengan focus trap, Escape, body scroll lock, dan focus return.
- Menambahkan breadcrumb, state loading, error, dan not-found yang konsisten.
- Merombak editor Pre-test/Post-test menjadi builder terstruktur dengan preview peserta, pengurutan, duplikasi, validasi, analitik, dan ekspor respons.
- Menghapus Launch Control, UAT/Pilot Gate, Pilot Operations, Operational Assurance, dan Pilot Certification dari kontrak navigasi produk. Artefaknya tetap tersedia untuk kebutuhan developer/backend.
- Menjadikan `/home` resolver role tanpa menampilkan hub tambahan; admin, klien, fasilitator, dan peserta langsung menuju beranda role.
- Mengarahkan rute klien dan fasilitator lama ke URL kanonis serta menyatukan shell T-BOS tanpa mengubah desain internal modulnya.
- Menguji desktop dan mobile tanpa horizontal overflow serta menguji keyboard, focus indicator, drawer, Escape, dan focus return.

Peta rute dan aturan pengembangan selanjutnya dicatat di `ADMIN-INFORMATION-ARCHITECTURE.md`.

## Acceptance fitur Fase 14

- CRUD katalog: draft tidak publik, item ready/public tampil tepat satu kali, archive menghilangkan item dari publik.
- Validasi owner dan backup tidak boleh akun yang sama.
- Delegasi dan SLA nonaktif tidak memengaruhi workflow.
- Questionnaire tanpa soal tidak dapat dipublikasikan.
- Pre-test/Post-test dapat diisi oleh peserta program yang sah dan statistik admin akurat.
- Questionnaire yang sudah memiliki respons tidak dapat diganti massal atau dihapus.
- QR program dapat dipindai, mengarah ke program yang benar, dan hasil unduhan memiliki nama/kode program.
- Panel bantuan ikon `i` tidak menutupi konten pada desktop maupun mobile.

## UI/UX production finishing

- [x] Audit dan satukan shell seluruh halaman dashboard admin, termasuk T-BOS, pada desktop dan mobile.
- [x] Pastikan navigasi operasional tidak menampilkan instruksi developer, status fase, atau prosedur pengujian internal.
- [x] Tutup masalah hierarchy global, overflow, focus, keyboard navigation, loading, error, not-found, dan responsive shell.
- [x] Kurasi editor Pre-test/Post-test dan gunakan renderer yang sama untuk preview admin serta halaman peserta.
- [ ] Jalankan acceptance isi, empty state, confirmation, dan destructive action dengan data production pada setiap modul bisnis.
- Selesaikan penyempurnaan visual assessment publik, laporan PDF, katalog publik, dan halaman program berdasarkan hasil penggunaan nyata.

Catatan: redesign visual internal T-BOS tetap berada di luar cakupan; yang disatukan adalah routing, sidebar, header, dan perilaku responsif global.

## Keputusan manusia yang belum boleh diasumsikan

- Review dan approval 18 template follow-up.
- Review wording finance/legal untuk proposal dan invoice.
- Nilai final minimum transaksi, owner/backup, approver/delegasi, dan SLA risiko pada control plane.
- Business owner, cohort pilot, success criteria, rollback trigger, serta change window.

## Pilot finishing

- Buat release non-mock setelah owner bisnis menyetujui scope dan cohort.
- Jalankan rehearsal production dry-run delapan langkah dengan evidence.
- Ikat snapshot monitoring real dan selesaikan incident blocker.
- Catat acceptance manusia dan keputusan go/no-go.
- Uji kill switch sebelum membuka master pilot switch.
- Aktivasi pertama hanya untuk satu workflow berisiko terendah dengan ceiling minimum, lalu rekonsiliasi satu run sebelum ekspansi.

Fase 16 selesai hanya setelah acceptance fitur, acceptance manusia, dan controlled pilot evidence lulus. Pekerjaan yang menunggu CEO tetap dicatat sebagai pending dan tidak akan disetujui atas nama CEO.
