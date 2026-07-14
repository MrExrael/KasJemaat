-- =============================================================
-- KasJemaat — Migrasi 0003: Storage bucket "bukti" (privat) + policy
-- Path objek: {department_id}/{transaction_id}/{filename}
-- foldername(name)[1] = department_id → dipakai untuk otorisasi per-dept
-- (mirror RLS transaksi). Tidak ada akses publik; baca via signed URL.
-- =============================================================

-- Bucket privat (public = false).
insert into storage.buckets (id, name, public)
values ('bukti', 'bukti', false)
on conflict (id) do nothing;

-- UPLOAD: staff bebas dept; petugas hanya folder dept-nya. (Gembala bukan staff
-- & tanpa dept → tak bisa upload, sejalan dengan "Gembala tidak input".)
create policy "bukti_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'bukti'
    and (
      public.is_staff()
      or (storage.foldername(name))[1] = public.current_department()::text
    )
  );

-- READ (untuk generate signed URL di server): gembala/sekretaris/bendahara semua,
-- petugas hanya folder dept-nya (mirror transactions_select).
create policy "bukti_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'bukti'
    and (
      public.current_user_role() in ('gembala', 'sekretaris', 'bendahara')
      or (storage.foldername(name))[1] = public.current_department()::text
    )
  );

-- UPDATE (ganti/upsert bukti): staff bebas dept; petugas folder dept-nya.
create policy "bukti_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'bukti'
    and (
      public.is_staff()
      or (storage.foldername(name))[1] = public.current_department()::text
    )
  )
  with check (
    bucket_id = 'bukti'
    and (
      public.is_staff()
      or (storage.foldername(name))[1] = public.current_department()::text
    )
  );

-- DELETE (hapus bukti): staff bebas dept; petugas folder dept-nya.
create policy "bukti_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'bukti'
    and (
      public.is_staff()
      or (storage.foldername(name))[1] = public.current_department()::text
    )
  );
