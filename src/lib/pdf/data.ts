import { ROLE_LABEL } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/session";
import { aggregateDashboard } from "@/lib/dashboard/aggregate";
import { COUNTED_STATUSES } from "@/lib/dashboard/queries";
import { formatTanggal } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { TxStatus } from "@/lib/validators/transaction";
import { weekRangeLabel } from "@/lib/weekly/week";
import { CHURCH_ADDRESS, CHURCH_NAME } from "./config";
import type { GroupRow, ReportData, ReportMeta } from "./report-document";

const STATUS_LABEL: Record<TxStatus, string> = {
  draft: "Draft",
  verified: "Terverifikasi",
  approved: "Disetujui",
};

export type ExportRange = { from: string; to: string; dept?: string };

function meta(
  profile: Profile,
  opts: {
    title: string;
    periodLabel: string;
    scopeLabel: string;
    basisLabel: string;
  },
): ReportMeta {
  return {
    churchName: CHURCH_NAME,
    churchAddress: CHURCH_ADDRESS,
    title: opts.title,
    periodLabel: opts.periodLabel,
    printedAt: formatTanggal(new Date(), "d MMMM yyyy, HH:mm"),
    printedBy: `${profile.full_name ?? "Pengguna"} (${ROLE_LABEL[profile.role]})`,
    scopeLabel: opts.scopeLabel,
    basisLabel: opts.basisLabel,
  };
}

const periodOf = (r: ExportRange) =>
  `${formatTanggal(r.from)} - ${formatTanggal(r.to)}`;

/** Petugas dikunci ke departemennya (RLS juga menegakkan ini di DB). */
function effectiveDept(profile: Profile, dept?: string): string | undefined {
  if (profile.role === "petugas") return profile.department_id ?? undefined;
  return dept || undefined;
}

/** Laporan harian/rentang: rincian transaksi + subtotal masuk/keluar/saldo. */
export async function buildRangeReport(
  profile: Profile,
  range: ExportRange,
): Promise<ReportData> {
  const supabase = await createClient();
  const dept = effectiveDept(profile, range.dept);

  const [{ data: depts }, { data: cash }] = await Promise.all([
    supabase.from("departments").select("id, name"),
    supabase.from("cash_types").select("id, name"),
  ]);
  const deptName = new Map((depts ?? []).map((d) => [d.id, d.name]));
  const cashName = new Map((cash ?? []).map((c) => [c.id, c.name]));

  let q = supabase
    .from("transactions")
    .select("date, department_id, cash_type_id, type, category, amount, status")
    .gte("date", range.from)
    .lte("date", range.to)
    .order("date", { ascending: true });
  if (dept) q = q.eq("department_id", dept);
  const { data: rows } = await q;

  const list = rows ?? [];
  let income = 0;
  let expense = 0;
  for (const r of list) {
    if (r.type === "income") income += r.amount;
    else expense += r.amount;
  }

  return {
    kind: "range",
    meta: meta(profile, {
      title: "Laporan Transaksi (Rentang Tanggal)",
      periodLabel: periodOf(range),
      scopeLabel: dept
        ? `Departemen: ${deptName.get(dept) ?? "-"}`
        : "Semua departemen",
      // Cocok dengan halaman Pemasukan/Pengeluaran yang menjumlah semua baris terfilter.
      basisLabel: "Semua status (termasuk draft)",
    }),
    rows: list.map((r) => ({
      date: r.date,
      departmentName: deptName.get(r.department_id) ?? "-",
      cashName: cashName.get(r.cash_type_id) ?? "-",
      type: r.type,
      category: r.category,
      amount: r.amount,
      statusLabel: STATUS_LABEL[r.status],
    })),
    income,
    expense,
    saldo: income - expense,
  };
}

/** Laporan mingguan: rekap kas mingguan per jenis kas + total. */
export async function buildWeeklyReport(
  profile: Profile,
  range: ExportRange,
): Promise<ReportData> {
  const supabase = await createClient();

  const [{ data: rows }, { data: cash }] = await Promise.all([
    supabase
      .from("weekly_reports")
      .select(
        "week_start_date, cash_type_id, persembahan_mimbar, kolekte_ibadah, perpuluhan, persembahan_syukur, lainnya, total",
      )
      .gte("week_start_date", range.from)
      .lte("week_start_date", range.to)
      .order("week_start_date", { ascending: true }),
    supabase.from("cash_types").select("id, name"),
  ]);
  const cashName = new Map((cash ?? []).map((c) => [c.id, c.name]));
  const list = rows ?? [];

  return {
    kind: "weekly",
    meta: meta(profile, {
      title: "Laporan Kas Mingguan",
      periodLabel: periodOf(range),
      scopeLabel: "Seluruh jemaat (per jenis kas)",
      basisLabel: "Rekap mingguan tercatat",
    }),
    rows: list.map((r) => ({
      weekLabel: weekRangeLabel(r.week_start_date),
      cashName: cashName.get(r.cash_type_id) ?? "-",
      persembahan_mimbar: r.persembahan_mimbar,
      kolekte_ibadah: r.kolekte_ibadah,
      perpuluhan: r.perpuluhan,
      persembahan_syukur: r.persembahan_syukur,
      lainnya: r.lainnya,
      total: r.total,
    })),
    total: list.reduce((acc, r) => acc + r.total, 0),
  };
}

/** Laporan bulanan: agregat + ringkasan per departemen & per jenis kas. */
export async function buildMonthlyReport(
  profile: Profile,
  range: ExportRange,
): Promise<ReportData> {
  const supabase = await createClient();
  const dept = effectiveDept(profile, range.dept);

  const [{ data: depts }, { data: cash }] = await Promise.all([
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("cash_types").select("id, name").order("name"),
  ]);

  let q = supabase
    .from("transactions")
    .select("date, department_id, cash_type_id, type, amount")
    .gte("date", range.from)
    .lte("date", range.to)
    // Dasar yang SAMA dengan Dashboard agar angka cocok.
    .in("status", COUNTED_STATUSES);
  if (dept) q = q.eq("department_id", dept);
  const { data: rows } = await q;
  const list = rows ?? [];

  // Pakai fungsi agregasi yang SAMA dengan Dashboard → total & per-jenis-kas
  // dijamin identik dengan yang tampil di aplikasi (bukan implementasi kembar).
  const agg = aggregateDashboard(list, cash ?? [], {
    from: range.from,
    to: range.to,
  });

  // Per departemen (khusus laporan bulanan).
  const byDept = new Map<string, { income: number; expense: number }>();
  for (const r of list) {
    const cur = byDept.get(r.department_id) ?? { income: 0, expense: 0 };
    if (r.type === "income") cur.income += r.amount;
    else cur.expense += r.amount;
    byDept.set(r.department_id, cur);
  }

  const deptRef = (depts ?? []).filter((d) => !dept || d.id === dept);
  const perDept: GroupRow[] = deptRef.map((d) => {
    const a = byDept.get(d.id) ?? { income: 0, expense: 0 };
    return {
      name: d.name,
      income: a.income,
      expense: a.expense,
      net: a.income - a.expense,
    };
  });

  return {
    kind: "monthly",
    meta: meta(profile, {
      title: "Laporan Bulanan",
      periodLabel: periodOf(range),
      scopeLabel: dept
        ? `Departemen: ${deptRef[0]?.name ?? "-"}`
        : "Semua departemen",
      basisLabel: "Hanya Terverifikasi & Disetujui",
    }),
    income: agg.income,
    expense: agg.expense,
    saldo: agg.saldo,
    perDept,
    perCash: agg.perCashType.map((c) => ({
      name: c.name,
      income: c.income,
      expense: c.expense,
      net: c.net,
    })),
  };
}
