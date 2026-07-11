-- =============================================================
-- Seed KasJemaat — idempotent (aman dijalankan berulang kali).
-- Jalankan setelah migrasi 0001 & 0002.
-- =============================================================

-- 8 departemen (contoh PRD). `code` singkat & unik.
insert into public.departments (name, code) values
  ('Komisi Anak / Sekolah Minggu', 'ANAK'),
  ('Remaja',                       'RMJ'),
  ('Pemuda',                       'PMD'),
  ('Kaum Wanita',                  'WANITA'),
  ('Kaum Bapak / Pria',            'PRIA'),
  ('Diakonia',                     'DIAKONIA'),
  ('Musik & Ibadah',              'MUSIK'),
  ('Pembangunan',                  'BANGUN')
on conflict (code) do nothing;

-- 4 jenis kas.
insert into public.cash_types (name) values
  ('Kas Operasional'),
  ('Kas Pembangunan'),
  ('Kas Diakonia'),
  ('Kas Misi')
on conflict (name) do nothing;
