# KasJemaat — Konteks Global (CLAUDE.md)

## Tentang Project
KasJemaat = aplikasi web keuangan & kas gereja dengan hak akses berbasis peran (RBAC).
Fokus: pencatatan harian per departemen, rekap kas mingguan, alur approval, pelaporan + ekspor PDF.

## Constraint mutlak
- Tanpa AI/ML. Semua logika deterministik (rule-based).
- Tanpa API berbayar untuk notifikasi. WhatsApp/Email pakai manual send (wa.me / draft mailto).
- Single-tenant (satu gereja) untuk v1.
- Semua nominal uang disimpan sebagai integer rupiah (hindari float).

## Tech Stack
- Frontend: Next.js 15 (App Router) + TypeScript strict + Tailwind + shadcn/ui + lucide-react.
- Backend/DB: Supabase (Postgres + Auth + Storage + Row Level Security).
- Validasi: Zod (client & server action). Grafik: recharts. PDF: @react-pdf/renderer.
- Tanggal: date-fns (minggu mulai Senin). Deploy: Vercel (env dev/prod terpisah).

## Keputusan atas pertanyaan terbuka PRD (default, boleh diubah)
1. Penginput harian: ada peran Petugas Departemen (input dept-nya sendiri). Sekretaris & Bendahara juga bisa input.
2. Super Admin (kelola user & role): dilekatkan ke Sekretaris.
3. Bendahara boleh edit/hapus transaksi harian DAN pegang kas mingguan.
4. 8 departemen pakai contoh PRD sebagai seed (bisa di-CRUD).
5. Jenis kas: Kas Operasional, Pembangunan, Diakonia, Misi (bisa di-CRUD).
6. Definisi minggu: Senin-Minggu (weekStartsOn 1), disimpan sebagai week_start_date (tanggal Senin).
7. Setelah status approved: transaksi terkunci (tidak bisa edit/hapus lewat UI, RLS menolak).

## Matriks hak akses (ringkas)
- Lihat dashboard & laporan: Gembala read semua, Sekretaris/Bendahara semua, Petugas dept-nya saja.
- Input transaksi harian: Sekretaris, Bendahara, Petugas (dept-nya). Gembala tidak.
- Edit harian (belum approved): Sekretaris, Bendahara, Petugas (miliknya, draft).
- Hapus harian (belum approved): hanya Sekretaris/Bendahara.
- Verifikasi/Approve: Sekretaris/Bendahara.
- Kas mingguan (CRUD): hanya Bendahara.
- CRUD departemen: Sekretaris/Bendahara (Gembala read).
- Kelola user & role: hanya Sekretaris.
- Ekspor PDF: semua (Petugas dept-nya). Kirim ringkasan WA/Email: Gembala/Sekretaris/Bendahara.
Penegakan dua lapis: UI (sembunyikan tombol tak berhak) DAN RLS Postgres (sumber kebenaran).

## Struktur folder
src/app/(auth)/login, src/app/(app)/{dashboard,pemasukan,pengeluaran,kas-mingguan,departemen,pengguna}
src/components/{ui,shared}, src/lib/{supabase,auth,validators,format.ts}, src/types/database.ts
supabase/migrations, supabase/seed.sql

## Konvensi kode
- TypeScript strict, hindari any. Mutasi via Server Actions: cek session, validasi Zod, andalkan RLS.
- Format rupiah lewat satu helper formatRupiah(). Tabel/kolom snake_case, komponen PascalCase.
- UI Bahasa Indonesia. Tombol destruktif wajib dialog konfirmasi.
- Migrasi SQL bernomor urut.

## Skema data (ringkas)
- profiles: id, full_name, email, role (gembala|sekretaris|bendahara|petugas), department_id, is_active.
- departments: id, name, code, pic_name, is_active.
- cash_types: id, name, is_active.
- transactions: id, date, department_id, cash_type_id, type (income|expense), amount (int), category,
  description, proof_url, status (draft|verified|approved), created_by, verified_by, verified_at, timestamps.
- weekly_reports: id, week_start_date, cash_type_id, persembahan_mimbar, kolekte_ibadah, perpuluhan,
  persembahan_syukur, lainnya (int), total (int, dihitung), notes, created_by, timestamps.
- audit_log: id, user_id, action, entity, entity_id, timestamp, meta.