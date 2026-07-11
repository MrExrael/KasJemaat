-- =============================================================
-- KasJemaat — Migrasi 0001: Skema awal, trigger, & helper RLS
-- Semua nominal disimpan sebagai integer rupiah (bigint).
-- =============================================================

-- ---------- Enums ----------
create type user_role as enum ('gembala', 'sekretaris', 'bendahara', 'petugas');
create type tx_type   as enum ('income', 'expense');
create type tx_status as enum ('draft', 'verified', 'approved');

-- ---------- Tabel ----------
create table public.departments (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  code       text not null unique,
  pic_name   text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cash_types (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text,
  email         text,
  role          user_role not null default 'petugas',
  department_id uuid references public.departments (id) on delete set null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.transactions (
  id            uuid primary key default gen_random_uuid(),
  date          date not null,
  department_id uuid not null references public.departments (id),
  cash_type_id  uuid not null references public.cash_types (id),
  type          tx_type not null,
  amount        bigint not null check (amount > 0),
  category      text,
  description   text,
  proof_url     text,
  status        tx_status not null default 'draft',
  created_by    uuid not null references public.profiles (id),
  verified_by   uuid references public.profiles (id),
  verified_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.weekly_reports (
  id                 uuid primary key default gen_random_uuid(),
  week_start_date    date not null,
  cash_type_id       uuid not null references public.cash_types (id),
  persembahan_mimbar bigint not null default 0 check (persembahan_mimbar >= 0),
  kolekte_ibadah     bigint not null default 0 check (kolekte_ibadah >= 0),
  perpuluhan         bigint not null default 0 check (perpuluhan >= 0),
  persembahan_syukur bigint not null default 0 check (persembahan_syukur >= 0),
  lainnya            bigint not null default 0 check (lainnya >= 0),
  total              bigint not null default 0 check (total >= 0),
  notes              text,
  created_by         uuid not null references public.profiles (id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (week_start_date, cash_type_id)
);

create table public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles (id) on delete set null,
  action     text not null,
  entity     text not null,
  entity_id  uuid,
  meta       jsonb,
  created_at timestamptz not null default now()
);

-- ---------- Index ----------
create index idx_transactions_date          on public.transactions (date);
create index idx_transactions_department_id on public.transactions (department_id);
create index idx_transactions_status        on public.transactions (status);
create index idx_weekly_reports_week        on public.weekly_reports (week_start_date);

-- ---------- Trigger: updated_at otomatis ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_departments_updated_at
  before update on public.departments
  for each row execute function public.set_updated_at();
create trigger trg_cash_types_updated_at
  before update on public.cash_types
  for each row execute function public.set_updated_at();
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();
create trigger trg_weekly_reports_updated_at
  before update on public.weekly_reports
  for each row execute function public.set_updated_at();

-- ---------- Trigger: hitung total weekly_reports ----------
create or replace function public.set_weekly_report_total()
returns trigger
language plpgsql
as $$
begin
  new.total := coalesce(new.persembahan_mimbar, 0)
             + coalesce(new.kolekte_ibadah, 0)
             + coalesce(new.perpuluhan, 0)
             + coalesce(new.persembahan_syukur, 0)
             + coalesce(new.lainnya, 0);
  return new;
end;
$$;

create trigger trg_weekly_reports_total
  before insert or update on public.weekly_reports
  for each row execute function public.set_weekly_report_total();

-- ---------- Trigger: buat profiles untuk user auth baru ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role;
  v_dept uuid;
begin
  -- Ambil role dari metadata; fallback 'petugas' bila kosong/tidak valid.
  begin
    v_role := coalesce(nullif(new.raw_user_meta_data ->> 'role', '')::user_role, 'petugas');
  exception
    when others then v_role := 'petugas';
  end;

  -- Ambil department_id dari metadata bila ada & valid.
  begin
    v_dept := nullif(new.raw_user_meta_data ->> 'department_id', '')::uuid;
  exception
    when others then v_dept := null;
  end;

  insert into public.profiles (id, email, full_name, role, department_id)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), new.email),
    v_role,
    v_dept
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Helper RLS (SECURITY DEFINER agar tidak rekursi) ----------
-- CATATAN PENTING: fungsi peran dinamai `current_user_role` (BUKAN
-- `current_role`) karena CURRENT_ROLE adalah kata kunci Postgres yang
-- direservasi dan tidak boleh dipakai sebagai nama fungsi.
-- SECURITY DEFINER + search_path terkunci membuat fungsi membaca profiles
-- sebagai pemilik tabel (lolos RLS) sehingga policy tidak rekursi.
create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_department()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select department_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('sekretaris', 'bendahara') from public.profiles where id = auth.uid()),
    false
  );
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_department() to authenticated;
grant execute on function public.is_staff() to authenticated;
