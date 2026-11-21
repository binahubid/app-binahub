# Video tutorial Portal Konsultan

Konsultan membuka **Materi → Video tutorial → Lihat video**, lalu memilih episode dari seri **Fitur portal** atau **Alur kerja**. Tersedia 21 video fitur dan 8 video alur kerja. Pemutar menampilkan gambar utuh dengan rasio 16:9 dan kontrol bawaan perangkat. Tombol **Buka di Drive** menjadi cadangan jika video belum dapat diputar di portal.

## Akses dan pemeliharaan

- Daftar video hanya dikirim setelah API memverifikasi sesi konsultan aktif atau admin. Sesi ditolak dan gangguan layanan tidak mengembalikan tautan video. Respons memakai `private, no-store`.
- File video tetap mengikuti izin berbagi Google Drive. Folder yang diberikan pemilik dapat dibuka melalui tautan tanpa login; pembatasan portal tidak mengubah izin Drive.
- Judul, deskripsi, durasi, dan ID file dikelola di `binahub-api/src/lib/consultant/tutorials.json`. Portal Konsultan dan admin AMS membaca daftar yang sama. Pertahankan `resourceKey` jika tautan baru memerlukannya.
- Thumbnail disimpan di `public/consultant/tutorials/`. MP4 tidak disalin ke repositori aplikasi. SRT belum diunggah sebagai caption Drive.
- Pemutar mengambil bagian video yang diperlukan dari endpoint media di domain portal. Endpoint memeriksa sesi dan hanya meneruskan file MP4 yang terdaftar.
- Tidak memerlukan SQL, secret, atau environment variable baru.

## Pengujian lokal tanpa data produksi

Di PowerShell pertama, gunakan konfigurasi sintetis berikut, lalu jalankan server lokal:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL='http://127.0.0.1:4389'
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY='synthetic-ui-only'
$env:NEXT_PUBLIC_BINAHUB_API_URL='http://127.0.0.1:4389'
$env:NEXT_PUBLIC_APP_URL='http://127.0.0.1:4390'
npm run dev -- --hostname 127.0.0.1 --port 4390
```

Di PowerShell kedua, dari repositori yang sama:

```powershell
npm run test:consultant-tutorials:ui
```

Pengujian menjalankan API tiruan lokal di port 4389. Pemeriksaan mencakup penolakan akses, kegagalan layanan, 29 episode, navigasi dari Materi, pencarian, pergantian episode, dan lebar layar 1440/1024/390/320 piksel. Pemutar diuji dengan MP4 sintetis. Pemutaran dan pencarian posisi di F01 juga diuji melalui endpoint media dengan file Drive asli.

Jalankan `npx vitest run src/lib/consultant-video-route.test.ts` untuk memeriksa pembatasan akses, respons byte range, dan penanganan kegagalan penyedia.
