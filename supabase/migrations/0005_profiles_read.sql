-- =============================================================
-- KasJemaat — Migrasi 0005: Longgarkan BACA profil untuk jejak audit
--
-- Alasan: halaman /audit dan jejak "Diverifikasi oleh ..." harus menampilkan
-- NAMA pelaku. Sebelumnya hanya sekretaris yang boleh membaca profil orang lain,
-- sehingga gembala/bendahara melihat nama kosong.
--
-- Yang berubah: gembala/sekretaris/bendahara boleh MEMBACA semua profil
-- (nama & peran). Petugas tetap hanya melihat barisnya sendiri.
-- Yang TIDAK berubah: menulis/mengelola profil tetap hanya sekretaris
-- (policy profiles_insert/profiles_update tidak disentuh).
-- =============================================================

drop policy if exists profiles_select on public.profiles;

create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.current_user_role() in ('sekretaris', 'bendahara', 'gembala')
  );
