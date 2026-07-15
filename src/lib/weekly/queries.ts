import { createClient } from "@/lib/supabase/server";
import type { WeeklyRow } from "@/lib/validators/weekly";

export type RefItem = { id: string; name: string; is_active: boolean };

export type WeeklyData = {
  rows: WeeklyRow[];
  cashTypes: RefItem[];
  /** Total seluruh rekap yang tampil (jumlah kolom total dari DB). */
  totalAll: number;
};

export async function getWeeklyData(): Promise<WeeklyData> {
  const supabase = await createClient();

  const [{ data: rows }, { data: cash }] = await Promise.all([
    supabase
      .from("weekly_reports")
      .select(
        "id, week_start_date, cash_type_id, persembahan_mimbar, kolekte_ibadah, perpuluhan, persembahan_syukur, lainnya, total, notes",
      )
      .order("week_start_date", { ascending: false }),
    supabase.from("cash_types").select("id, name, is_active").order("name"),
  ]);

  const list: WeeklyRow[] = rows ?? [];
  return {
    rows: list,
    cashTypes: cash ?? [],
    totalAll: list.reduce((acc, r) => acc + (r.total ?? 0), 0),
  };
}
