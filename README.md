# UndanganDigital

Aplikasi undangan event digital. Setiap tamu mendapat link pribadi, dan pengguna mengelola beberapa undangan beserta RSVP masing-masing.

Sprint 1 event umum terdiri dari dua batch: fondasi judul event beserta penghapusan profil/foto mempelai, lalu konsep visual dan isi keempat template. Melati memakai botani editorial, Keraton bingkai geometris, Malam Berbintang orbit bintang, dan Pasundan pola alam. Data contoh serta delapan gambar pratinjau HP/desktop mengikuti tampilan baru.

Sprint 2 menghubungkan beberapa undangan dalam satu akun. Halaman `/undangan` memuat daftar milik pengguna; editor dan menu pengelolaan berada di `/undangan/{id}/...`. Pembuatan tambahan langsung membuka editor ID yang baru. Semua aksi, unggahan, impor/ekspor, pratinjau, WhatsApp, dan check-in memakai ID eksplisit yang diperiksa di server. Dua tab dapat mengelola undangan berbeda. Pengaturan akun tetap di `/undangan/akun`; tautan pengelolaan lama diarahkan ke daftar. Sprint 2 tidak memerlukan migrasi database baru.

Sprint 3 dibagi dua batch. Batch 1 selesai: halaman awal menjadi portal tindakan mengikuti susunan WordCLD: kartu Buat undangan dan Kelola undangan, akses admin terpisah, serta petunjuk singkat. Masuk dan Daftar tetap tersedia dengan kebijakan akun yang sama. Halaman awal tidak memerlukan kueri katalog template. Batch 2 berisi uji alur lengkap dari portal sampai RSVP/check-in dan dokumentasi akhir.

Migrasi `0012_event_umum` menambahkan judul event, menghapus kolom dan profil mempelai serta foto jenis pria/wanita, lalu mengganti placeholder pesan lama menjadi `{event}`. Draf development yang sudah ada mendapat judul `Event` diikuti delapan karakter ID dan dapat disunting melalui editor. Terapkan migrasi dengan `npm run db:migrate` sebelum menjalankan kode baru pada database yang sudah ada.

Sudah ada daftar dan masuk dengan Google atau email dan kata sandi (tanpa verifikasi email dan tanpa lupa kata sandi karena belum ada layanan email), daftar tamu dengan impor CSV/Excel, editor konten dengan simpan otomatis dan unggah foto, beberapa acara dalam satu undangan, empat template event umum dengan RSVP per acara, pratinjau link WhatsApp, kirim undangan lewat WhatsApp, serta ringkasan RSVP. Sprint 1, Sprint 2, dan Sprint 3 batch 1 diverifikasi secara lokal; database operasional dan deployment belum diubah oleh Codex.

## Kebutuhan

- Node.js 22 atau lebih baru
- Docker Desktop, untuk menjalankan PostgreSQL
- Akun Google, untuk membuat kredensial login

## Menjalankan di localhost

1. Pasang dependensi.

```
npm install
```

2. Salin berkas env.

```
copy .env.example .env
```

Di macOS atau Linux pakai `cp .env.example .env`.

3. Isi `BETTER_AUTH_SECRET` di `.env` dengan teks acak.

```
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

4. Buat kredensial Google, lalu isi `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` di `.env`.

   - Buka Google Cloud Console, pilih atau buat project.
   - Menu APIs & Services, OAuth consent screen: pilih External, isi nama aplikasi, lalu tambahkan email Anda sebagai test user.
   - Menu APIs & Services, Credentials, Create credentials, OAuth client ID, jenis Web application.
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`

   Callback publik Google memakai `/api/auth/google/callback`, sama seperti WordCLD. Permintaan diteruskan ke handler Better Auth agar validasi state, PKCE, dan sesi tetap berjalan. Di produksi, daftarkan `https://domain-anda/api/auth/google/callback` pada OAuth Client yang sesuai dengan `GOOGLE_CLIENT_ID` server; entri Google Cloud yang sudah ada bisa dipakai bila domain, path, dan Client ID memang sama.

5. Nyalakan PostgreSQL di Docker, lalu terapkan skema.

```
npm run db:up
npm run db:migrate
```

6. Daftarkan template (tersembunyi sampai ditampilkan admin).

```
npm run db:templates
```

7. Jalankan aplikasi, lalu buka http://localhost:3000.

```
npm run dev
```

## Menjalankan aplikasi di Docker

Selain `npm run dev`, aplikasi bisa berjalan sebagai container `undangan-app` di samping `undangan-db`. Isi `.env` dulu (langkah 2 sampai 4 di atas), terapkan migrasi dengan `npm run db:migrate`, lalu:

```
npm run app:up
```

Container membaca `.env` yang sama dan memakai database di container `undangan-db`. Setelah `.env` diubah, buat ulang containernya, bukan sekadar restart.

```
docker compose up -d --force-recreate app
```

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm run start` | Menjalankan hasil build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Pemeriksaan tipe TypeScript |
| `npm test` | Seluruh tes (basis data tes memakai PGlite, Docker tidak diperlukan) |
| `npm run db:up` | Menyalakan container PostgreSQL dan menunggu sampai sehat |
| `npm run db:down` | Mematikan container, data tetap tersimpan di volume |
| `npm run db:reset` | Menghapus seluruh data lalu membuat ulang skema |
| `npm run db:generate` | Membuat migrasi baru dari perubahan `src/db/schema.ts` |
| `npm run db:migrate` | Menerapkan migrasi |
| `npm run db:studio` | Drizzle Studio untuk melihat isi tabel |
| `npm run db:templates` | Mendaftarkan template dari `src/templates/registry.ts`, tambahkan `-- --tampilkan` untuk langsung menampilkannya |
| `npm run app:up` | Membangun image lalu menyalakan container aplikasi di http://localhost:3000, butuh `.env` terisi |
| `npm run app:logs` | Mengikuti log container aplikasi |

Kata sandi dan port PostgreSQL bisa diganti lewat variabel `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, dan `DB_PORT`. Jika diganti, sesuaikan `DATABASE_URL` di `.env`.

## Pengaturan akun pengguna

Menu **Pengaturan akun** di `/undangan/akun` tersedia sebelum maupun sesudah membuat undangan. Pengguna dapat mengubah email dengan kata sandi saat ini, mengganti kata sandi, dan menautkan Google dengan email yang sama. Akun yang hanya memakai Google dapat membuat kata sandi dari sesi masuk yang berusia kurang dari 24 jam sebelum mengubah email. Perubahan email dan kata sandi mengakhiri sesi di perangkat lain.

Tidak ada email verifikasi yang dikirim; email baru disimpan sebagai belum diverifikasi. Penautan Google dimulai dari akun yang sudah masuk melalui API `linkSocial` Better Auth; penautan otomatis ke akun lokal yang belum diverifikasi tetap ditolak. Pengaturan ini tidak dapat diakses admin saat mengelola undangan pengguna.

## Format file Excel atau CSV untuk impor tamu

File boleh .xlsx (lembar pertama) atau .csv. Baris pertama berisi judul kolom. Kolom wajib: `nama` dan `whatsapp`. Kolom opsional: `grup`, `acara`, `maks_dewasa`, `maks_anak`. Contoh Excel dan CSV bisa diunduh dari halaman impor. Semua unduhan data (RSVP, ucapan, daftar undangan, log audit) tersedia sebagai Excel dan CSV.

- Nomor WhatsApp boleh `0812...`, `+62812...`, atau `62812...`, semuanya disimpan sebagai `+62812...`. Hanya nomor seluler Indonesia yang diterima.
- `acara` diisi nama atau kunci acara, dipisah `;` `,` `/` atau `|`. Kosong berarti semua acara.
- `maks_dewasa` dan `maks_anak` yang kosong memakai bawaan undangan.
- Pemisah kolom koma, titik koma, atau tab terdeteksi otomatis, jadi file CSV dari Excel Indonesia terbaca.
- Maksimal 1000 baris dan 1 MB per file.
- Baris bermasalah (nomor tidak valid, acara tidak dikenal, nomor kembar) tidak pernah masuk tanpa persetujuan. Perbaiki langsung di pratinjau, atau centang opsi untuk melewatinya.

## Struktur

| Folder | Isi |
| --- | --- |
| `src/app` | Halaman dan server action |
| `src/components` | Komponen bersama dan kerangka dashboard |
| `src/db` | Skema Drizzle dan koneksi |
| `src/lib` | Logika inti: nomor telepon, slug, impor CSV, layanan tamu, undangan, acara, dan foto, validasi link Maps, autentikasi |
| `src/templates` | Daftar template undangan |
| `drizzle` | Berkas migrasi SQL |

## Aturan kode

Tidak ada komentar di kode (TypeScript, CSS, YAML, dan konfigurasi lain). Penjelasan ada di nama yang jelas, tes, dan dokumen ini.
