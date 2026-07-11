-- =============================================================
-- KasJemaat — Migrasi 0002: Row Level Security & Policy
-- Policy peran memakai helper SECURITY DEFINER dari 0001
-- (current_user_role / current_department / is_staff) agar TIDAK rekursi.
-- Policy pada tabel profiles hanya memakai auth.uid() langsung atau
-- helper definer — tidak pernah subquery biasa ke profiles.
-- =============================================================

-- ---------- Grant dasar untuk role authenticated ----------
-- RLS diterapkan DI ATAS grant ini (grant = izin perintah, RLS = filter baris).
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- ---------- Aktifkan RLS ----------
alter table public.profiles       enable row level security;
alter table public.departments    enable row level security;
alter table public.cash_types     enable row level security;
alter table public.transactions   enable row level security;
alter table public.weekly_reports enable row level security;
alter table public.audit_log      enable row level security;

-- ===================== profiles =====================
-- Semua user melihat baris sendiri; sekretaris melihat & mengelola semua.
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.current_user_role() = 'sekretaris');

create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (public.current_user_role() = 'sekretaris');

create policy profiles_update on public.profiles
  for update to authenticated
  using (public.current_user_role() = 'sekretaris')
  with check (public.current_user_role() = 'sekretaris');

-- ===================== departments =====================
-- Semua authenticated boleh baca; hanya sekretaris/bendahara boleh tulis.
create policy departments_select on public.departments
  for select to authenticated
  using (true);

create policy departments_write on public.departments
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ===================== cash_types =====================
create policy cash_types_select on public.cash_types
  for select to authenticated
  using (true);

create policy cash_types_write on public.cash_types
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ===================== transactions =====================
-- SELECT: gembala/sekretaris/bendahara semua; petugas hanya dept-nya.
create policy transactions_select on public.transactions
  for select to authenticated
  using (
    public.current_user_role() in ('gembala', 'sekretaris', 'bendahara')
    or department_id = public.current_department()
  );

-- INSERT: created_by wajib = auth.uid(); petugas hanya dept-nya,
-- staff bebas dept. Gembala otomatis tertolak (bukan staff & tanpa dept).
create policy transactions_insert on public.transactions
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and (public.is_staff() or department_id = public.current_department())
  );

-- UPDATE: hanya baris yang BELUM approved (baris approved terkunci untuk semua).
-- Petugas hanya boleh ubah miliknya sendiri yang masih draft & di dept-nya,
-- dan tak bisa menaikkan status (with check tetap 'draft').
-- Staff boleh verifikasi/approve baris non-approved.
create policy transactions_update on public.transactions
  for update to authenticated
  using (
    status <> 'approved'
    and (
      public.is_staff()
      or (
        created_by = auth.uid()
        and department_id = public.current_department()
        and status = 'draft'
      )
    )
  )
  with check (
    public.is_staff()
    or (
      created_by = auth.uid()
      and department_id = public.current_department()
      and status = 'draft'
    )
  );

-- DELETE: hanya sekretaris/bendahara & baris belum approved.
create policy transactions_delete on public.transactions
  for delete to authenticated
  using (public.is_staff() and status <> 'approved');

-- ===================== weekly_reports =====================
-- Semua authenticated boleh baca; hanya bendahara yang tulis.
create policy weekly_reports_select on public.weekly_reports
  for select to authenticated
  using (true);

create policy weekly_reports_write on public.weekly_reports
  for all to authenticated
  using (public.current_user_role() = 'bendahara')
  with check (public.current_user_role() = 'bendahara');

-- ===================== audit_log =====================
-- INSERT dari server (sisi user) hanya boleh mencatat atas nama dirinya.
-- SELECT: gembala/sekretaris/bendahara. Tanpa policy UPDATE/DELETE (log immutable).
create policy audit_log_insert on public.audit_log
  for insert to authenticated
  with check (user_id = auth.uid());

create policy audit_log_select on public.audit_log
  for select to authenticated
  using (public.current_user_role() in ('gembala', 'sekretaris', 'bendahara'));
