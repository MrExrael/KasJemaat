import {
  differenceInCalendarDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  format,
  parseISO,
} from "date-fns";
import { id as localeId } from "date-fns/locale";

import { mondayOf } from "@/lib/weekly/week";

/** Baris minimal yang dihitung (sudah difilter periode + status di query). */
export type CountedRow = {
  date: string;
  type: "income" | "expense";
  amount: number;
  cash_type_id: string;
};

export type TrendBucket = { label: string; income: number; expense: number };

export type CashSummary = {
  id: string;
  name: string;
  income: number;
  expense: number;
  net: number;
};

export type Aggregated = {
  income: number;
  expense: number;
  saldo: number;
  perCashType: CashSummary[];
  trend: TrendBucket[];
  granularity: "day" | "week";
};

/**
 * Agregasi murni (deterministik, tanpa I/O) — mudah diuji & dipakai server component.
 * Tren dibucket per hari bila rentang <= 31 hari, selain itu per minggu (Senin).
 */
export function aggregateDashboard(
  rows: CountedRow[],
  cashList: { id: string; name: string }[],
  range: { from: string; to: string },
): Aggregated {
  let income = 0;
  let expense = 0;
  const cashAgg = new Map<string, { income: number; expense: number }>();

  for (const r of rows) {
    if (r.type === "income") income += r.amount;
    else expense += r.amount;

    const cur = cashAgg.get(r.cash_type_id) ?? { income: 0, expense: 0 };
    if (r.type === "income") cur.income += r.amount;
    else cur.expense += r.amount;
    cashAgg.set(r.cash_type_id, cur);
  }

  const perCashType: CashSummary[] = cashList.map((c) => {
    const a = cashAgg.get(c.id) ?? { income: 0, expense: 0 };
    return { id: c.id, name: c.name, income: a.income, expense: a.expense, net: a.income - a.expense };
  });

  const start = parseISO(range.from);
  const end = parseISO(range.to);
  const granularity: "day" | "week" =
    differenceInCalendarDays(end, start) + 1 <= 31 ? "day" : "week";

  const points =
    granularity === "day"
      ? eachDayOfInterval({ start, end })
      : eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });

  const buckets = points.map((d) => ({
    key: format(d, "yyyy-MM-dd"),
    label: format(d, "d MMM", { locale: localeId }),
  }));
  const bucketMap = new Map(
    buckets.map((b) => [b.key, { income: 0, expense: 0 }]),
  );

  for (const r of rows) {
    const key = granularity === "day" ? r.date : mondayOf(r.date);
    const b = bucketMap.get(key);
    if (!b) continue;
    if (r.type === "income") b.income += r.amount;
    else b.expense += r.amount;
  }

  const trend: TrendBucket[] = buckets.map((b) => {
    const v = bucketMap.get(b.key) ?? { income: 0, expense: 0 };
    return { label: b.label, income: v.income, expense: v.expense };
  });

  return { income, expense, saldo: income - expense, perCashType, trend, granularity };
}
