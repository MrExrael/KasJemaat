import { endOfYear, format, startOfYear } from "date-fns";

import { ExportPdfButton } from "@/components/shared/export-pdf-button";
import { requireRouteAccess } from "@/lib/auth/session";
import { getWeeklyData } from "@/lib/weekly/queries";
import { WeeklyView } from "./weekly-view";

export default async function KasMingguanPage() {
  // Hanya Bendahara yang boleh membuka halaman ini (RLS penjaga akhir).
  await requireRouteAccess("kas-mingguan");

  const data = await getWeeklyData();

  // Rentang ekspor mencakup rekap yang tampil (fallback: tahun berjalan).
  const weeks = data.rows.map((r) => r.week_start_date).sort();
  const now = new Date();
  const expFrom = weeks[0] ?? format(startOfYear(now), "yyyy-MM-dd");
  const expTo = weeks[weeks.length - 1] ?? format(endOfYear(now), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Kas Mingguan</h1>
          <p className="text-muted-foreground">
            Rekap persembahan mingguan per jenis kas (Senin–Minggu).
          </p>
        </div>
        <ExportPdfButton variant="weekly" from={expFrom} to={expTo} />
      </div>

      <WeeklyView data={data} />
    </div>
  );
}
