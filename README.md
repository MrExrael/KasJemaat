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
3. `supabase/seed.sql` — 8 departemen + 4 jenis kas (idempotent).

**Cara menerapkan** (pilih salah satu):

- **Manual (SQL Editor):** buka Supabase Dashboard → SQL Editor, tempel isi tiap berkas sesuai urutan di atas lalu jalankan.
- **Supabase CLI (jika terpasang & proyek ter-link):**

  ```bash
  npx supabase link --project-ref <PROJECT_REF>
  npx supabase db push        # menerapkan berkas di supabase/migrations
  # seed dijalankan otomatis oleh `supabase db reset` pada dev lokal
  ```

> Catatan: helper peran dinamai `current_user_role()` (bukan `current_role()`) karena `CURRENT_ROLE` adalah kata kunci Postgres yang direservasi.

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
