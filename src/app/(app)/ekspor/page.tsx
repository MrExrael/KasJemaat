import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
} from "date-fns";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProfile, requireRouteAccess } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const FIELD =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export default async function EksporPage() {
  await requireRouteAccess("ekspor");
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { data: depts } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");

  const now = new Date();
  const monthFrom = format(startOfMonth(now), "yyyy-MM-dd");
  const monthTo = format(endOfMonth(now), "yyyy-MM-dd");
  const yearFrom = format(startOfYear(now), "yyyy-MM-dd");
  const yearTo = format(endOfYear(now), "yyyy-MM-dd");

  const isPetugas = profile.role === "petugas";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Ekspor Laporan</h1>
        <p className="text-muted-foreground">
          Unduh laporan PDF berkop.{" "}
          {isPetugas
            ? "Laporan otomatis dibatasi pada departemen Anda."
            : "Pilih periode dan departemen sesuai kebutuhan."}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Rentang / Harian */}
        <Card>
          <CardHeader>
            <CardTitle>Rentang Tanggal</CardTitle>
            <CardDescription>
              Rincian transaksi + subtotal pemasukan, pengeluaran, saldo. Semua
              status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form method="get" action="/api/export" className="space-y-3">
              <input type="hidden" name="variant" value="range" />
              <div className="space-y-1">
                <label
                  className="text-xs text-muted-foreground"
                  htmlFor="r-from"
                >
                  Dari
                </label>
                <input
                  id="r-from"
                  type="date"
                  name="from"
                  defaultValue={monthFrom}
                  className={FIELD}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground" htmlFor="r-to">
                  Sampai
                </label>
                <input
                  id="r-to"
                  type="date"
                  name="to"
                  defaultValue={monthTo}
                  className={FIELD}
                  required
                />
              </div>
              {!isPetugas && (
                <div className="space-y-1">
                  <label
                    className="text-xs text-muted-foreground"
                    htmlFor="r-dept"
                  >
                    Departemen
                  </label>
                  <select id="r-dept" name="dept" className={FIELD}>
                    <option value="">Semua departemen</option>
                    {(depts ?? []).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button type="submit" className={cn(buttonVariants(), "w-full")}>
                Unduh PDF
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Mingguan */}
        <Card>
          <CardHeader>
            <CardTitle>Kas Mingguan</CardTitle>
            <CardDescription>
              Rekap kas mingguan per jenis kas + total keseluruhan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form method="get" action="/api/export" className="space-y-3">
              <input type="hidden" name="variant" value="weekly" />
              <div className="space-y-1">
                <label
                  className="text-xs text-muted-foreground"
                  htmlFor="w-from"
                >
                  Dari
                </label>
                <input
                  id="w-from"
                  type="date"
                  name="from"
                  defaultValue={yearFrom}
                  className={FIELD}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground" htmlFor="w-to">
                  Sampai
                </label>
                <input
                  id="w-to"
                  type="date"
                  name="to"
                  defaultValue={yearTo}
                  className={FIELD}
                  required
                />
              </div>
              <button type="submit" className={cn(buttonVariants(), "w-full")}>
                Unduh PDF
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Bulanan */}
        <Card>
          <CardHeader>
            <CardTitle>Bulanan</CardTitle>
            <CardDescription>
              Agregat + ringkasan per departemen & jenis kas. Hanya
              terverifikasi/disetujui (sama dengan Dashboard).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form method="get" action="/api/export" className="space-y-3">
              <input type="hidden" name="variant" value="monthly" />
              <div className="space-y-1">
                <label
                  className="text-xs text-muted-foreground"
                  htmlFor="m-from"
                >
                  Dari
                </label>
                <input
                  id="m-from"
                  type="date"
                  name="from"
                  defaultValue={monthFrom}
                  className={FIELD}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground" htmlFor="m-to">
                  Sampai
                </label>
                <input
                  id="m-to"
                  type="date"
                  name="to"
                  defaultValue={monthTo}
                  className={FIELD}
                  required
                />
              </div>
              {!isPetugas && (
                <div className="space-y-1">
                  <label
                    className="text-xs text-muted-foreground"
                    htmlFor="m-dept"
                  >
                    Departemen
                  </label>
                  <select id="m-dept" name="dept" className={FIELD}>
                    <option value="">Semua departemen</option>
                    {(depts ?? []).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button type="submit" className={cn(buttonVariants(), "w-full")}>
                Unduh PDF
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
