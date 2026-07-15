import { createClient } from "@/lib/supabase/server";
import type { UserRow } from "@/lib/validators/user";

export type UsersData = {
  rows: UserRow[];
  departments: { id: string; name: string }[];
};

/** Hanya sekretaris yang membuka halaman ini; RLS profiles penjaga akhir. */
export async function getUsersData(): Promise<UsersData> {
  const supabase = await createClient();

  const [{ data: rows }, { data: depts }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role, department_id, is_active")
      .order("full_name"),
    supabase.from("departments").select("id, name").order("name"),
  ]);

  return { rows: rows ?? [], departments: depts ?? [] };
}
