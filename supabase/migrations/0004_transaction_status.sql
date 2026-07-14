-- =============================================================
-- KasJemaat — Migrasi 0004: Alur verifikasi/approval transaksi
-- Fungsi SECURITY DEFINER (bypass RLS terkontrol) + catat ke audit_log.
-- Transisi: draft -> verified -> approved; revert -> draft (sekretaris saja).
-- =============================================================

-- draft -> verified (sekretaris/bendahara)
create or replace function public.verify_transaction(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid       := auth.uid();
  v_role   user_role  := public.current_user_role();
  v_status tx_status;
begin
  if v_role not in ('sekretaris', 'bendahara') then
    raise exception 'Tidak diizinkan.' using errcode = '42501';
  end if;

  select status into v_status from public.transactions where id = p_id;
  if v_status is null then
    raise exception 'Transaksi tidak ditemukan.';
  end if;
  if v_status <> 'draft' then
    raise exception 'Hanya transaksi draft yang bisa diverifikasi.';
  end if;

  update public.transactions
    set status = 'verified', verified_by = v_uid, verified_at = now()
    where id = p_id;

  insert into public.audit_log (user_id, action, entity, entity_id, meta)
  values (v_uid, 'verify', 'transaction', p_id,
          jsonb_build_object('from', 'draft', 'to', 'verified'));
end;
$$;

-- verified -> approved (sekretaris/bendahara)
create or replace function public.approve_transaction(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid       := auth.uid();
  v_role   user_role  := public.current_user_role();
  v_status tx_status;
begin
  if v_role not in ('sekretaris', 'bendahara') then
    raise exception 'Tidak diizinkan.' using errcode = '42501';
  end if;

  select status into v_status from public.transactions where id = p_id;
  if v_status is null then
    raise exception 'Transaksi tidak ditemukan.';
  end if;
  if v_status <> 'verified' then
    raise exception 'Hanya transaksi terverifikasi yang bisa disahkan.';
  end if;

  update public.transactions
    set status = 'approved', verified_by = v_uid, verified_at = now()
    where id = p_id;

  insert into public.audit_log (user_id, action, entity, entity_id, meta)
  values (v_uid, 'approve', 'transaction', p_id,
          jsonb_build_object('from', 'verified', 'to', 'approved'));
end;
$$;

-- verified/approved -> draft (BUKA KUNCI; sekretaris saja; wajib alasan)
create or replace function public.revert_transaction(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid       := auth.uid();
  v_role   user_role  := public.current_user_role();
  v_status tx_status;
begin
  if v_role <> 'sekretaris' then
    raise exception 'Hanya sekretaris yang bisa membuka kunci.' using errcode = '42501';
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    raise exception 'Alasan wajib diisi.';
  end if;

  select status into v_status from public.transactions where id = p_id;
  if v_status is null then
    raise exception 'Transaksi tidak ditemukan.';
  end if;
  if v_status not in ('verified', 'approved') then
    raise exception 'Hanya transaksi terverifikasi/disahkan yang bisa dibuka.';
  end if;

  update public.transactions
    set status = 'draft', verified_by = null, verified_at = null
    where id = p_id;

  insert into public.audit_log (user_id, action, entity, entity_id, meta)
  values (v_uid, 'revert', 'transaction', p_id,
          jsonb_build_object('from', v_status, 'to', 'draft', 'reason', p_reason));
end;
$$;

grant execute on function public.verify_transaction(uuid) to authenticated;
grant execute on function public.approve_transaction(uuid) to authenticated;
grant execute on function public.revert_transaction(uuid, text) to authenticated;
