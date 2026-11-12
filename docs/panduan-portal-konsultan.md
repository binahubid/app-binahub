# Panduan Portal Konsultan BinaHub

Portal tersedia di [app.binahub.id/konsultan](https://app.binahub.id/konsultan). Konsultan dapat membaca peluang, jadwal, tugas, checklist, proposal, dan riwayat seluruh tim. Konsultan yang ditugaskan dapat mengubah pekerjaannya. Admin mengelola penugasan dan dapat membantu pekerjaan mana pun.

## Menyiapkan tim

1. Buka **AMS → Tim Konsultan → Undang anggota**. Pilih associate aktif, tinjau perjanjian, dan lengkapi ketentuan kompensasi yang benar-benar disepakati.
2. Associate membuka undangan di AMS, membaca perjanjian, lalu memilih **Setujui & Bergabung**. Tombol **Portal Konsultan** kemudian membuka App tanpa password kedua. Keanggotaan berlaku selama aktif dan tidak mengikuti tanggal selesai proyek. Admin menjeda atau mengakhiri keanggotaan dari AMS; App menampilkan status sebagai informasi baca saja.
3. Buka **Penugasan**, cari peluang, lalu pilih **Kelola penugasan → Tetapkan konsultan**. Daftar hanya memuat akun yang aktif di AMS dan di Portal Konsultan dengan email login yang sama dan terverifikasi. Untuk booking Cal.com tanpa peluang, pilih peluang yang sesuai di **Booking yang belum terhubung**. Undang konsultan ke kalender meeting sesuai alur Cal.com BinaHub.
4. Di tab **Materi**, unggah [Company Profile](../output/pdf/company-profile-binahub.pdf) dan [Product Knowledge](../output/pdf/product-knowledge-binahub.pdf). Di portal, pilih **Baca di web** untuk membacanya tanpa unduhan atau **Unduh PDF** untuk menyimpan salinannya. Keduanya membuka dokumen yang sama dari penyimpanan privat.

## Menangani konsultasi

1. Buka **Klien & peluang**. Gunakan filter **Tanggung jawab saya** untuk mencari penugasan sendiri atau **Semua** untuk melihat pekerjaan tim.
2. Di detail peluang, lihat jadwal dan buka **Kebutuhan & meeting**. Jika tersedia, hubungkan pengisian rekomendasi dari klien. Lengkapi checklist, catat klarifikasi, dan pilih **Tandai selesai**.
3. Buka **Proposal**, pilih program dan periksa durasi, jumlah peserta, format, lokasi, dan ruang lingkup. Buat draf, lalu unduh dan tinjau PDF. Estimasi memakai tarif harian katalog dikalikan jumlah hari. Tarif yang belum tersedia atau perlu pembahasan tampil sebagai tanda pisah.
4. Di **Tindak lanjut**, pilih **Pengiriman proposal**, pilih revisi PDF, tulis pesan, lalu tinjau tujuan dan lampiran. Kosongkan jadwal untuk antrean berikutnya atau pilih waktu perangkat yang sesuai. Email memakai nama konsultan yang ditugaskan dan balasan diarahkan ke email kerjanya.
5. Periksa **Riwayat pengiriman**. Status **Diterima penyedia email** berarti layanan email sudah menerima pengiriman. Jika status perlu diperiksa, cocokkan dengan riwayat penyedia sebelum mengantrekan ulang. Catat balasan klien agar tindak lanjut terjadwal yang belum diproses dapat dibatalkan.
6. Setelah klien menyepakati proposal, buka **Ringkasan → Serah terima ke admin** dan catat kesepakatannya. Admin membuka catatan di **Tim Konsultan → Serah terima** dan meneruskan proses dari **Klien & Pelaksanaan**.

## Rilis dan pengujian

Pembaruan keanggotaan: setelah SQL90/92, terapkan SQL93 (0093_consultant_ams_membership.sql) di database API BinaHub dan migration 014 (014_consultant_team.sql) di database AMS. Kedua file tidak mengirim undangan atau mengasumsikan persetujuan akun lama. Akun yang sebelumnya diberi akses manual perlu menerima agreement AMS. Tidak ada env baru. Rilis API kedua sistem sebelum UI baru. Tombol **AMS** pada header admin membuka tab baru agar isian pekerjaan tetap tersedia.

Terapkan `0090_consultant_portal.sql`, lalu `0092_consultant_ams_assignment.sql` pada database API BinaHub. Pemeriksaan akun memakai integrasi AMS yang sama dengan penugasan program. Pastikan endpoint pemeriksaan akun AMS sudah dirilis sebelum menguji penugasan baru. Worker antrean menggunakan Supabase Cron yang sudah memanggil `/api/assessment/worker`. Konfigurasi pengirim bisnis, kunci Resend, dan tautan berhenti berlangganan memakai pengaturan email yang ada. Jika Supabase mengarahkan undangan ke halaman selain aplikasi, tambahkan `https://app.binahub.id/auth/consultant-invite` di daftar Redirect URLs proyek Auth.

Untuk uji lokal, jalankan app dev dengan URL Supabase dan API `http://127.0.0.1:4389`, URL aplikasi `http://127.0.0.1:4390`, dan anon key sintetis. Jalankan `node scripts/test-consultant-portal-ui.mjs`. Skrip memasang server tiruan di port 4389 dan memeriksa akses, proposal, tugas, serta antrean pada empat ukuran layar. Uji SQL dan pengiriman tiruan ada di `binahub-api/src/lib/consultant`.
