# Video tutorial Portal Konsultan

Konsultan membuka **Materi → Video tutorial → Lihat video**, lalu memilih episode dari seri **Fitur portal** atau **Alur kerja**. Tersedia 21 video fitur dan 8 video alur kerja. Video diputar di halaman; tombol **Buka di Drive** menjadi cadangan jika browser tidak dapat memuat pemutar sematan.

## Akses dan pemeliharaan

- Daftar video hanya dikirim setelah API memverifikasi sesi konsultan aktif atau admin. Sesi ditolak dan gangguan layanan tidak mengembalikan tautan video. Respons memakai `private, no-store`.
- File video tetap mengikuti izin berbagi Google Drive. Folder yang diberikan pemilik dapat dibuka melalui tautan tanpa login; pembatasan portal tidak mengubah izin Drive.
- Judul, deskripsi, durasi, serta ID file ada di `src/app/konsultan/materials/tutorial/catalog/episodes.json`. Perbarui data ini jika file diganti, dan pertahankan `resourceKey` jika tautan baru memerlukannya.
- Thumbnail disimpan di `public/consultant/tutorials/`. MP4 tidak disalin ke repositori aplikasi. SRT belum diunggah sebagai caption Drive.
- CSP hanya mengizinkan frame Drive pada halaman video. Pintu masuk dari Materi memakai navigasi dokumen agar header tersebut diterapkan.
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

Pengujian menjalankan API tiruan lokal di port 4389. Pemeriksaan mencakup penolakan akses, kegagalan layanan, 29 tautan, pemisahan CSP, navigasi dari Materi, pencarian, perpindahan episode, dan lebar layar 1440/1024/390/320 piksel. Pemutar provider ditiru agar pemeriksaan UI konsisten; pemutaran Drive nyata diperiksa terpisah melalui browser.

Validasi rilis: build Next.js 16.4.5, 574 tes aplikasi, 7 pemeriksaan dependensi/kontrak, lint berkas yang berubah, dan audit npm tanpa kerentanan. Pemutaran F01 dalam iframe Drive nyata berhasil diuji.
