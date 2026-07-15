import { requireRouteAccess } from "@/lib/auth/session";
import { getWeeklyData } from "@/lib/weekly/queries";
import { WeeklyView } from "./weekly-view";

export default async function KasMingguanPage() {
  // Hanya Bendahara yang boleh membuka halaman ini (RLS penjaga akhir).
  await requireRouteAccess("kas-mingguan");

  const data = await getWeeklyData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Kas Mingguan</h1>
        <p className="text-muted-foreground">
          Rekap persembahan mingguan per jenis kas (Senin–Minggu).
        </p>
      </div>

      <WeeklyView data={data} />
    </div>
  );
}
