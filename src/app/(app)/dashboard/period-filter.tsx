"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { endOfMonth, format, startOfMonth, subDays, subMonths } from "date-fns";

import { Button } from "@/components/ui/button";

const FIELD =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

export function PeriodFilter({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);

  function push(nf: string, nt: string) {
    const sp = new URLSearchParams({ from: nf, to: nt });
    router.push(`${pathname}?${sp.toString()}`);
  }

  function preset(kind: "month" | "prev" | "30d") {
    const now = new Date();
    let nf: string;
    let nt: string;
    if (kind === "month") {
      nf = fmt(startOfMonth(now));
      nt = fmt(endOfMonth(now));
    } else if (kind === "prev") {
      const p = subMonths(now, 1);
      nf = fmt(startOfMonth(p));
      nt = fmt(endOfMonth(p));
    } else {
      nf = fmt(subDays(now, 29));
      nt = fmt(now);
    }
    setF(nf);
    setT(nt);
    push(nf, nt);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="d-from">
          Dari
        </label>
        <input
          id="d-from"
          type="date"
          className={FIELD}
          value={f}
          onChange={(e) => setF(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="d-to">
          Sampai
        </label>
        <input
          id="d-to"
          type="date"
          className={FIELD}
          value={t}
          onChange={(e) => setT(e.target.value)}
        />
      </div>
      <Button variant="secondary" onClick={() => push(f, t)}>
        Terapkan
      </Button>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => preset("month")}>
          Bulan ini
        </Button>
        <Button variant="ghost" size="sm" onClick={() => preset("prev")}>
          Bulan lalu
        </Button>
        <Button variant="ghost" size="sm" onClick={() => preset("30d")}>
          30 hari
        </Button>
      </div>
    </div>
  );
}
