# Pencatatan Ekstrakurikuler — SMKN 10 Semarang

Aplikasi web mobile-first untuk mencatat keanggotaan, jadwal, presensi, dan statistik
ekstrakurikuler. Dibangun dengan Next.js App Router, TypeScript, Tailwind CSS, Supabase
(PostgreSQL), dan siap dideploy ke Vercel.

## Peran pengguna

| Peran | Login | Hak akses |
| --- | --- | --- |
| **Admin** | Username + password | Kelola PIC, ekstrakurikuler, jurusan, semester, kenaikan kelas, branding, export, dan statistik semua kegiatan. |
| **PIC** | NIS + password | Kelola anggota, jadwal/libur, presensi bulan berjalan, riwayat, statistik, dan export untuk ekstrakurikuler yang ditugaskan. |

Tidak ada akun siswa dan tidak ada pendaftaran publik. Akun admin pertama dibuat lewat seed
script. Tidak ada fitur lupa password mandiri; admin dapat melihat dan mereset password PIC.

## Fitur utama

- Presensi per pertemuan; hanya bulan berjalan yang dapat diubah, bulan lampau read-only.
- Riwayat perubahan presensi (status lama → status baru, oleh siapa, kapan).
- Jadwal hari latihan dengan riwayat berlaku-mulai; hari libur dilewati otomatis.
- Statistik: kartu ringkasan, pie chart komposisi, bar chart bulanan, rekap per siswa, dan
  deteksi tidak masuk beruntun (Hadir dianggap masuk; Izin/Sakit/Tidak Hadir dianggap tidak masuk).
- Kenaikan kelas manual: X → XI, XI → XII, XII → LULUS, dengan penandaan siswa tinggal kelas.
- Siswa LULUS dihapus permanen oleh Vercel Cron setelah 1 bulan.
- Export Excel satu sheet per semester, kolom lengkap, pie/bar chart sebagai gambar.
- PWA: manifest, service worker, ikon 192/512/maskable, popup instal maksimal 1×/hari,
  dukungan `beforeinstallprompt` Android dan instruksi iOS.
- Mode gelap/terang, logo sekolah, logo pembuat yang dapat diklik, halaman offline dengan tombol coba lagi.

## Struktur folder

```text
.
├── public/
│   ├── icons/                  # ikon PWA 192, 512, maskable, apple-touch
│   ├── sw.js                   # service worker (cache aset statis saja)
│   └── manifest.webmanifest    # dihasilkan oleh src/app/manifest.ts
├── scripts/
│   └── seed.ts                 # admin pertama + contoh jurusan
├── supabase/
│   └── migrations/
│       └── 20261114000000_init.sql
├── src/
│   ├── actions/                # server actions (auth, admin, PIC)
│   ├── app/
│   │   ├── admin/              # dashboard & halaman admin
│   │   ├── api/
│   │   │   ├── cron/cleanup/   # hapus siswa LULUS > 1 bulan
│   │   │   └── export/         # unduhan Excel per ekstrakurikuler / semua
│   │   ├── pic/                # halaman PIC
│   │   ├── login/  offline/  manifest.ts  layout.tsx
│   ├── components/             # UI bersama, navigasi, chart, form
│   ├── lib/
│   │   ├── auth/               # session JWT, guard, hash & enkripsi password
│   │   ├── queries/            # query Supabase (server-only)
│   │   ├── export.ts           # pembuat workbook Excel + grafik PNG
│   │   └── validation.ts       # skema Zod
│   └── types/
├── .env.example
├── next.config.ts
├── vercel.json                 # jadwal cron harian
└── package.json
```

## Prasyarat

- Node.js 20+
- Project Supabase (PostgreSQL + Storage)
- Akun Vercel (untuk deploy)

## 1. Instalasi lokal

```bash
npm install
cp .env.example .env.local
```

Isi `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SESSION_SECRET=...          # openssl rand -base64 48
PASSWORD_ENCRYPTION_KEY=... # openssl rand -base64 48
CRON_SECRET=...             # openssl rand -base64 48
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=PasswordKuat123!
```

> `SUPABASE_SERVICE_ROLE_KEY` hanya boleh ada di server. Jangan pernah memakai prefix
> `NEXT_PUBLIC_`, jangan commit `.env.local`, dan jangan membagikannya ke browser.

## 2. Migrasi database & storage

Buka Supabase Dashboard → **SQL Editor**, lalu jalankan seluruh isi:

```text
supabase/migrations/20261114000000_init.sql
supabase/migrations/20261115000000_semester_dates.sql
```

Jika database sudah dibuat sebelum fitur tanggal semester ditambahkan, cukup jalankan
migration `20261115000000_semester_dates.sql` (aman dijalankan berulang).

Migration membuat:

- seluruh tabel, index, trigger `updated_at`;
- unique partial index agar hanya ada satu semester aktif;
- RLS di semua tabel + `revoke` untuk `anon`/`authenticated` (tidak ada policy anon);
- bucket Storage `branding` dengan public read (tulis hanya via service role);
- nilai awal `app_settings`.

Jika memakai Supabase CLI:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

## 3. Seed admin pertama

```bash
npm run seed
```

Seed akan:

1. membuat admin dari `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` (bcrypt);
2. menambahkan contoh jurusan **tanpa menimpa** data yang sudah ada.

Opsi:

- `SEED_UPDATE_PASSWORD=1` → reset password admin yang sudah ada.
- `SEED_SAMPLE_JURUSAN=0` → lewati contoh jurusan.

## 4. Jalankan aplikasi

```bash
npm run dev
```

Buka `http://localhost:3000`. Login admin memakai username/password seed. Buat semester pertama
dari **Admin → Kelola Semester → Buat Semester Berikutnya**, lalu tambah jurusan, ekstrakurikuler,
PIC, dan penugasan PIC.

Perintah lain:

```bash
npm run typecheck   # cek TypeScript
npm run lint        # cek ESLint
npm run build       # build produksi
npm run start       # jalankan hasil build
```

## 5. Deploy ke Vercel

1. Push repository ke GitHub/GitLab, lalu **Import Project** di Vercel.
2. Framework preset: **Next.js**. Build command `npm run build`.
3. Tambahkan environment variables berikut di **Project Settings → Environment Variables**
   (Production dan Preview sesuai kebutuhan):

   ```text
   NEXT_PUBLIC_SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
   SESSION_SECRET
   PASSWORD_ENCRYPTION_KEY
   CRON_SECRET
   ```

   Jangan menambahkan `SEED_ADMIN_*` di Vercel. Jalankan seed dari lokal yang mengarah ke
   database produksi, atau isi sementara lalu hapus setelah selesai.

4. Deploy. `vercel.json` sudah mendaftarkan cron:

   ```json
   { "crons": [{ "path": "/api/cron/cleanup", "schedule": "0 17 * * *" }] }
   ```

   Jadwal `0 17 * * *` = 00:00 WIB. Vercel Cron otomatis mengirim header
   `Authorization: Bearer <CRON_SECRET>` bila `CRON_SECRET` diatur. Endpoint juga menerima
   `POST` dan menolak permintaan tanpa secret yang benar.

5. Setelah deploy, login admin → unggah logo sekolah dan logo pembuat di **Logo & Branding**.

### Catatan produksi

- Gunakan koneksi database/Supabase yang sama untuk seed dan aplikasi.
- Jangan mengubah `SESSION_SECRET` sembarangan setelah ada sesi aktif (semua pengguna akan logout).
- Jangan mengganti `PASSWORD_ENCRYPTION_KEY` setelah ada PIC; password terenkripsi lama tidak
  dapat didekripsi dan harus direset admin.
- `sharp` dan `exceljs` berjalan di Node.js runtime pada route export (bukan Edge).
- PWA memerlukan HTTPS (Vercel sudah menyediakannya). Service worker hanya didaftarkan pada
  production agar development (termasuk akses lewat IP jaringan) tidak terganggu cache lama.
- Jika perangkat pernah membuka development lewat IP jaringan dan masih menampilkan error
  hydration, lakukan **Clear site data** sekali di browser (atau unggah ulang halaman setelah
  service worker v2 aktif). Build produksi berikutnya sudah memakai aset baru.

## Alur operasional

### Semester

- Urutan manual: Semester 1 → Semester 2 → tahun ajaran berikutnya.
- Setiap semester punya **tanggal mulai** dan **tanggal selesai** yang dapat diatur saat membuat
  semester maupun lewat tombol kalender pada daftar semester. Tanggal bawaan mengikuti kalender
  sekolah (Semester 1: 1 Juli–31 Desember, Semester 2: 1 Januari–30 Juni).
- Hanya satu semester aktif (dijaga unique partial index).
- Membuat semester berikutnya menyalin keanggotaan **aktif** dari semester aktif sebelumnya,
  lalu semester baru langsung diaktifkan.
- Semester terakhir tidak boleh dihapus. Penghapusan memakai konfirmasi ganda dan menghapus
  anggota/pertemuan/presensi pada semester tersebut.
- Jika semester aktif dihapus, semester terbaru yang tersisa otomatis diaktifkan.

### Kenaikan kelas

- Admin menentukan tanggal. Tombol konfirmasi hanya muncul pada/setelah tanggal tersebut.
- Semua siswa aktif X/XI/XII ditampilkan dengan checkbox tercentang. **Hilangkan centang** untuk
  siswa yang tinggal kelas.
- XII yang dicentang menjadi `LULUS` + `lulus_at`; XII yang tidak dicentang tetap XII.
- Setiap perubahan dicatat di `kenaikan_log`. Menjalankan ulang untuk tanggal yang sama dicegah
  oleh `app_settings.kenaikan_selesai`.
- Cron harian menghapus siswa `LULUS` yang `lulus_at`-nya lebih lama dari 1 bulan; cascade
  menghapus keanggotaan dan presensinya.

### Presensi

- Pertemuan bulan berjalan dibuat otomatis dari jadwal yang berlaku, kecuali tanggal libur.
- Default semua anggota aktif berstatus **Hadir**; ubah yang tidak hadir lalu simpan.
- Perubahan dicatat di `presensi_log` beserta nama PIC.
- Bulan lampau read-only dan dapat dilihat lewat **Riwayat Presensi**.

### Export Excel

- Per ekstrakurikuler: `/api/export/extra/[id]` (admin atau PIC yang ditugaskan).
- Semua ekstrakurikuler: `/api/export/all` (admin saja).
- Nama file: `Ekstrakurikuler_[NamaEkskul]_[TahunAjaran]_Sem[X].xlsx`.
- Satu sheet per semester; kolom: Nama Lengkap, NIS, Kelas, Rombel, Jurusan, Hadir,
  Tidak Hadir, Izin, Sakit, Persentase Kehadiran; pie chart komposisi dan bar chart bulanan
  disertakan sebagai gambar PNG.

## Keamanan

- Session memakai JWT HS256 di cookie **httpOnly**, `sameSite=lax`, `secure` di produksi.
- Password admin di-hash bcrypt; password PIC dienkripsi AES-256-GCM dengan key turunan SHA-256.
- Password PIC hanya ditampilkan pada halaman detail PIC yang dilindungi admin.
- Semua form divalidasi dengan Zod di server; login dibatasi rate limit in-memory per IP/identitas.
- RLS aktif di semua tabel dan tidak ada akses anon; aplikasi mengakses database lewat service
  role hanya di server.
- Route API export memeriksa sesi, status akun, dan kepemilikan ekstrakurikuler untuk PIC.
- Tidak ada data presensi atau halaman terautentikasi yang disimpan di cache service worker.

## Lisensi & kredit

Dibuat untuk SMK Negeri 10 Semarang. Logo pembuat dan tautan dapat diatur admin melalui halaman
**Logo & Branding**.
