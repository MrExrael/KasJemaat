Dibuat Full Oleh Claude Ai

**KasJemaat** — aplikasi web keuangan & kas gereja (RBAC) berbasis [Next.js](https://nextjs.org) + Supabase.

## Environment

Salin `.env.example` menjadi `.env.local`, lalu isi dari Supabase Dashboard → Project Settings → API:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # kunci "anon public" (bukan service_role)
```

## Database (Supabase)

Migrasi SQL bernomor ada di `supabase/migrations/`. Terapkan **berurutan**:

1. `0001_init.sql` — enum, tabel, index, trigger (updated_at, total mingguan, `handle_new_user`), dan helper RLS (SECURITY DEFINER).
2. `0002_rls.sql` — aktifkan RLS + policy per peran.
3. `0003_storage_bukti.sql` — bucket privat `bukti` + storage policy (upload/baca/ubah/hapus bukti per peran & departemen). Bukti dibaca lewat **signed URL** yang digenerate server; tidak ada akses publik.
4. `0004_transaction_status.sql` — fungsi transisi status transaksi (`verify_transaction`, `approve_transaction`, `revert_transaction`) yang sekaligus mencatat ke `audit_log`.
5. `0005_profiles_read.sql` — gembala/sekretaris/bendahara boleh **membaca** semua profil (agar nama pelaku tampil di Log Audit & jejak verifikasi). Menulis profil tetap hanya sekretaris.
6. `supabase/seed.sql` — 8 departemen + 4 jenis kas (idempotent).

**Cara menerapkan** (pilih salah satu):

- **Manual (SQL Editor):** buka Supabase Dashboard → SQL Editor, tempel isi tiap berkas sesuai urutan di atas lalu jalankan.
- **Supabase CLI (jika terpasang & proyek ter-link):**

  ```bash
  npx supabase link --project-ref <PROJECT_REF>
  npx supabase db push        # menerapkan berkas di supabase/migrations
  # seed dijalankan otomatis oleh `supabase db reset` pada dev lokal
  ```

> Catatan: helper peran dinamai `current_user_role()` (bukan `current_role()`) karena `CURRENT_ROLE` adalah kata kunci Postgres yang direservasi.

## Membuat pengguna

Aplikasi ini **tidak** memakai `service_role` key, jadi pembuatan akun dilakukan
dari Supabase Dashboard. Pengaturan peran/departemen/status dilakukan di halaman
**/pengguna** (khusus Sekretaris).

### 1. Admin pertama (bootstrap)

Supabase Dashboard → **Authentication → Users → Add user**:

- Isi email & password
- Centang **Auto Confirm User** (kalau tidak, login akan ditolak)
- **User Metadata**:
  ```json
  { "full_name": "Nama Anda", "role": "sekretaris" }
  ```

Trigger `handle_new_user` otomatis membuat baris di `profiles` dengan peran itu.

### 2. Pengguna berikutnya

Cukup **Add user** + Auto Confirm (tanpa perlu metadata `role`). Akun baru muncul
di **/pengguna** sebagai **Petugas**, lalu Sekretaris mengatur peran &
departemennya dari sana.

> Petugas **wajib** punya departemen — tanpa itu RLS membuat mereka tidak melihat
> data apa pun. Form /pengguna sudah memvalidasi ini.

### ⚠️ Wajib: matikan pendaftaran publik

`handle_new_user` mengambil peran dari `raw_user_meta_data.role`, dan metadata itu
**dikendalikan pemanggil saat sign-up**. Jika pendaftaran publik dibiarkan aktif,
siapa pun yang tahu URL + anon key bisa mendaftar sebagai `sekretaris`.

Matikan di **Authentication → Sign In / Providers → Email → Enable Sign Ups (off)**
sehingga akun hanya bisa dibuat lewat Dashboard.

### Menonaktifkan pengguna

Set **Nonaktif** di /pengguna. Akses langsung diblokir pada permintaan berikutnya
(`getCurrentProfile()` memaksa logout saat `is_active = false`).

### Regenerasi tipe TypeScript

Setelah skema berubah, perbarui `src/types/database.ts`:

```bash
npx supabase gen types typescript --project-id <PROJECT_REF> --schema public > src/types/database.ts
# atau, jika proyek sudah ter-link:
npx supabase gen types typescript --linked --schema public > src/types/database.ts
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
