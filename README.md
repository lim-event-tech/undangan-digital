# UndanganDigital

Aplikasi undangan pernikahan digital. Setiap tamu mendapat link pribadi, dan pasangan memantau semuanya dari satu dashboard.

Status: Sprint 1 berjalan di localhost. Sudah ada login Google (R0) dan daftar tamu (R4: tambah manual, impor CSV, cari dan saring). Hosting belum disiapkan.

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
copy .env.example .env.local
```

Di macOS atau Linux pakai `cp .env.example .env.local`.

3. Isi `BETTER_AUTH_SECRET` di `.env.local` dengan teks acak.

```
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

4. Buat kredensial Google, lalu isi `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` di `.env.local`.

   - Buka Google Cloud Console, pilih atau buat project.
   - Menu APIs & Services, OAuth consent screen: pilih External, isi nama aplikasi, lalu tambahkan email Anda sebagai test user.
   - Menu APIs & Services, Credentials, Create credentials, OAuth client ID, jenis Web application.
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

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

Kata sandi dan port PostgreSQL bisa diganti lewat variabel `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, dan `DB_PORT`. Jika diganti, sesuaikan `DATABASE_URL` di `.env.local`.

## Format CSV untuk impor tamu

Baris pertama berisi judul kolom. Kolom wajib: `nama` dan `whatsapp`. Kolom opsional: `grup`, `acara`, `maks_dewasa`, `maks_anak`. Contoh bisa diunduh dari halaman impor.

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
| `src/lib` | Logika inti: nomor telepon, slug, impor CSV, layanan tamu dan undangan, autentikasi |
| `src/templates` | Daftar template undangan |
| `drizzle` | Berkas migrasi SQL |

## Aturan kode

Tidak ada komentar di kode (TypeScript, CSS, YAML, dan konfigurasi lain). Penjelasan ada di nama yang jelas, tes, dan dokumen ini.
