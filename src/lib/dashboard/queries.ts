import type { Profile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { TxStatus, TxType } from "@/lib/validators/transaction";
import { aggregateDashboard } from "./aggregate";
import type { CashSummary, TrendBucket } from "./aggregate";

export type { CashSummary, TrendBucket };

/**
 * Status yang dihitung pada ringkasan & grafik: hanya `verified` & `approved`.
 * Alasan: `draft` belum diperiksa siapa pun, jadi memasukkannya membuat angka
 * keuangan menyesatkan. Draft tetap tampil di daftar "transaksi terbaru".
 */
export const COUNTED_STATUSES: TxStatus[] = ["verified", "approved"];

export type RecentRow = {
  id: string;
  date: string;
  type: TxType;
  amount: number;
  status: TxStatus;
  category: string | null;
  departmentName: string;
};

export type DashboardData = {
  from: string;
  to: string;
  income: number;
  expense: number;
  saldo: number;
  countedCount: number;
  perCashType: CashSummary[];
  trend: TrendBucket[];
  granularity: "day" | "week";
  recent: RecentRow[];
};

/**
 * Ambil data dashboard. Kolom seminimal mungkin & sudah difilter periode/status
 * di sisi DB. Sengaja TIDAK memakai RPC SECURITY DEFINER agar RLS tetap berlaku —
 * itulah yang mengunci petugas ke departemennya sendiri.
 */
export async function getDashboardData(
  _profile: Profile,
  range: { from: string; to: string },
): Promise<DashboardData> {
  const supabase = await createClient();

  const [{ data: counted }, { data: recentRaw }, { data: cash }, { data: depts }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("date, type, amount, cash_type_id")
        .gte("date", range.from)
        .lte("date", range.to)
        .in("status", COUNTED_STATUSES),
      supabase
        .from("transactions")
        .select("id, date, type, amount, status, category, department_id")
        .gte("date", range.from)
        .lte("date", range.to)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("cash_types").select("id, name").order("name"),
      supabase.from("departments").select("id, name"),
    ]);

  const rows = counted ?? [];
  const agg = aggregateDashboard(rows, cash ?? [], range);

  const deptName = new Map((depts ?? []).map((d) => [d.id, d.name]));
  const recent: RecentRow[] = (recentRaw ?? []).map((r) => ({
    id: r.id,
    date: r.date,
    type: r.type,
    amount: r.amount,
    status: r.status,
    category: r.category,
    departmentName: deptName.get(r.department_id) ?? "—",
  }));

  return {
    from: range.from,
    to: range.to,
    ...agg,
    countedCount: rows.length,
    recent,
  };
}
